import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from pydantic import BaseModel, EmailStr, Field, model_validator
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.src.config.database import get_db
from app.src.services.persistence_service import (
    mark_user_active,
    record_login_event,
    record_refresh_token,
    record_user_session,
)
from app.src.models.user import User
from app.src.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_secure_otp,
    generate_secure_token,
)
from app.src.utils.rate_limiter import rate_limit_auth

logger = logging.getLogger("EduSim.AuthRouter")

auth_router = APIRouter(tags=["Authentication"])


def normalize_email(raw_email: str) -> str:
    return raw_email.strip().lower()


# --- Pydantic Schemas ---

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    role: str = Field("student", pattern="^(student|teacher|admin)$")
    mobile_number: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_mobile_number(cls, values):
        if isinstance(values, dict) and not values.get("mobile_number"):
            mobile = values.get("mobile")
            if mobile:
                values["mobile_number"] = mobile
        return values


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=16, max_length=255)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=16, max_length=255)
    new_password: str = Field(..., min_length=8, max_length=72)


class SendOtpRequest(BaseModel):
    country_code: str = Field("+91")
    mobile_number: str = Field(..., min_length=5, max_length=15)


class VerifyOtpRequest(BaseModel):
    mobile_number: str
    otp_code: str = Field(..., min_length=6, max_length=6)


class UserResponse(BaseModel):
    id: UUID
    name: Optional[str]
    email: str
    role: str
    mobile_number: Optional[str] = None
    is_email_verified: bool
    is_mobile_verified: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegisterResponse(BaseModel):
    success: bool = True
    message: str
    id: UUID


# --- Helper to get current user from token ---

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is expired or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload contains no user ID",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(str(user_id))
    except (ValueError, TypeError, AttributeError):
        user_uuid = user_id

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    mark_user_active(db, user)
    db.commit()

    return user


# --- Routes ---

@auth_router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user, hashes password, and sends virtual email verification."""
    email = normalize_email(request.email)

    existing_user = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    if request.mobile_number:
        existing_mobile_user = db.query(User).filter(User.mobile_number == request.mobile_number).first()
        if existing_mobile_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mobile number is already registered"
            )

        if not request.mobile_number.isdigit() or len(request.mobile_number) != 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid mobile number"
            )

    if len(request.password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password cannot exceed 72 bytes"
        )

    # Secure CSPRNG verification token with 24-hour expiration window
    verification_token = generate_secure_token(32)
    verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)

    # Securely hash password with bcrypt
    hashed_pwd = hash_password(request.password)

    new_user = User(
        name=request.name.strip(),
        email=email,
        password_hash=hashed_pwd,
        role=request.role,
        mobile_number=request.mobile_number,
        is_email_verified=False,
        is_mobile_verified=False,
        verification_token=verification_token,
        verification_token_expires_at=verification_expires,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {e}")

    logger.info(f"User account registered successfully: {new_user.email} (role: {new_user.role})")

    return RegisterResponse(
        success=True,
        message="Account created successfully. Please verify your email.",
        id=new_user.id,
    )


@auth_router.post("/login", response_model=TokenResponse, dependencies=[Depends(rate_limit_auth)])
def login(request: LoginRequest, http_request: Request, db: Session = Depends(get_db)):
    """
    Logs in user using email and password, issuing access & refresh tokens.
    All users (including administrators) authenticate via secure bcrypt verification.
    Hardcoded credentials and backdoor bypasses have been completely removed.
    """
    email = normalize_email(request.email)
    client_ip = http_request.client.host if http_request.client else None
    user_agent = http_request.headers.get("user-agent")

    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user or not verify_password(request.password, user.password_hash):
        try:
            record_login_event(
                db,
                user=user,
                email=email,
                success=False,
                provider="password",
                ip_address=client_ip,
                user_agent=user_agent,
                failure_reason="Invalid email or password",
            )
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Generate cryptographically signed JWT tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    record_login_event(
        db,
        user=user,
        email=user.email,
        success=True,
        provider="password",
        ip_address=client_ip,
        user_agent=user_agent,
    )
    record_user_session(
        db,
        user=user,
        session_key=refresh_token,
        user_agent=user_agent,
        ip_address=client_ip,
        metadata={"source": "password-login"},
    )
    record_refresh_token(
        db,
        user=user,
        token_jti=refresh_token,
        user_agent=user_agent,
        ip_address=client_ip,
        metadata={"source": "password-login"},
    )
    user.last_login_at = datetime.now(timezone.utc)
    user.last_active_at = user.last_login_at
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to persist login session")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
        "message": "Welcome back!"
    }


@auth_router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refreshes access token using refresh token."""
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = payload.get("sub")
    try:
        user_uuid = uuid.UUID(str(user_id))
    except (ValueError, TypeError, AttributeError):
        user_uuid = user_id
    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    mark_user_active(db, user)
    record_user_session(
        db,
        user=user,
        session_key=request.refresh_token,
        metadata={"source": "refresh"},
    )
    record_refresh_token(db, user=user, token_jti=request.refresh_token, metadata={"source": "refresh"})
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to persist refreshed session")

    # Re-issue both tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user
    }


@auth_router.post("/verify-email")
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Verifies user email using a dedicated verification token.
    Separated from password-reset tokens; enforces expiration and one-time use.
    """
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.verification_token == request.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )

    if user.verification_token_expires_at:
        expiry = user.verification_token_expires_at
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if now > expiry:
            user.verification_token = None
            user.verification_token_expires_at = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has expired. Please request a new verification link."
            )

    user.is_email_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    db.commit()

    logger.info(f"Email verified successfully for user {user.email}")
    return {"success": True, "message": "Email verified successfully."}


@auth_router.post("/forgot-password", dependencies=[Depends(rate_limit_auth)])
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generates a dedicated password-reset token with a 1-hour expiration.
    Completely isolated from the email verification token to prevent token reuse.
    Rate-limited to prevent enumeration and denial of service.
    """
    email = normalize_email(request.email)
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        # Standard generic response to prevent user enumeration
        return {"success": True, "message": "If an account exists with this email, password reset instructions have been sent."}

    reset_token = generate_secure_token(32)
    user.reset_password_token = reset_token
    user.reset_password_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    logger.info(f"Password reset token issued for user {user.email} (expires in 1h).")
    return {"success": True, "message": "If an account exists with this email, password reset instructions have been sent."}


@auth_router.post("/reset-password", dependencies=[Depends(rate_limit_auth)])
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Resets user password with a dedicated reset token.
    Enforces expiration, updates password hash via bcrypt, and invalidates the token.
    """
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(User.reset_password_token == request.token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    if user.reset_password_token_expires_at:
        expiry = user.reset_password_token_expires_at
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if now > expiry:
            user.reset_password_token = None
            user.reset_password_token_expires_at = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired. Please request a new password reset."
            )

    user.password_hash = hash_password(request.new_password)
    user.reset_password_token = None
    user.reset_password_token_expires_at = None
    db.commit()

    logger.info(f"Password reset completed successfully for user {user.email}")
    return {"success": True, "message": "Password reset completed successfully."}


@auth_router.post("/send-otp", dependencies=[Depends(rate_limit_auth)])
def send_otp(request: SendOtpRequest, db: Session = Depends(get_db)):
    """
    Generates a cryptographically secure 6-digit OTP code using CSPRNG.
    Rate-limited to prevent SMS abuse and brute force.
    """
    user = db.query(User).filter(User.mobile_number == request.mobile_number).first()

    if not user:
        mock_email = f"mobile_{request.mobile_number[-4:]}@edusim.com"
        user = db.query(User).filter(User.email == mock_email).first()
        if not user:
            user = User(
                name="Mobile Student",
                email=mock_email,
                password_hash=hash_password(generate_secure_token(16)),
                role="student",
                mobile_number=request.mobile_number,
                is_email_verified=True,
                is_mobile_verified=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    # Use CSPRNG secrets generator instead of random.randint
    otp = generate_secure_otp(6)
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)

    user.otp_code = otp
    user.otp_expires_at = expires
    db.commit()

    logger.info(f"CSPRNG OTP dispatched for {request.country_code}{request.mobile_number[:4]}**** (expires in 10m).")
    return {"success": True, "message": "OTP sent successfully."}


@auth_router.post("/verify-otp", response_model=TokenResponse, dependencies=[Depends(rate_limit_auth)])
def verify_otp(request: VerifyOtpRequest, db: Session = Depends(get_db)):
    """Verifies OTP and logs in user, issuing tokens."""
    user = db.query(User).filter(User.mobile_number == request.mobile_number).first()
    if not user or not user.otp_code or user.otp_code != request.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )

    now = datetime.now(timezone.utc)
    otp_expiry = user.otp_expires_at
    if otp_expiry:
        if otp_expiry.tzinfo is None:
            otp_expiry = otp_expiry.replace(tzinfo=timezone.utc)
        if now > otp_expiry:
            user.otp_code = None
            user.otp_expires_at = None
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP code has expired"
            )

    user.is_mobile_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    user.last_login_at = datetime.now(timezone.utc)
    user.last_active_at = user.last_login_at
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to persist login session")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    record_user_session(db, user=user, session_key=refresh_token, metadata={"source": "otp"})
    record_refresh_token(db, user=user, token_jti=refresh_token, metadata={"source": "otp"})
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
        "message": "Welcome back!"
    }


@auth_router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile for currently logged in user."""
    return current_user


@auth_router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logs out user and invalidates active session state."""
    from app.src.models.persistence import UserSession
    try:
        sessions = db.query(UserSession).filter(UserSession.user_id == current_user.id, UserSession.is_active == True).all()
        for s in sessions:
            s.is_active = False
            s.last_logout_at = datetime.now(timezone.utc)
        db.commit()
    except Exception:
        db.rollback()
    return {"success": True, "message": "Logged out successfully."}

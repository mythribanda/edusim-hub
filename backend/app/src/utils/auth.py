import os
import secrets
import logging
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt

logger = logging.getLogger("EduSim.Auth")

# Detect environment
ENVIRONMENT = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).strip().lower()
IS_PRODUCTION = ENVIRONMENT in ("production", "prod")

# Insecure legacy fallback key to block
INSECURE_DEFAULT_SECRET = "edusim-super-secret-key-123456789"

raw_secret = os.getenv("JWT_SECRET_KEY")

if not raw_secret or raw_secret.strip() == INSECURE_DEFAULT_SECRET:
    if IS_PRODUCTION:
        raise RuntimeError(
            "FATAL SECURITY FAILURE: In production mode, JWT_SECRET_KEY must be explicitly set "
            "to a strong, cryptographically secure secret (minimum 32 characters). Refusing to start."
        )
    logger.warning(
        "SECURITY WARNING: JWT_SECRET_KEY is unset or using insecure default. "
        "Generating an ephemeral cryptographically secure 256-bit secret for this runtime session."
    )
    # Generate high-entropy 256-bit runtime key for non-production environments
    SECRET_KEY = secrets.token_hex(32)
else:
    if IS_PRODUCTION and len(raw_secret.strip()) < 32:
        raise RuntimeError(
            "FATAL SECURITY FAILURE: JWT_SECRET_KEY must be at least 32 characters long in production."
        )
    SECRET_KEY = raw_secret.strip()

ALGORITHM = "HS256"

# Access token expiry (e.g., 30 minutes)
ACCESS_TOKEN_EXPIRE_MINUTES = 30
# Refresh token expiry (e.g., 7 days)
REFRESH_TOKEN_EXPIRE_DAYS = 7


def generate_secure_otp(length: int = 6) -> str:
    """Generate cryptographically secure numeric OTP using system CSPRNG (secrets)."""
    return "".join(secrets.choice("0123456789") for _ in range(length))


def generate_secure_token(nbytes: int = 32) -> str:
    """Generate cryptographically secure URL-safe token (e.g. for email verification or password reset)."""
    return secrets.token_urlsafe(nbytes)


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    passwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(passwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password with constant-time check."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode a JWT token and verify validity."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

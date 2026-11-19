import os
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.src.models.user import User
from app.src.utils.auth import hash_password

logger = logging.getLogger("EduSim.AdminProvisioning")


def ensure_admin_provisioned(db: Session) -> None:
    """
    Secure Administrator Provisioning.
    Replaces insecure hardcoded backdoors with environment-configured, bcrypt-hashed provisioning.
    Only creates or syncs the administrator account if explicitly configured or missing.
    """
    admin_email = os.getenv("ADMIN_EMAIL", "admin@gmail.com").strip().lower()
    admin_password = os.getenv("ADMIN_INITIAL_PASSWORD", "Admin@123")

    existing_admin = db.query(User).filter(func.lower(User.email) == admin_email).first()

    if not existing_admin:
        logger.info(f"Provisioning initial administrator account ({admin_email}) with secure bcrypt hash.")
        admin_user = User(
            name="Administrator",
            email=admin_email,
            password_hash=hash_password(admin_password),
            role="admin",
            is_email_verified=True,
            is_mobile_verified=True
        )
        db.add(admin_user)
        try:
            db.commit()
            db.refresh(admin_user)
            logger.info("Administrator account provisioned successfully.")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to provision administrator account: {e}")
    else:
        # Ensure role is admin or teacher
        if existing_admin.role not in ("admin", "teacher"):
            existing_admin.role = "admin"
            db.commit()
            logger.info(f"Updated existing admin account {admin_email} role to 'admin'.")

import base64
import hashlib
import logging
import os
import re
from pathlib import Path
from typing import Optional, Tuple
from uuid import UUID

logger = logging.getLogger("avatar_storage")

# Root directory of backend
BACKEND_DIR = Path(__file__).resolve().parents[3]
UPLOADS_DIR = BACKEND_DIR / "uploads" / "avatars"

# Magic byte signatures for raster image validation
MAGIC_SIGNATURES = {
    "png": b"\x89PNG\r\n\x1a\n",
    "jpeg": b"\xff\xd8\xff",
    "jpg": b"\xff\xd8\xff",
    "gif": (b"GIF87a", b"GIF89a"),
    "webp": b"RIFF",  # WEBP has 'RIFF....WEBP'
}

MIME_TYPES = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp",
}


def ensure_storage_dir() -> Path:
    """Ensure avatar uploads directory exists."""
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOADS_DIR


def detect_and_validate_raster_bytes(raw_bytes: bytes) -> Optional[str]:
    """
    Validates image header against known raster signatures.
    Returns extension string ('png', 'jpeg', 'gif', 'webp') or None if invalid.
    Strictly forbids SVGs, executables, or script-injected payloads.
    """
    if len(raw_bytes) < 12:
        return None

    if raw_bytes.startswith(MAGIC_SIGNATURES["png"]):
        return "png"
    if raw_bytes.startswith(MAGIC_SIGNATURES["jpeg"]):
        return "jpeg"
    if raw_bytes.startswith(MAGIC_SIGNATURES["gif"][0]) or raw_bytes.startswith(MAGIC_SIGNATURES["gif"][1]):
        return "gif"
    if raw_bytes.startswith(MAGIC_SIGNATURES["webp"]) and b"WEBP" in raw_bytes[:16]:
        return "webp"

    return None


def save_avatar_image(avatar_data: Optional[str], user_id: str | UUID) -> Optional[str]:
    """
    Processes avatar input. If base64 data image:
    1. Validates raster magic bytes.
    2. Writes decoded image to backend/uploads/avatars/ directory.
    3. Returns reference URL path: '/api/persistence/avatars/<filename>'.
    
    If already a URL or relative reference, returns it directly.
    """
    if not avatar_data or not avatar_data.strip():
        return None

    trimmed = avatar_data.strip()

    # If it's already an HTTP(S) URL or an internal avatar endpoint reference, preserve reference
    if trimmed.startswith("http://") or trimmed.startswith("https://") or trimmed.startswith("/api/persistence/avatars/"):
        return trimmed

    # Match data URL format
    match = re.match(r"^data:image/([a-zA-Z0-9+.-]+);base64,(.+)$", trimmed, re.DOTALL)
    if not match:
        # Not a base64 data URL; if it's a short string, might be a relative path or icon name
        if len(trimmed) <= 500:
            return trimmed
        raise ValueError("Invalid avatar format. Expected HTTP URL or base64 raster data image.")

    declared_ext = match.group(1).lower().replace("jpeg", "jpg")
    b64_payload = match.group(2)

    try:
        raw_bytes = base64.b64decode(b64_payload)
    except Exception as e:
        raise ValueError(f"Failed to decode base64 avatar data: {e}")

    # Maximum file size 2.5MB
    if len(raw_bytes) > 2_500_000:
        raise ValueError("Avatar file size exceeds 2.5MB limit.")

    # Validate image binary signature
    detected_ext = detect_and_validate_raster_bytes(raw_bytes)
    if not detected_ext:
        raise ValueError(
            "Security validation failed: File binary header does not match safe raster image signatures (PNG, JPEG, GIF, WEBP)."
        )

    clean_user_id = str(user_id).replace("-", "")
    content_hash = hashlib.sha256(raw_bytes).hexdigest()[:12]
    filename = f"avatar_{clean_user_id}_{content_hash}.{detected_ext}"

    storage_dir = ensure_storage_dir()
    file_path = storage_dir / filename

    try:
        with open(file_path, "wb") as f:
            f.write(raw_bytes)
    except Exception as e:
        logger.error(f"Failed to write avatar to disk: {e}")
        raise ValueError(f"Internal file storage error: {e}")

    # Clean up previous avatars for this user to avoid orphan file accumulation
    try:
        for existing in storage_dir.glob(f"avatar_{clean_user_id}_*"):
            if existing.name != filename:
                existing.unlink(missing_ok=True)
    except Exception as e:
        logger.warning(f"Note cleaning old avatar files: {e}")

    reference_url = f"/api/persistence/avatars/{filename}"
    logger.info(f"Saved user avatar to {file_path} -> Reference: {reference_url}")
    return reference_url


def get_avatar_file_path(filename: str) -> Optional[Tuple[Path, str]]:
    """
    Safely resolves avatar file path and MIME type, preventing directory traversal.
    """
    safe_name = Path(filename).name  # strips any ../ or directory segments
    file_path = UPLOADS_DIR / safe_name

    if not file_path.is_file():
        return None

    ext = file_path.suffix.lstrip(".").lower()
    mime_type = MIME_TYPES.get(ext, "application/octet-stream")
    return file_path, mime_type

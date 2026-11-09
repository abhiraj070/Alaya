import cloudinary
import cloudinary.uploader
from urllib.parse import unquote, urlsplit
from app.env_config.settings import get_settings

settings = get_settings()

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def upload_file(file_path, filename: str | None = None) -> dict:
    return cloudinary.uploader.upload(
        str(file_path),
        resource_type="auto",
        filename_override=filename,
        use_filename=True,
        unique_filename=True,
    )


def delete_file(public_id: str, resource_type: str = "image") -> dict:
    return cloudinary.uploader.destroy(
        public_id,
        resource_type=resource_type,
        invalidate=True,
    )


def cloud_file_reference(url: str) -> tuple[str, str]:
    """Read the public ID from a legacy, untransformed Cloudinary upload URL."""
    parsed = urlsplit(url)
    parts = parsed.path.strip("/").split("/")
    if (parsed.hostname != "res.cloudinary.com" or len(parts) < 5
            or parts[0] != settings.CLOUDINARY_CLOUD_NAME or parts[1] not in {"image", "video", "raw"}
            or parts[2] != "upload" or not parts[3].startswith("v") or not parts[3][1:].isdigit()):
        raise ValueError("Cloud file metadata is missing; cannot safely delete this file")
    resource_type = parts[1]
    public_id = unquote("/".join(parts[4:]))
    if resource_type != "raw":
        public_id = public_id.rsplit(".", 1)[0]
    return public_id, resource_type

import cloudinary
import cloudinary.uploader
from app.db.connect import get_settings

settings = get_settings()

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def upload_file(file_path, filename: str | None = None) -> dict:
    """Upload a locally stored file to Cloudinary."""
    return cloudinary.uploader.upload(
        str(file_path),
        resource_type="auto",
        filename_override=filename,
        use_filename=True,
        unique_filename=True,
    )

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

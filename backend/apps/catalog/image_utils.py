from PIL import Image


def validate_uploaded_image(upload) -> bool:
    """Validate image and reset file pointer for Django storage."""
    upload.seek(0)
    try:
        with Image.open(upload) as img:
            img.load()
            if img.format not in {"JPEG", "PNG", "WEBP", "GIF"}:
                return False
    except Exception:
        return False
    upload.seek(0)
    return True

import os
import uuid
from flask import current_app
from werkzeug.utils import secure_filename

ALLOWED_IMAGE_EXTS = {"png", "jpg", "jpeg", "gif", "webp"}


def uploads_root() -> str:
    base = current_app.config["UPLOADS_FOLDER"]
    if not os.path.isabs(base):
        base = os.path.join(current_app.root_path, "..", base)
    return os.path.abspath(base)


def save_image(file_storage) -> str:
    """Save an uploaded image to uploads/images/, return relative path."""
    ext = (file_storage.filename.rsplit(".", 1)[-1] or "").lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise ValueError(f"File type .{ext} not allowed")

    images_dir = os.path.join(uploads_root(), "images")
    os.makedirs(images_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}.{ext}"
    file_storage.save(os.path.join(images_dir, filename))
    return f"uploads/images/{filename}"

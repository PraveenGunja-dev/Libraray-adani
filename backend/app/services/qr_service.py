import os
import qrcode
from flask import current_app
from app.utils.storage import uploads_root


def _qr_dir() -> str:
    qr_dir = os.path.join(uploads_root(), "qr")
    os.makedirs(qr_dir, exist_ok=True)
    return qr_dir


def _build_scan_url(token: str) -> str:
    """Build the frontend scan URL for a QR token.

    Uses the FRONTEND_URL env var if set, otherwise defaults to a
    path-based URL that works when scanned from any device on the
    same network.
    """
    # Scanning is an admin/librarian-desk workflow, not employee self-service —
    # the QR must resolve to the admin scan screen.
    frontend_url = os.environ.get("FRONTEND_URL", "https://digitalized-dpr-uat.adani.com/library")
    if frontend_url:
        return f"{frontend_url.rstrip('/')}/admin/scan?token={token}"
    # Fallback: encode just the path — when scanned with a phone camera,
    # most QR apps will try to open it as a URL if it looks like one.
    # We use a relative path that the frontend can handle.
    return f"/admin/scan?token={token}"


def generate_qr_png(token: str) -> str:
    """Generate a QR PNG encoding a scannable URL, save to uploads/qr/, return relative path."""
    qr_dir = _qr_dir()
    filename = f"{token}.png"
    filepath = os.path.join(qr_dir, filename)

    scan_url = _build_scan_url(token)

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(scan_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filepath)

    return f"uploads/qr/{filename}"


def generate_book_qr(book) -> str:
    """Generate QR for book.qr_token; update book.qr_code_path in-place."""
    path = generate_qr_png(book.qr_token)
    book.qr_code_path = path
    return path


def generate_copy_qr(copy) -> str:
    """Generate QR for book_copy.qr_token."""
    return generate_qr_png(copy.qr_token)

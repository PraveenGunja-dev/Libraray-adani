import base64
import os
import uuid

from flask import Blueprint, current_app, jsonify, make_response, request, send_file
# pyrefly: ignore [missing-import]
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.extensions import db
from app.models.book import Book
from app.models.book_copy import BookCopy
from app.services.excel_service import parse_excel_books
from app.services.qr_service import generate_book_qr, generate_copy_qr
from app.utils.storage import save_image, uploads_root

books_bp = Blueprint("books", __name__, url_prefix="/api/books")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_admin() -> bool:
    return get_jwt().get("role") == "admin"


def _require_admin():
    if not _is_admin():
        return jsonify({"error": "Admin access required"}), 403
    return None


def _create_book_with_copies(data: dict, image_file=None, quantity: int = 1) -> Book:
    """Persist a Book + N BookCopy rows and generate the book-level QR."""
    book = Book(
        title=data.get("title", ""),
        author=data.get("author") or None,
        year=int(data["year"]) if data.get("year") else None,
        publisher=data.get("publisher") or None,
        isbn=data.get("isbn") or None,
        format=data.get("format") or None,
        price=float(data["price"]) if data.get("price") else None,
        currency=data.get("currency") or "INR",
        category=data.get("category") or None,
        qr_token=uuid.uuid4().hex,
        default_borrow_days=int(data.get("default_borrow_days") or 7),
    )

    if image_file and image_file.filename:
        book.image_path = save_image(image_file)

    db.session.add(book)
    db.session.flush()  # get book.id before generating copy codes

    generate_book_qr(book)  # sets book.qr_code_path

    for i in range(quantity):
        copy = BookCopy(
            book_id=book.id,
            copy_code=f"COPY-{book.id}-{i + 1:03d}",
            qr_token=uuid.uuid4().hex,
        )
        db.session.add(copy)

    db.session.commit()
    return book


def _book_summary(book: Book) -> dict:
    """Return book dict augmented with copy counts."""
    d = book.to_dict()
    copies = BookCopy.query.filter_by(book_id=book.id).filter(
        BookCopy.status != "removed"
    )
    d["total_copies"] = copies.count()
    d["available_copies"] = copies.filter_by(status="available").count()
    return d


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@books_bp.get("/")
@jwt_required()
def list_books():
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    status_filter = request.args.get("status", "").strip()
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(200, max(1, int(request.args.get("per_page", 100))))

    q = Book.query
    if not _is_admin():
        q = q.filter_by(is_active=True)

    if search:
        like = f"%{search}%"
        q = q.filter(
            db.or_(
                Book.title.ilike(like),
                Book.author.ilike(like),
                Book.isbn.ilike(like),
            )
        )
    if category:
        q = q.filter(Book.category == category)

    if status_filter:
        q = q.filter(
            Book.id.in_(
                db.session.query(BookCopy.book_id)
                .filter(BookCopy.status == status_filter)
                .distinct()
            )
        )

    total = q.count()
    books = q.order_by(Book.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return jsonify(
        {
            "books": [_book_summary(b) for b in books],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": max(1, (total + per_page - 1) // per_page),
        }
    ), 200


@books_bp.get("/scan/<qr_token>")
@jwt_required()
def scan_qr(qr_token: str):
    """Resolve a QR token to a book (and copy if it's a copy-level token)."""
    # Check book-level token first
    book = Book.query.filter_by(qr_token=qr_token).first()
    if book:
        return jsonify({"book": _book_summary(book), "copy": None}), 200

    # Check copy-level token
    copy = BookCopy.query.filter_by(qr_token=qr_token).first()
    if copy:
        return jsonify({"book": _book_summary(copy.book), "copy": copy.to_dict()}), 200

    return jsonify({"error": "QR token not found"}), 404


@books_bp.get("/qr-sheet")
@jwt_required()
def qr_sheet():
    err = _require_admin()
    if err:
        return err

    ids_raw = request.args.get("ids", "")
    ids = [int(x) for x in ids_raw.split(",") if x.strip().isdigit()]
    if not ids:
        return jsonify({"error": "Provide ?ids=1,2,3"}), 400

    books = Book.query.filter(Book.id.in_(ids)).all()

    items_html = ""
    for book in books:
        generate_book_qr(book)
        db.session.commit()

        qr_file = os.path.join(uploads_root(), "qr", f"{book.qr_token}.png")
        img_src = ""
        if os.path.exists(qr_file):
            with open(qr_file, "rb") as f:
                img_src = "data:image/png;base64," + base64.b64encode(f.read()).decode()

        items_html += f"""
        <div class="qr-item">
            <img src="{img_src}" alt="QR" />
            <p class="title">{book.title}</p>
            <p class="meta">{book.isbn or ""}</p>
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>QR Sheet</title>
<style>
  body {{ font-family: sans-serif; padding: 20px; margin: 0; }}
  .sheet {{ display: flex; flex-wrap: wrap; gap: 16px; }}
  .qr-item {{ width: 180px; border: 1px solid #ccc; padding: 10px; text-align: center; page-break-inside: avoid; }}
  .qr-item img {{ width: 150px; height: 150px; }}
  .title {{ font-weight: bold; font-size: 11px; margin: 6px 0 2px; word-break: break-word; }}
  .meta  {{ font-size: 10px; color: #666; margin: 0; }}
  @media print {{ body {{ padding: 0; }} }}
</style>
</head>
<body>
<div class="sheet">{items_html}</div>
<script>window.onload = function() {{ window.print(); }};</script>
</body>
</html>"""

    resp = make_response(html, 200)
    resp.headers["Content-Type"] = "text/html; charset=utf-8"
    return resp


@books_bp.get("/<int:book_id>")
@jwt_required()
def get_book(book_id: int):
    book = Book.query.get_or_404(book_id)
    return jsonify({"book": book.to_dict(include_copies=True)}), 200


@books_bp.post("/")
@jwt_required()
def create_book():
    err = _require_admin()
    if err:
        return err

    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})
    image_file = request.files.get("image")

    if not data.get("title"):
        return jsonify({"error": "title is required"}), 400

    quantity = max(1, int(data.pop("quantity", 1) or 1))
    
    isbn = (data.get("isbn") or "").strip()
    title = (data.get("title") or "").strip()
    author = (data.get("author") or "").strip()

    existing = None
    if isbn:
        existing = Book.query.filter(db.func.lower(Book.isbn) == isbn.lower()).first()
    if not existing and title:
        q = Book.query.filter(db.func.lower(Book.title) == title.lower())
        if author:
            q = q.filter(db.func.lower(Book.author) == author.lower())
        existing = q.first()
        
    if existing:
        # If the book already exists, just add the new copies to it.
        # We can update the price if a new one is provided.
        if data.get("price"):
            existing.price = float(data["price"])
        if image_file and image_file.filename:
            existing.image_path = save_image(image_file)
            
        current_copies = BookCopy.query.filter_by(book_id=existing.id).count()
        for i in range(quantity):
            copy = BookCopy(
                book_id=existing.id,
                copy_code=f"COPY-{existing.id}-{current_copies + i + 1:03d}",
                qr_token=uuid.uuid4().hex,
            )
            db.session.add(copy)
        db.session.commit()
        return jsonify({"book": existing.to_dict(include_copies=True), "message": f"Added {quantity} copies to existing book."}), 201

    book = _create_book_with_copies(data, image_file=image_file, quantity=quantity)
    return jsonify({"book": book.to_dict(include_copies=True)}), 201


@books_bp.post("/import-excel")
@jwt_required()
def import_excel():
    err = _require_admin()
    if err:
        return err

    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"error": "No file provided"}), 400
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        return jsonify({"error": "Only .xlsx files are supported"}), 400

    try:
        rows = parse_excel_books(file.stream)
    except Exception as exc:
        return jsonify({"error": f"Failed to parse Excel: {exc}"}), 422

    if not rows:
        return jsonify({"error": "No valid rows found in the file"}), 422

    created_books = []
    copies_added_to_existing = 0
    for row in rows:
        isbn = (row.get("isbn") or "").strip()
        title = (row.get("title") or "").strip()
        author = (row.get("author") or "").strip()

        existing = None
        if isbn:
            existing = Book.query.filter(db.func.lower(Book.isbn) == isbn.lower()).first()
        if not existing and title:
            q = Book.query.filter(db.func.lower(Book.title) == title.lower())
            if author:
                q = q.filter(db.func.lower(Book.author) == author.lower())
            existing = q.first()

        if existing:
            # Instead of skipping, we add a copy to the existing book.
            current_copies = BookCopy.query.filter_by(book_id=existing.id).count()
            copy = BookCopy(
                book_id=existing.id,
                copy_code=f"COPY-{existing.id}-{current_copies + 1:03d}-{uuid.uuid4().hex[:4].upper()}",
                qr_token=uuid.uuid4().hex,
            )
            db.session.add(copy)
            db.session.commit()
            copies_added_to_existing += 1
            continue

        book = _create_book_with_copies(row, quantity=1)
        created_books.append(book.to_dict())

    return jsonify({
        "imported": len(created_books),
        "copies_added_to_existing": copies_added_to_existing,
        "books": created_books,
    }), 201


@books_bp.patch("/<int:book_id>")
@jwt_required()
def update_book(book_id: int):
    err = _require_admin()
    if err:
        return err

    book = Book.query.get_or_404(book_id)
    data = request.form.to_dict() if request.form else (request.get_json(silent=True) or {})

    updatable = [
        "title", "author", "year", "publisher", "isbn", "format",
        "price", "currency", "category", "default_borrow_days", "is_active",
    ]
    for field in updatable:
        if field in data:
            val = data[field]
            if field in ("year", "default_borrow_days"):
                val = int(val) if val not in (None, "") else None
            elif field == "price":
                val = float(val) if val not in (None, "") else None
            elif field == "is_active":
                val = str(val).lower() in ("true", "1", "yes")
            setattr(book, field, val)

    image_file = request.files.get("image")
    if image_file and image_file.filename:
        book.image_path = save_image(image_file)

    db.session.commit()
    return jsonify({"book": book.to_dict()}), 200


@books_bp.delete("/<int:book_id>")
@jwt_required()
def delete_book(book_id: int):
    err = _require_admin()
    if err:
        return err

    book = Book.query.get_or_404(book_id)
    book.is_active = False
    db.session.commit()
    return "", 204


@books_bp.get("/<int:book_id>/qr")
@jwt_required()
def get_qr_image(book_id: int):
    book = Book.query.get_or_404(book_id)
    generate_book_qr(book)
    db.session.commit()

    qr_file = os.path.join(uploads_root(), "qr", f"{book.qr_token}.png")
    return send_file(qr_file, mimetype="image/png")

import uuid
from datetime import datetime
from app.extensions import db


class Book(db.Model):
    __tablename__ = "books"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    author = db.Column(db.String(255))
    year = db.Column(db.Integer)
    publisher = db.Column(db.String(255))
    isbn = db.Column(db.String(50), index=True)
    format = db.Column(db.String(50))
    price = db.Column(db.Numeric(10, 2))
    currency = db.Column(db.String(10), default="INR")
    category = db.Column(db.String(100))
    image_path = db.Column(db.String(500))
    qr_code_path = db.Column(db.String(500))
    qr_token = db.Column(db.String(100), unique=True, nullable=False, index=True)
    default_borrow_days = db.Column(db.Integer, default=7, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    copies = db.relationship("BookCopy", backref="book", lazy="select")

    def to_dict(self, include_copies: bool = False) -> dict:
        d = {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "year": self.year,
            "publisher": self.publisher,
            "isbn": self.isbn,
            "format": self.format,
            "price": float(self.price) if self.price is not None else None,
            "currency": self.currency,
            "category": self.category,
            "image_path": self.image_path,
            "qr_code_path": self.qr_code_path,
            "qr_token": self.qr_token,
            "default_borrow_days": self.default_borrow_days,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }
        if include_copies:
            d["copies"] = [c.to_dict() for c in self.copies]
        return d

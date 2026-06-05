from app.extensions import db


class BookCopy(db.Model):
    __tablename__ = "book_copies"

    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    copy_code = db.Column(db.String(100), unique=True, nullable=False)
    status = db.Column(
        db.Enum(
            "available",
            "issued",
            "reserved",
            "lost_pending",
            "removed",
            name="copy_status_enum",
        ),
        default="available",
        nullable=False,
    )
    qr_token = db.Column(db.String(100), unique=True, index=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "book_id": self.book_id,
            "copy_code": self.copy_code,
            "status": self.status,
            "qr_token": self.qr_token,
        }

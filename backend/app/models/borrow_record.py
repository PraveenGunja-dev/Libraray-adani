from datetime import datetime
from app.extensions import db


class BorrowRecord(db.Model):
    __tablename__ = "borrow_records"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    book_copy_id = db.Column(db.Integer, db.ForeignKey("book_copies.id"), nullable=False)
    borrowed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    due_date = db.Column(db.DateTime, nullable=False, index=True)
    returned_at = db.Column(db.DateTime, nullable=True)
    days_requested = db.Column(db.Integer, nullable=False)
    status = db.Column(
        db.Enum("active", "returned", "overdue", name="borrow_status_enum"),
        default="active",
        nullable=False,
    )

    user = db.relationship("User", backref="borrow_records")
    book_copy = db.relationship("BookCopy", backref="borrow_records")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "book_copy_id": self.book_copy_id,
            "borrowed_at": self.borrowed_at.isoformat(),
            "due_date": self.due_date.isoformat(),
            "returned_at": self.returned_at.isoformat() if self.returned_at else None,
            "days_requested": self.days_requested,
            "status": self.status,
        }

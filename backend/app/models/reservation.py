from datetime import datetime
from app.extensions import db


class Reservation(db.Model):
    __tablename__ = "reservations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey("books.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    queue_position = db.Column(db.Integer, nullable=False)
    expected_available_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(
        db.Enum("waiting", "ready", "cancelled", "fulfilled", name="reservation_status_enum"),
        default="waiting",
        nullable=False,
    )

    user = db.relationship("User", backref="reservations")
    book = db.relationship("Book", backref="reservations")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "book_id": self.book_id,
            "created_at": self.created_at.isoformat(),
            "queue_position": self.queue_position,
            "expected_available_date": (
                self.expected_available_date.isoformat()
                if self.expected_available_date
                else None
            ),
            "status": self.status,
        }

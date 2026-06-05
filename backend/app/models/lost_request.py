from datetime import datetime
from app.extensions import db


class LostRequest(db.Model):
    __tablename__ = "lost_requests"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    book_copy_id = db.Column(db.Integer, db.ForeignKey("book_copies.id"), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(
        db.Enum("pending", "approved", "rejected", name="lost_status_enum"),
        default="pending",
        nullable=False,
    )
    resolved_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", foreign_keys=[user_id], backref="lost_requests")
    resolver = db.relationship("User", foreign_keys=[resolved_by])
    book_copy = db.relationship("BookCopy", backref="lost_requests")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "book_copy_id": self.book_copy_id,
            "reason": self.reason,
            "created_at": self.created_at.isoformat(),
            "status": self.status,
            "resolved_by": self.resolved_by,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }

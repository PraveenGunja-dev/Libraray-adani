from datetime import datetime
from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, index=True
    )
    type = db.Column(
        db.Enum(
            "due_reminder",
            "overdue",
            "reservation_ready",
            "lost_update",
            "system",
            name="notification_type_enum",
        ),
        nullable=False,
    )
    title = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref="notifications")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "title": self.title,
            "body": self.body,
            "read": self.read,
            "created_at": self.created_at.isoformat(),
        }

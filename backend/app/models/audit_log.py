from datetime import datetime
from app.extensions import db


class AuditLog(db.Model):
    __tablename__ = "audit_log"

    id = db.Column(db.Integer, primary_key=True)
    actor_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    entity = db.Column(db.String(100), nullable=False)
    entity_id = db.Column(db.Integer, nullable=True)
    payload = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "actor_user_id": self.actor_user_id,
            "action": self.action,
            "entity": self.entity,
            "entity_id": self.entity_id,
            "payload": self.payload,
            "created_at": self.created_at.isoformat(),
        }

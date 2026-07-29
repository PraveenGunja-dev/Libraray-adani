from app.extensions import db
from app.models.audit_log import AuditLog


def log_action(actor_user_id, action: str, entity: str, entity_id=None, payload: dict | None = None) -> None:
    db.session.add(
        AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            payload=payload,
        )
    )
    db.session.commit()

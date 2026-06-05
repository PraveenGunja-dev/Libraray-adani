from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.notification import Notification

notifications_bp = Blueprint(
    "notifications", __name__, url_prefix="/api/notifications"
)


@notifications_bp.get("/", strict_slashes=False)
@jwt_required()
def list_notifications():
    user_id = int(get_jwt_identity())
    notifications = (
        Notification.query.filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return jsonify([n.to_dict() for n in notifications])


@notifications_bp.post("/<int:notif_id>/read")
@jwt_required()
def mark_read(notif_id):
    user_id = int(get_jwt_identity())
    n = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    n.read = True
    db.session.commit()
    return jsonify(n.to_dict())

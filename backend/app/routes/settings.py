from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models.settings import Settings

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

DEFAULTS = {
    "default_borrow_days": 7,
    "due_reminder_days": 2,
    "max_borrow_days": 90,
    "max_borrows_per_user": 5,
}


@settings_bp.get("/")
@jwt_required()
def get_settings():
    rows = Settings.query.all()
    settings = {**DEFAULTS}
    for row in rows:
        settings[row.key] = row.value
    return jsonify({"settings": settings}), 200


@settings_bp.put("/")
@jwt_required()
def update_settings():
    data = request.get_json(silent=True) or {}
    for key, value in data.items():
        Settings.set_value(key, value)
    return jsonify({"message": "Settings updated"}), 200

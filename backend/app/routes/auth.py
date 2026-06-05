from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from app.services.auth_service import authenticate, change_pin

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    pin = data.get("pin", "")

    if not email or not pin:
        return jsonify({"error": "email and pin are required"}), 400

    if len(pin) != 6 or not pin.isdigit():
        return jsonify({"error": "PIN must be exactly 6 digits"}), 400

    user = authenticate(email, pin)
    if not user:
        return jsonify({"error": "Invalid email or PIN"}), 401

    additional_claims = {"role": user.role, "pin_is_default": user.pin_is_default}
    token = create_access_token(
        identity=str(user.id), additional_claims=additional_claims
    )
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.post("/pin/change")
@jwt_required()
def pin_change():
    user_id = int(get_jwt_identity())
    from app.models.user import User

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    old_pin = data.get("old_pin", "")
    new_pin = data.get("new_pin", "")

    if not old_pin or not new_pin:
        return jsonify({"error": "old_pin and new_pin are required"}), 400

    ok, message = change_pin(user, old_pin, new_pin)
    if not ok:
        return jsonify({"error": message}), 400

    additional_claims = {"role": user.role, "pin_is_default": user.pin_is_default}
    new_token = create_access_token(
        identity=str(user.id), additional_claims=additional_claims
    )
    return jsonify({"message": message, "token": new_token, "user": user.to_dict()}), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    from app.models.user import User

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200

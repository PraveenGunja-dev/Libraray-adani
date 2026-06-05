from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.models.reservation import Reservation
from app.services.inventory_service import cancel_reservation, reserve_book, approve_reservation

reservations_bp = Blueprint("reservations", __name__, url_prefix="/api/reservations")


def _current_user_id() -> int:
    return int(get_jwt_identity())


def _is_admin() -> bool:
    return get_jwt().get("role") == "admin"


@reservations_bp.post("/")
@jwt_required()
def create_reservation():
    data = request.get_json(silent=True) or {}
    book_id = data.get("book_id")

    if not book_id:
        return jsonify({"error": "book_id is required"}), 400

    try:
        book_id = int(book_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid book_id"}), 400

    try:
        reservation = reserve_book(_current_user_id(), book_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"reservation": reservation.to_dict()}), 201


@reservations_bp.post("/<int:reservation_id>/approve")
@jwt_required()
def approve(reservation_id: int):
    if not _is_admin():
        return jsonify({"error": "Admin access required"}), 403

    try:
        record = approve_reservation(reservation_id, _current_user_id())
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"borrow_record": record.to_dict()}), 200


@reservations_bp.get("/mine")
@jwt_required()
def my_reservations():
    user_id = _current_user_id()
    reservations = (
        Reservation.query.filter_by(user_id=user_id)
        .order_by(Reservation.created_at.desc())
        .all()
    )

    result = []
    for r in reservations:
        d = r.to_dict()
        if r.book:
            d["book"] = r.book.to_dict()
        result.append(d)

    return jsonify({"reservations": result}), 200


@reservations_bp.delete("/<int:reservation_id>")
@jwt_required()
def cancel(reservation_id: int):
    try:
        reservation = cancel_reservation(
            reservation_id, _current_user_id(), is_admin=_is_admin()
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"reservation": reservation.to_dict()}), 200


@reservations_bp.get("/")
@jwt_required()
def list_all():
    if not _is_admin():
        return jsonify({"error": "Admin access required"}), 403

    status_filter = request.args.get("status", "").strip()
    q = Reservation.query
    if status_filter:
        q = q.filter_by(status=status_filter)

    reservations = q.order_by(Reservation.created_at.desc()).all()

    result = []
    for r in reservations:
        d = r.to_dict()
        if r.book:
            d["book"] = r.book.to_dict()
        if r.user:
            d["user"] = r.user.to_dict()
        result.append(d)

    return jsonify({"reservations": result}), 200

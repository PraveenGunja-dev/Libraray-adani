from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.models.book_copy import BookCopy
from app.models.borrow_record import BorrowRecord
from app.models.user import User
from app.services.audit_service import log_action
from app.services.inventory_service import borrow_copy, return_copy

borrow_bp = Blueprint("borrow", __name__, url_prefix="/api/borrow")

DEFAULT_BORROW_DAYS = 7


def _current_user_id() -> int:
    return int(get_jwt_identity())


def _is_admin() -> bool:
    return get_jwt().get("role") == "admin"


@borrow_bp.post("/")
@jwt_required()
def create_borrow():
    data = request.get_json(silent=True) or {}
    book_copy_id = data.get("book_copy_id")
    days_requested = data.get("days_requested", DEFAULT_BORROW_DAYS)
    employee_email = (data.get("employee_email") or "").strip().lower()

    if not book_copy_id:
        return jsonify({"error": "book_copy_id is required"}), 400

    try:
        book_copy_id = int(book_copy_id)
        days_requested = int(days_requested)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid book_copy_id or days_requested"}), 400

    target_user_id = _current_user_id()
    if employee_email:
        if not _is_admin():
            return jsonify({"error": "Only an admin can issue a book to another employee"}), 403
        employee = User.query.filter_by(email=employee_email, role="employee").first()
        if not employee:
            return jsonify({"error": f"No employee found with email {employee_email}"}), 404
        target_user_id = employee.id

    try:
        record = borrow_copy(target_user_id, book_copy_id, days_requested)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    copy = BookCopy.query.get(book_copy_id)
    result = record.to_dict()
    if copy:
        result["book"] = copy.book.to_dict()

    log_action(
        _current_user_id(), "borrow", "book_copy", book_copy_id,
        {"borrow_record_id": record.id, "user_id": target_user_id, "days_requested": days_requested},
    )
    return jsonify({"borrow_record": result}), 201


@borrow_bp.post("/<int:borrow_id>/return")
@jwt_required()
def do_return(borrow_id: int):
    try:
        record = return_copy(borrow_id, _current_user_id())
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    log_action(_current_user_id(), "return", "borrow_record", borrow_id)
    return jsonify({"borrow_record": record.to_dict()}), 200


@borrow_bp.get("/mine")
@jwt_required()
def my_borrows():
    user_id = _current_user_id()
    records = (
        BorrowRecord.query.filter_by(user_id=user_id)
        .order_by(BorrowRecord.borrowed_at.desc())
        .all()
    )

    result = []
    for r in records:
        d = r.to_dict()
        if r.book_copy and r.book_copy.book:
            d["book"] = r.book_copy.book.to_dict()
            d["copy_code"] = r.book_copy.copy_code
        result.append(d)

    return jsonify({"borrow_records": result}), 200

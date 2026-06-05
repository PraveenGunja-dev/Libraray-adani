from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.models.book_copy import BookCopy
from app.models.borrow_record import BorrowRecord
from app.services.inventory_service import borrow_copy, return_copy

borrow_bp = Blueprint("borrow", __name__, url_prefix="/api/borrow")

DEFAULT_BORROW_DAYS = 7


def _current_user_id() -> int:
    return int(get_jwt_identity())


@borrow_bp.post("/")
@jwt_required()
def create_borrow():
    data = request.get_json(silent=True) or {}
    book_copy_id = data.get("book_copy_id")
    days_requested = data.get("days_requested", DEFAULT_BORROW_DAYS)

    if not book_copy_id:
        return jsonify({"error": "book_copy_id is required"}), 400

    try:
        book_copy_id = int(book_copy_id)
        days_requested = int(days_requested)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid book_copy_id or days_requested"}), 400

    try:
        record = borrow_copy(_current_user_id(), book_copy_id, days_requested)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    copy = BookCopy.query.get(book_copy_id)
    result = record.to_dict()
    if copy:
        result["book"] = copy.book.to_dict()
    return jsonify({"borrow_record": result}), 201


@borrow_bp.post("/<int:borrow_id>/return")
@jwt_required()
def do_return(borrow_id: int):
    try:
        record = return_copy(borrow_id, _current_user_id())
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

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

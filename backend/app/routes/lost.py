from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.models.lost_request import LostRequest
from app.models.book_copy import BookCopy
from app.services.audit_service import log_action
from app.services.inventory_service import approve_lost, reject_lost
from app.extensions import db

lost_bp = Blueprint("lost", __name__, url_prefix="/api/lost")


def _current_user_id() -> int:
    return int(get_jwt_identity())


def _is_admin() -> bool:
    return get_jwt().get("role") == "admin"


def _require_admin():
    if not _is_admin():
        return jsonify({"error": "Admin access required"}), 403
    return None


@lost_bp.post("/")
@jwt_required()
def report_lost():
    data = request.get_json(silent=True) or {}
    book_copy_id = data.get("book_copy_id")
    reason = (data.get("reason") or "").strip()

    if not book_copy_id:
        return jsonify({"error": "book_copy_id is required"}), 400
    if not reason:
        return jsonify({"error": "reason is required"}), 400

    try:
        book_copy_id = int(book_copy_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid book_copy_id"}), 400

    copy = BookCopy.query.get(book_copy_id)
    if not copy:
        return jsonify({"error": "Book copy not found"}), 404
    if copy.status in ("removed",):
        return jsonify({"error": "This copy has already been removed"}), 400

    # Prevent duplicate pending reports
    existing = LostRequest.query.filter_by(
        book_copy_id=book_copy_id, status="pending"
    ).first()
    if existing:
        return jsonify({"error": "A pending lost request already exists for this copy"}), 409

    req = LostRequest(
        user_id=_current_user_id(),
        book_copy_id=book_copy_id,
        reason=reason,
        status="pending",
    )
    copy.status = "lost_pending"

    db.session.add(req)
    db.session.commit()

    result = req.to_dict()
    if copy.book:
        result["book"] = copy.book.to_dict()
    return jsonify({"lost_request": result}), 201


@lost_bp.get("/")
@jwt_required()
def list_lost():
    err = _require_admin()
    if err:
        return err

    status_filter = request.args.get("status", "pending").strip()
    q = LostRequest.query
    if status_filter:
        q = q.filter_by(status=status_filter)

    requests = q.order_by(LostRequest.created_at.desc()).all()

    result = []
    for r in requests:
        d = r.to_dict()
        if r.book_copy and r.book_copy.book:
            d["book"] = r.book_copy.book.to_dict()
            d["copy_code"] = r.book_copy.copy_code
        if r.user:
            d["reported_by"] = r.user.to_dict()
        result.append(d)

    return jsonify({"lost_requests": result}), 200


@lost_bp.post("/<int:lost_id>/approve")
@jwt_required()
def approve(lost_id: int):
    err = _require_admin()
    if err:
        return err

    try:
        req = approve_lost(lost_id, _current_user_id())
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    log_action(_current_user_id(), "lost_approve", "lost_request", lost_id)
    return jsonify({"lost_request": req.to_dict()}), 200


@lost_bp.post("/<int:lost_id>/reject")
@jwt_required()
def reject(lost_id: int):
    err = _require_admin()
    if err:
        return err

    try:
        req = reject_lost(lost_id, _current_user_id())
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    log_action(_current_user_id(), "lost_reject", "lost_request", lost_id)
    return jsonify({"lost_request": req.to_dict()}), 200

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from app.services.analytics_service import (
    get_stats,
    get_monthly,
    get_categories,
    get_popular,
    get_activity,
)

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")
admin_bp.strict_slashes = False


def _require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin required"}), 403
    return None


@admin_bp.get("/stats")
@jwt_required()
def stats():
    err = _require_admin()
    if err:
        return err
    return jsonify(get_stats())


@admin_bp.get("/monthly")
@jwt_required()
def monthly():
    err = _require_admin()
    if err:
        return err
    months = request.args.get("months", 6, type=int)
    return jsonify(get_monthly(months))


@admin_bp.get("/categories")
@jwt_required()
def categories():
    err = _require_admin()
    if err:
        return err
    return jsonify(get_categories())


@admin_bp.get("/popular")
@jwt_required()
def popular():
    err = _require_admin()
    if err:
        return err
    limit = request.args.get("limit", 10, type=int)
    return jsonify(get_popular(limit))


@admin_bp.get("/activity")
@jwt_required()
def activity():
    err = _require_admin()
    if err:
        return err
    limit = request.args.get("limit", 20, type=int)
    return jsonify(get_activity(limit))

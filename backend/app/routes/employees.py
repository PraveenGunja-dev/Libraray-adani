from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from app.extensions import db
from app.models.user import User
from app.models.borrow_record import BorrowRecord
from datetime import datetime

employees_bp = Blueprint("employees", __name__, url_prefix="/api/employees")

def _require_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin required"}), 403
    return None

def _employee_summary(user: User) -> dict:
    d = user.to_dict()
    active_borrows = BorrowRecord.query.filter_by(
        user_id=user.id, status="active"
    ).count() + BorrowRecord.query.filter_by(
        user_id=user.id, status="overdue"
    ).count()
    d["active_borrowed"] = active_borrows
    return d

@employees_bp.get("/")
@jwt_required()
def list_employees():
    err = _require_admin()
    if err:
        return err

    search = request.args.get("search", "").strip()
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(200, max(1, int(request.args.get("per_page", 100))))

    q = User.query.filter_by(role="employee")

    if search:
        like = f"%{search}%"
        q = q.filter(
            db.or_(
                User.name.ilike(like),
                User.email.ilike(like),
                User.department.ilike(like)
            )
        )

    total = q.count()
    users = q.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "employees": [_employee_summary(u) for u in users],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, (total + per_page - 1) // per_page),
    }), 200

@employees_bp.post("/")
@jwt_required()
def create_employee():
    err = _require_admin()
    if err:
        return err

    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    department = data.get("department", "").strip()
    dob_str = data.get("dob", "").strip()

    if not name or not email or not dob_str:
        return jsonify({"error": "name, email, and dob are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "dob must be in YYYY-MM-DD format"}), 400

    user = User(
        name=name,
        email=email,
        department=department,
        dob=dob,
        role="employee",
        pin_is_default=True
    )
    user.set_pin(user.default_pin)

    db.session.add(user)
    db.session.commit()

    return jsonify({"employee": _employee_summary(user)}), 201

@employees_bp.patch("/<int:user_id>")
@jwt_required()
def update_employee(user_id: int):
    err = _require_admin()
    if err:
        return err

    user = User.query.get_or_404(user_id)
    if user.role != "employee":
        return jsonify({"error": "Can only edit employees"}), 400

    data = request.get_json(silent=True) or {}
    
    if "name" in data:
        user.name = data["name"].strip()
    if "email" in data:
        email = data["email"].strip().lower()
        if email != user.email and User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400
        user.email = email
    if "department" in data:
        user.department = data["department"].strip()
    if "dob" in data:
        try:
            user.dob = datetime.strptime(data["dob"].strip(), "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "dob must be in YYYY-MM-DD format"}), 400

    db.session.commit()
    return jsonify({"employee": _employee_summary(user)}), 200

@employees_bp.delete("/<int:user_id>")
@jwt_required()
def delete_employee(user_id: int):
    err = _require_admin()
    if err:
        return err

    user = User.query.get_or_404(user_id)
    if user.role != "employee":
        return jsonify({"error": "Can only delete employees"}), 400
        
    active_borrows = BorrowRecord.query.filter_by(user_id=user.id).filter(
        BorrowRecord.status.in_(["active", "overdue"])
    ).count()
    if active_borrows > 0:
        return jsonify({"error": "Cannot delete employee with active borrow records"}), 400

    db.session.delete(user)
    db.session.commit()
    return "", 204

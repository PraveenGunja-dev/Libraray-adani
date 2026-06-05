from datetime import datetime, timedelta
from sqlalchemy import func, extract
from app.extensions import db
from app.models.book import Book
from app.models.book_copy import BookCopy
from app.models.borrow_record import BorrowRecord
from app.models.reservation import Reservation
from app.models.user import User
from app.models.audit_log import AuditLog


def get_stats() -> dict:
    total_books = Book.query.filter_by(is_active=True).count()
    total_copies = BookCopy.query.filter(BookCopy.status != "removed").count()
    available = BookCopy.query.filter_by(status="available").count()
    issued = BookCopy.query.filter_by(status="issued").count()
    overdue = BorrowRecord.query.filter_by(status="overdue").count()
    reserved = Reservation.query.filter_by(status="waiting").count()
    total_users = User.query.filter_by(role="employee").count()

    return {
        "total_books": total_books,
        "total_copies": total_copies,
        "available": available,
        "issued": issued,
        "overdue": overdue,
        "reserved": reserved,
        "total_users": total_users,
    }


def get_monthly(months: int = 6) -> list:
    result = []
    now = datetime.utcnow()

    for i in range(months - 1, -1, -1):
        # Step back i calendar months from current month
        raw_month = now.month - i
        year = now.year + (raw_month - 1) // 12
        month = ((raw_month - 1) % 12) + 1
        label = datetime(year, month, 1).strftime("%b %Y")

        issued_count = BorrowRecord.query.filter(
            extract("year", BorrowRecord.borrowed_at) == year,
            extract("month", BorrowRecord.borrowed_at) == month,
        ).count()

        returned_count = BorrowRecord.query.filter(
            BorrowRecord.returned_at.isnot(None),
            extract("year", BorrowRecord.returned_at) == year,
            extract("month", BorrowRecord.returned_at) == month,
        ).count()

        overdue_count = BorrowRecord.query.filter(
            BorrowRecord.status == "overdue",
            extract("year", BorrowRecord.due_date) == year,
            extract("month", BorrowRecord.due_date) == month,
        ).count()

        result.append(
            {
                "month": label,
                "issued": issued_count,
                "returned": returned_count,
                "overdue": overdue_count,
            }
        )

    return result


def get_categories() -> list:
    rows = (
        db.session.query(Book.category, func.count(Book.id).label("count"))
        .filter_by(is_active=True)
        .group_by(Book.category)
        .all()
    )
    return [
        {"category": r.category or "Uncategorized", "count": r.count} for r in rows
    ]


def get_popular(limit: int = 10) -> list:
    rows = (
        db.session.query(
            Book.id,
            Book.title,
            Book.author,
            func.count(BorrowRecord.id).label("borrow_count"),
        )
        .join(BookCopy, BookCopy.book_id == Book.id)
        .join(BorrowRecord, BorrowRecord.book_copy_id == BookCopy.id)
        .group_by(Book.id, Book.title, Book.author)
        .order_by(func.count(BorrowRecord.id).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "title": r.title,
            "author": r.author,
            "borrow_count": r.borrow_count,
        }
        for r in rows
    ]


def get_activity(limit: int = 20) -> list:
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [log.to_dict() for log in logs]

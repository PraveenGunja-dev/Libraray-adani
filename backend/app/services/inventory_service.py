from datetime import datetime, timedelta

from app.extensions import db
from app.models.book import Book
from app.models.book_copy import BookCopy
from app.models.borrow_record import BorrowRecord
from app.models.reservation import Reservation
from app.models.lost_request import LostRequest


def borrow_copy(user_id: int, book_copy_id: int, days_requested: int) -> BorrowRecord:
    copy = BookCopy.query.get(book_copy_id)
    if not copy:
        raise ValueError("Book copy not found")
    if copy.status != "available":
        raise ValueError(f"Copy is not available (current status: {copy.status})")
    if days_requested < 1:
        raise ValueError("days_requested must be at least 1")

    now = datetime.utcnow()
    record = BorrowRecord(
        user_id=user_id,
        book_copy_id=book_copy_id,
        borrowed_at=now,
        due_date=now + timedelta(days=days_requested),
        days_requested=days_requested,
        status="active",
    )
    copy.status = "issued"

    # If user has a 'ready' or 'waiting' reservation for this book, fulfil it
    reservation = Reservation.query.filter_by(
        user_id=user_id, book_id=copy.book_id
    ).filter(Reservation.status.in_(["ready", "waiting"])).first()
    if reservation:
        reservation.status = "fulfilled"

    db.session.add(record)
    db.session.commit()
    return record


def approve_reservation(reservation_id: int, admin_user_id: int) -> BorrowRecord:
    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        raise ValueError("Reservation not found")
    if reservation.status not in ("waiting", "ready"):
        raise ValueError("Can only approve waiting or ready reservations")
        
    available_copy = BookCopy.query.filter_by(
        book_id=reservation.book_id, status="available"
    ).first()
    
    if not available_copy:
        raise ValueError("No physical copies are currently available to fulfill this reservation")
        
    default_days = available_copy.book.default_borrow_days or 7
    # borrow_copy will automatically fulfill the reservation
    record = borrow_copy(reservation.user_id, available_copy.id, default_days)
    return record


def return_copy(borrow_id: int, user_id: int) -> BorrowRecord:
    record = BorrowRecord.query.get(borrow_id)
    if not record:
        raise ValueError("Borrow record not found")
    if record.user_id != user_id:
        raise ValueError("This borrow record does not belong to you")
    if record.status == "returned":
        raise ValueError("Book has already been returned")

    now = datetime.utcnow()
    record.returned_at = now
    record.status = "returned"

    copy = record.book_copy
    copy.status = "available"

    _auto_fulfill_reservation(copy.book_id)

    db.session.commit()
    return record


def reserve_book(user_id: int, book_id: int) -> Reservation:
    book = Book.query.get(book_id)
    if not book or not book.is_active:
        raise ValueError("Book not found")

    existing = Reservation.query.filter(
        Reservation.user_id == user_id,
        Reservation.book_id == book_id,
        Reservation.status.in_(["waiting", "ready"]),
    ).first()
    if existing:
        raise ValueError("You already have an active reservation for this book")

    # We allow reservations even if copies are available so the librarian can pull it from the shelf

    position = (
        Reservation.query.filter_by(book_id=book_id)
        .filter(Reservation.status.in_(["waiting", "ready"]))
        .count()
        + 1
    )

    reservation = Reservation(
        user_id=user_id,
        book_id=book_id,
        queue_position=position,
        status="waiting",
    )
    db.session.add(reservation)
    db.session.commit()
    return reservation


def cancel_reservation(reservation_id: int, user_id: int, is_admin: bool = False) -> Reservation:
    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        raise ValueError("Reservation not found")
    if not is_admin and reservation.user_id != user_id:
        raise ValueError("This reservation does not belong to you")
    if reservation.status not in ("waiting", "ready"):
        raise ValueError("Only waiting or ready reservations can be cancelled")

    old_position = reservation.queue_position
    reservation.status = "cancelled"

    # Shift queue positions down for remaining 'waiting' reservations
    waiting = (
        Reservation.query.filter_by(book_id=reservation.book_id, status="waiting")
        .filter(Reservation.queue_position > old_position)
        .all()
    )
    for r in waiting:
        r.queue_position -= 1

    db.session.commit()
    return reservation


def approve_lost(lost_request_id: int, admin_user_id: int) -> LostRequest:
    req = LostRequest.query.get(lost_request_id)
    if not req:
        raise ValueError("lost request not found")
    if req.status != "pending":
        raise ValueError("Only pending requests can be approved")

    req.status = "approved"
    req.resolved_by = admin_user_id
    req.resolved_at = datetime.utcnow()

    copy = req.book_copy
    copy.status = "removed"

    # Cancel any waiting reservations for the book if no copies remain
    active_copies = BookCopy.query.filter(
        BookCopy.book_id == copy.book_id,
        BookCopy.status.notin_(["removed"]),
    ).count()
    if active_copies == 0:
        Reservation.query.filter_by(book_id=copy.book_id, status="waiting").update(
            {"status": "cancelled"}
        )

    db.session.commit()
    return req


def reject_lost(lost_request_id: int, admin_user_id: int) -> LostRequest:
    req = LostRequest.query.get(lost_request_id)
    if not req:
        raise ValueError("lost request not found")
    if req.status != "pending":
        raise ValueError("Only pending requests can be rejected")

    req.status = "rejected"
    req.resolved_by = admin_user_id
    req.resolved_at = datetime.utcnow()

    copy = req.book_copy
    copy.status = "available"

    db.session.commit()
    return req


def _auto_fulfill_reservation(book_id: int) -> None:
    """Promote the first 'waiting' reservation for book_id to 'ready'."""
    first_waiting = (
        Reservation.query.filter_by(book_id=book_id, status="waiting")
        .order_by(Reservation.queue_position.asc())
        .first()
    )
    if first_waiting:
        first_waiting.status = "ready"

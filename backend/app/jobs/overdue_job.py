from datetime import datetime, timedelta
from app.extensions import db
from app.models.borrow_record import BorrowRecord
from app.models.notification import Notification
from app.models.settings import Settings


def run_overdue_check(app):
    """Mark active-but-past-due records overdue and insert overdue notifications."""
    with app.app_context():
        now = datetime.utcnow()

        overdue_records = BorrowRecord.query.filter(
            BorrowRecord.status == "active",
            BorrowRecord.due_date < now,
        ).all()

        for record in overdue_records:
            record.status = "overdue"
            notif = Notification(
                user_id=record.user_id,
                type="overdue",
                title="Book Overdue",
                body=(
                    f"Your borrowed book (copy #{record.book_copy_id}) was due on "
                    f"{record.due_date.strftime('%d %b %Y')} and is now overdue."
                ),
            )
            db.session.add(notif)

        db.session.commit()


def run_due_reminder(app):
    """Insert due-reminder notifications for books due within N days."""
    with app.app_context():
        now = datetime.utcnow()
        reminder_days = Settings.get("due_reminder_days_before", 2)
        cutoff = now + timedelta(days=reminder_days)

        upcoming = BorrowRecord.query.filter(
            BorrowRecord.status == "active",
            BorrowRecord.due_date >= now,
            BorrowRecord.due_date <= cutoff,
        ).all()

        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        for record in upcoming:
            already_notified = Notification.query.filter(
                Notification.user_id == record.user_id,
                Notification.type == "due_reminder",
                Notification.created_at >= today_start,
                Notification.body.contains(f"copy #{record.book_copy_id}"),
            ).first()
            if already_notified:
                continue

            notif = Notification(
                user_id=record.user_id,
                type="due_reminder",
                title="Book Due Soon",
                body=(
                    f"Your borrowed book (copy #{record.book_copy_id}) is due on "
                    f"{record.due_date.strftime('%d %b %Y')}."
                ),
            )
            db.session.add(notif)

        db.session.commit()

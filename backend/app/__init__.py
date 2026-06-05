import os
from flask import Flask, send_from_directory
from app.config import Config
from app.extensions import db, migrate, jwt, cors


def create_app(config_class=Config):
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object(config_class)
    app.url_map.strict_slashes = False

    # Ensure uploads subdirs exist
    uploads_base = os.path.abspath(
        os.path.join(app.root_path, "..", app.config["UPLOADS_FOLDER"])
    )
    for subdir in ("", "qr", "images"):
        os.makedirs(os.path.join(uploads_base, subdir), exist_ok=True)

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db, render_as_batch=True)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

    # Import models so Alembic sees them
    from app.models import (  # noqa: F401
        User, Book, BookCopy, BorrowRecord, Reservation, LostRequest,
        Notification, Settings, AuditLog,
    )

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.books import books_bp
    from app.routes.borrow import borrow_bp
    from app.routes.reservations import reservations_bp
    from app.routes.lost import lost_bp
    from app.routes.notifications import notifications_bp
    from app.routes.admin import admin_bp
    from app.routes.settings import settings_bp

    from app.routes.employees import employees_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(books_bp)
    app.register_blueprint(borrow_bp)
    app.register_blueprint(reservations_bp)
    app.register_blueprint(lost_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(employees_bp)

    # Start APScheduler for overdue checks
    _start_scheduler(app)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(uploads_base, filename)

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
        if path != "" and os.path.exists(os.path.join(frontend_dist, path)):
            return send_from_directory(frontend_dist, path)
        return send_from_directory(frontend_dist, 'index.html')

    return app


def _start_scheduler(app):
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from app.jobs.overdue_job import run_overdue_check, run_due_reminder

        scheduler = BackgroundScheduler()
        # Overdue scan — daily at 01:00
        scheduler.add_job(
            run_overdue_check,
            trigger="cron",
            hour=1,
            minute=0,
            args=[app],
            id="overdue_check",
            replace_existing=True,
        )
        # Due-reminder scan — daily at 08:00
        scheduler.add_job(
            run_due_reminder,
            trigger="cron",
            hour=8,
            minute=0,
            args=[app],
            id="due_reminder",
            replace_existing=True,
        )
        scheduler.start()
    except Exception as exc:  # pragma: no cover
        app.logger.warning("Scheduler failed to start: %s", exc)

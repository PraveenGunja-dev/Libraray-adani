"""notifications, settings, audit_log tables

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-25

"""
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE notification_type_enum AS ENUM (
                'due_reminder', 'overdue', 'reservation_ready', 'lost_update', 'system'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        CREATE TABLE IF NOT EXISTS notifications (
            id          SERIAL PRIMARY KEY,
            user_id     INTEGER                     NOT NULL REFERENCES users (id),
            type        notification_type_enum       NOT NULL,
            title       VARCHAR(255)                NOT NULL,
            body        TEXT                        NOT NULL,
            read        BOOLEAN                     NOT NULL DEFAULT FALSE,
            created_at  TIMESTAMP                   NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id);

        CREATE TABLE IF NOT EXISTS settings (
            key     VARCHAR(100)    PRIMARY KEY,
            value   JSONB           NOT NULL
        );

        INSERT INTO settings (key, value)
        VALUES
            ('default_borrow_days',       '7'),
            ('due_reminder_days_before',  '2')
        ON CONFLICT (key) DO NOTHING;

        CREATE TABLE IF NOT EXISTS audit_log (
            id              SERIAL PRIMARY KEY,
            actor_user_id   INTEGER REFERENCES users (id),
            action          VARCHAR(100)    NOT NULL,
            entity          VARCHAR(100)    NOT NULL,
            entity_id       INTEGER,
            payload         JSONB,
            created_at      TIMESTAMP       NOT NULL DEFAULT now()
        );
    """)


def downgrade():
    op.execute("""
        DROP TABLE IF EXISTS audit_log;
        DROP TABLE IF EXISTS settings;
        DROP INDEX IF EXISTS ix_notifications_user_id;
        DROP TABLE IF EXISTS notifications;
        DROP TYPE IF EXISTS notification_type_enum;
    """)

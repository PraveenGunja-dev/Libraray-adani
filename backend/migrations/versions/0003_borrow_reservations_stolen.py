"""borrow_records, reservations, lost_requests tables

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-25

"""
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE borrow_status_enum AS ENUM ('active', 'returned', 'overdue');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        DO $$ BEGIN
            CREATE TYPE reservation_status_enum AS ENUM ('waiting', 'ready', 'cancelled', 'fulfilled');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        DO $$ BEGIN
            CREATE TYPE lost_status_enum AS ENUM ('pending', 'approved', 'rejected');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        CREATE TABLE borrow_records (
            id              SERIAL PRIMARY KEY,
            user_id         INTEGER                 NOT NULL REFERENCES users (id),
            book_copy_id    INTEGER                 NOT NULL REFERENCES book_copies (id),
            borrowed_at     TIMESTAMP               NOT NULL DEFAULT now(),
            due_date        TIMESTAMP               NOT NULL,
            returned_at     TIMESTAMP,
            days_requested  INTEGER                 NOT NULL,
            status          borrow_status_enum      NOT NULL DEFAULT 'active'
        );

        CREATE INDEX ix_borrow_records_due_date ON borrow_records (due_date);
        CREATE INDEX ix_borrow_records_user_id  ON borrow_records (user_id);

        CREATE TABLE reservations (
            id                      SERIAL PRIMARY KEY,
            user_id                 INTEGER                     NOT NULL REFERENCES users (id),
            book_id                 INTEGER                     NOT NULL REFERENCES books (id),
            created_at              TIMESTAMP                   NOT NULL DEFAULT now(),
            queue_position          INTEGER                     NOT NULL,
            expected_available_date TIMESTAMP,
            status                  reservation_status_enum     NOT NULL DEFAULT 'waiting'
        );

        CREATE INDEX ix_reservations_user_id ON reservations (user_id);
        CREATE INDEX ix_reservations_book_id ON reservations (book_id);

        CREATE TABLE lost_requests (
            id              SERIAL PRIMARY KEY,
            user_id         INTEGER             NOT NULL REFERENCES users (id),
            book_copy_id    INTEGER             NOT NULL REFERENCES book_copies (id),
            reason          TEXT                NOT NULL,
            created_at      TIMESTAMP           NOT NULL DEFAULT now(),
            status          lost_status_enum  NOT NULL DEFAULT 'pending',
            resolved_by     INTEGER             REFERENCES users (id),
            resolved_at     TIMESTAMP
        );

        CREATE INDEX ix_lost_requests_status ON lost_requests (status);
    """)


def downgrade():
    op.execute("""
        DROP INDEX IF EXISTS ix_lost_requests_status;
        DROP TABLE IF EXISTS lost_requests;
        DROP INDEX IF EXISTS ix_reservations_book_id;
        DROP INDEX IF EXISTS ix_reservations_user_id;
        DROP TABLE IF EXISTS reservations;
        DROP INDEX IF EXISTS ix_borrow_records_user_id;
        DROP INDEX IF EXISTS ix_borrow_records_due_date;
        DROP TABLE IF EXISTS borrow_records;
        DROP TYPE IF EXISTS lost_status_enum;
        DROP TYPE IF EXISTS reservation_status_enum;
        DROP TYPE IF EXISTS borrow_status_enum;
    """)

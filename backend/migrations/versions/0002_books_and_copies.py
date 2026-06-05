"""books and book_copies tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-25

"""
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE copy_status_enum AS ENUM (
                'available', 'issued', 'reserved', 'lost_pending', 'removed'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        CREATE TABLE books (
            id                  SERIAL PRIMARY KEY,
            title               VARCHAR(500)    NOT NULL,
            author              VARCHAR(255),
            year                INTEGER,
            publisher           VARCHAR(255),
            isbn                VARCHAR(50),
            format              VARCHAR(50),
            price               NUMERIC(10, 2),
            currency            VARCHAR(10)     NOT NULL DEFAULT 'INR',
            category            VARCHAR(100),
            image_path          VARCHAR(500),
            qr_code_path        VARCHAR(500),
            qr_token            VARCHAR(100)    NOT NULL,
            default_borrow_days INTEGER         NOT NULL DEFAULT 7,
            is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
            created_at          TIMESTAMP       NOT NULL DEFAULT now()
        );

        CREATE UNIQUE INDEX ix_books_qr_token ON books (qr_token);
        CREATE INDEX ix_books_isbn ON books (isbn);

        CREATE TABLE book_copies (
            id          SERIAL PRIMARY KEY,
            book_id     INTEGER             NOT NULL REFERENCES books (id),
            copy_code   VARCHAR(100)        NOT NULL,
            status      copy_status_enum    NOT NULL DEFAULT 'available',
            qr_token    VARCHAR(100)
        );

        CREATE UNIQUE INDEX ix_book_copies_copy_code ON book_copies (copy_code);
        CREATE UNIQUE INDEX ix_book_copies_qr_token  ON book_copies (qr_token);
    """)


def downgrade():
    op.execute("""
        DROP INDEX IF EXISTS ix_book_copies_qr_token;
        DROP INDEX IF EXISTS ix_book_copies_copy_code;
        DROP TABLE IF EXISTS book_copies;
        DROP INDEX IF EXISTS ix_books_isbn;
        DROP INDEX IF EXISTS ix_books_qr_token;
        DROP TABLE IF EXISTS books;
        DROP TYPE IF EXISTS copy_status_enum;
    """)

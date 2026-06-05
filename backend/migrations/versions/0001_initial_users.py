"""initial users table

Revision ID: 0001
Revises:
Create Date: 2026-05-25

"""
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TYPE user_role_enum AS ENUM ('employee', 'admin');

        CREATE TABLE users (
            id          SERIAL PRIMARY KEY,
            email       VARCHAR(255) NOT NULL,
            name        VARCHAR(255) NOT NULL,
            dob         DATE         NOT NULL,
            pin_hash    VARCHAR(255) NOT NULL,
            pin_is_default BOOLEAN  NOT NULL DEFAULT TRUE,
            role        user_role_enum NOT NULL DEFAULT 'employee',
            department  VARCHAR(255),
            created_at  TIMESTAMP    NOT NULL DEFAULT now(),
            updated_at  TIMESTAMP    NOT NULL DEFAULT now()
        );

        CREATE UNIQUE INDEX ix_users_email ON users (email);
    """)


def downgrade():
    op.execute("""
        DROP INDEX IF EXISTS ix_users_email;
        DROP TABLE IF EXISTS users;
        DROP TYPE IF EXISTS user_role_enum;
    """)

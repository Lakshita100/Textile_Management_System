"""employee IDs, per-feature permissions, and attendance records

Revision ID: e5f6g7h8i9j0
Revises: d4e5f6a7b8c9
Create Date: 2026-10-10 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "e5f6g7h8i9j0"
down_revision: str | None = "d4e5f6a7b8c9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("login_id", sa.String(length=32), nullable=True))
        batch.add_column(sa.Column("permissions", sa.JSON(), nullable=False, server_default="[]"))
        batch.add_column(sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.alter_column("email", existing_type=sa.String(length=255), nullable=True)

    bind = op.get_bind()
    users = bind.execute(sa.text("SELECT id, role FROM users")).all()
    for user_id, role in users:
        prefix = "ADM" if role == "admin" else "EMP" if role == "staff" else None
        if prefix:
            bind.execute(
                sa.text("UPDATE users SET login_id = :login_id WHERE id = :user_id"),
                {"login_id": f"{prefix}-{user_id:06d}", "user_id": user_id},
            )
    bind.execute(
        sa.text("UPDATE users SET must_change_password = :required WHERE role IN ('admin', 'staff')"),
        {"required": True},
    )

    op.create_index("ix_users_login_id", "users", ["login_id"], unique=True)
    # The app's metadata.create_all() may have created this table before Alembic
    # was run. Preserve the existing records and add only missing structures.
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("attendance_records"):
        op.create_table(
            "attendance_records",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("work_date", sa.Date(), nullable=False),
            sa.Column("check_in_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("check_out_at", sa.DateTime(timezone=True), nullable=True),
            sa.UniqueConstraint("user_id", "work_date", name="uq_attendance_user_work_date"),
        )
        inspector = sa.inspect(bind)
    existing_indexes = {index["name"] for index in inspector.get_indexes("attendance_records")}
    for name, columns in (
        ("ix_attendance_records_user_id", ["user_id"]),
        ("ix_attendance_records_work_date", ["work_date"]),
    ):
        if name not in existing_indexes:
            op.create_index(name, "attendance_records", columns)


def downgrade() -> None:
    op.drop_index("ix_attendance_records_work_date", table_name="attendance_records")
    op.drop_index("ix_attendance_records_user_id", table_name="attendance_records")
    op.drop_table("attendance_records")
    op.drop_index("ix_users_login_id", table_name="users")
    with op.batch_alter_table("users") as batch:
        batch.alter_column("email", existing_type=sa.String(length=255), nullable=False)
        batch.drop_column("must_change_password")
        batch.drop_column("permissions")
        batch.drop_column("login_id")

"""store buyer conversations in the configured database

Revision ID: g7h8i9j0k1
Revises: f6a7b8c9d0e1
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "g7h8i9j0k1"
down_revision: str | None = "f6a7b8c9d0e1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    if not sa.inspect(op.get_bind()).has_table("buyer_inquiries"):
        op.create_table(
            "buyer_inquiries",
            sa.Column("id", sa.String(32), primary_key=True),
            sa.Column("buyer_id", sa.String(64), nullable=False),
            sa.Column("order_id", sa.String(32), nullable=False),
            sa.Column("subject", sa.String(200), nullable=False),
            sa.Column("type", sa.String(32), nullable=False),
            sa.Column("status", sa.String(32), nullable=False),
            sa.Column("messages", sa.JSON, nullable=False),
            sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_buyer_inquiries_buyer_id", "buyer_inquiries", ["buyer_id"])
        op.create_index("ix_buyer_inquiries_order_id", "buyer_inquiries", ["order_id"])
        op.create_index("ix_buyer_inquiries_status", "buyer_inquiries", ["status"])


def downgrade() -> None:
    # Conversation history is customer data; retain it when application code is rolled back.
    pass

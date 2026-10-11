"""persist quality packing lots and outbound shipment progress

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "h8i9j0k1l2m3"
down_revision: str | None = "g7h8i9j0k1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("packing_lots"):
        op.create_table(
            "packing_lots",
            sa.Column("id", sa.String(40), primary_key=True),
            sa.Column("inspection_id", sa.Integer(), sa.ForeignKey("quality_inspections.id", ondelete="RESTRICT"), nullable=False, unique=True),
            sa.Column("order_id", sa.String(32), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
            sa.Column("roll_id", sa.String(64), nullable=False, unique=True),
            sa.Column("batch_no", sa.String(64), nullable=False),
            sa.Column("machine_code", sa.String(40), nullable=False),
            sa.Column("quality_outcome", sa.String(20), nullable=False),
            sa.Column("quantity_meters", sa.Float(), nullable=False),
            sa.Column("status", sa.String(32), nullable=False, server_default="Pending packing"),
            sa.Column("pack_type", sa.String(20), nullable=True),
            sa.Column("cartons", sa.Integer(), nullable=True),
            sa.Column("packed_by", sa.String(120), nullable=True),
            sa.Column("packed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("shipment_id", sa.String(40), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_packing_lots_order_id", "packing_lots", ["order_id"])
        op.create_index("ix_packing_lots_status", "packing_lots", ["status"])
        op.create_index("ix_packing_lots_shipment_id", "packing_lots", ["shipment_id"])
    if not inspector.has_table("shipments"):
        op.create_table(
            "shipments",
            sa.Column("id", sa.String(40), primary_key=True),
            sa.Column("order_id", sa.String(32), sa.ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False),
            sa.Column("courier", sa.String(120), nullable=False),
            sa.Column("tracking_number", sa.String(120), nullable=True),
            sa.Column("destination", sa.String(500), nullable=True),
            sa.Column("status", sa.String(24), nullable=False, server_default="Booked"),
            sa.Column("dispatched_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_shipments_order_id", "shipments", ["order_id"])
        op.create_index("ix_shipments_status", "shipments", ["status"])


def downgrade() -> None:
    op.drop_table("shipments")
    op.drop_table("packing_lots")

"""initial smart yarn inventory schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-10-10

Creates the full Smart Yarn Inventory schema: yarn inventory, suppliers and
supplier↔yarn mappings, supplier change audit trail, stock movements, low-stock
alerts, purchase request drafts and the business-identifier sequence table.
Works on both SQLite and PostgreSQL.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "id_sequences",
        sa.Column("name", sa.String(length=32), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("name"),
    )

    op.create_table(
        "yarn_inventory",
        sa.Column("yarn_id", sa.String(length=32), nullable=False),
        sa.Column("yarn_name", sa.String(length=200), nullable=False),
        sa.Column("product_code", sa.String(length=64), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("material_composition", sa.String(length=200), nullable=False),
        sa.Column("colour_shade", sa.String(length=100), nullable=False),
        sa.Column("denier_specification", sa.String(length=100), nullable=False),
        sa.Column("current_stock", sa.Numeric(14, 3, asdecimal=False), nullable=False),
        sa.Column("unit", sa.String(length=16), nullable=False),
        sa.Column("unit_cost", sa.Numeric(12, 4, asdecimal=False), nullable=False),
        sa.Column("supplier_source", sa.String(length=200), nullable=False),
        sa.Column("minimum_stock_level", sa.Numeric(14, 3, asdecimal=False), nullable=False),
        sa.Column("storage_location", sa.String(length=100), nullable=False),
        sa.Column("batch_number", sa.String(length=64), nullable=False),
        sa.Column("inventory_stage", sa.String(length=50), nullable=False),
        sa.Column("image_file", sa.String(length=255), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("current_stock >= 0", name="ck_yarn_current_stock_non_negative"),
        sa.CheckConstraint("minimum_stock_level >= 0", name="ck_yarn_minimum_stock_non_negative"),
        sa.CheckConstraint("unit_cost >= 0", name="ck_yarn_unit_cost_non_negative"),
        sa.PrimaryKeyConstraint("yarn_id"),
    )
    op.create_index("ix_yarn_inventory_category", "yarn_inventory", ["category"])
    op.create_index("ix_yarn_inventory_supplier_source", "yarn_inventory", ["supplier_source"])
    op.create_index("ix_yarn_inventory_product_code", "yarn_inventory", ["product_code"])

    op.create_table(
        "suppliers",
        sa.Column("supplier_id", sa.String(length=16), nullable=False),
        sa.Column("company_name", sa.String(length=200), nullable=False),
        sa.Column("contact_person", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("price_per_kg", sa.Numeric(12, 4, asdecimal=False), nullable=True),
        sa.Column("min_order_qty", sa.Numeric(14, 3, asdecimal=False), nullable=True),
        sa.Column("lead_time_days", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("lead_time_days IS NULL OR lead_time_days >= 0", name="ck_supplier_lead_time_non_negative"),
        sa.CheckConstraint("min_order_qty IS NULL OR min_order_qty >= 0", name="ck_supplier_moq_non_negative"),
        sa.CheckConstraint("price_per_kg IS NULL OR price_per_kg >= 0", name="ck_supplier_price_non_negative"),
        sa.PrimaryKeyConstraint("supplier_id"),
    )
    op.create_index(
        "uq_suppliers_company_name_lower",
        "suppliers",
        [sa.text("lower(company_name)")],
        unique=True,
    )

    op.create_table(
        "supplier_categories",
        sa.Column("supplier_id", sa.String(length=16), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.CheckConstraint("length(category) > 0", name="ck_supplier_category_not_empty"),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.supplier_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("supplier_id", "category"),
    )

    op.create_table(
        "supplier_product_codes",
        sa.Column("supplier_id", sa.String(length=16), nullable=False),
        sa.Column("product_code", sa.String(length=64), nullable=False),
        sa.CheckConstraint("length(product_code) > 0", name="ck_supplier_product_code_not_empty"),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.supplier_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("supplier_id", "product_code"),
    )

    op.create_table(
        "yarn_supplier_history",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("yarn_id", sa.String(length=32), nullable=False),
        sa.Column("old_supplier", sa.String(length=200), nullable=False),
        sa.Column("new_supplier", sa.String(length=200), nullable=False),
        sa.Column("changed_by", sa.String(length=80), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("changed_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["yarn_id"], ["yarn_inventory.yarn_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_yarn_supplier_history_yarn_id", "yarn_supplier_history", ["yarn_id"])

    op.create_table(
        "stock_movements",
        sa.Column("movement_id", sa.String(length=16), nullable=False),
        sa.Column("yarn_id", sa.String(length=32), nullable=False),
        sa.Column("movement_type", sa.String(length=16), nullable=False),
        sa.Column("quantity", sa.Numeric(14, 3, asdecimal=False), nullable=False),
        sa.Column("movement_date", sa.Date(), nullable=False),
        sa.Column("reference", sa.String(length=100), nullable=False),
        sa.Column("reason", sa.String(length=200), nullable=True),
        sa.Column("supplier_name", sa.String(length=200), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("previous_quantity", sa.Numeric(14, 3, asdecimal=False), nullable=False),
        sa.Column("stock_after", sa.Numeric(14, 3, asdecimal=False), nullable=False),
        sa.Column("reversal_of", sa.String(length=16), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "movement_type IN ('Stock In', 'Consumption')",
            name="ck_movement_type_valid",
        ),
        sa.CheckConstraint("previous_quantity >= 0", name="ck_movement_previous_non_negative"),
        sa.CheckConstraint("quantity > 0", name="ck_movement_quantity_positive"),
        sa.CheckConstraint("stock_after >= 0", name="ck_movement_stock_after_non_negative"),
        sa.ForeignKeyConstraint(["reversal_of"], ["stock_movements.movement_id"]),
        sa.ForeignKeyConstraint(["yarn_id"], ["yarn_inventory.yarn_id"]),
        sa.PrimaryKeyConstraint("movement_id"),
    )
    op.create_index("ix_stock_movements_yarn_id", "stock_movements", ["yarn_id"])
    op.create_index("ix_stock_movements_movement_date", "stock_movements", ["movement_date"])

    op.create_table(
        "stock_alerts",
        sa.Column("alert_id", sa.String(length=16), nullable=False),
        sa.Column("yarn_id", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_on", sa.Date(), nullable=False),
        sa.Column("updated_on", sa.Date(), nullable=False),
        sa.Column("acknowledged_on", sa.Date(), nullable=True),
        sa.Column("resolved_on", sa.Date(), nullable=True),
        sa.CheckConstraint("status IN ('active', 'acknowledged', 'resolved')", name="ck_alert_status_valid"),
        sa.ForeignKeyConstraint(["yarn_id"], ["yarn_inventory.yarn_id"]),
        sa.PrimaryKeyConstraint("alert_id"),
    )
    op.create_index("ix_stock_alerts_status", "stock_alerts", ["status"])
    op.create_index(
        "uq_stock_alerts_one_open_per_yarn",
        "stock_alerts",
        ["yarn_id"],
        unique=True,
        sqlite_where=sa.text("status <> 'resolved'"),
        postgresql_where=sa.text("status <> 'resolved'"),
    )

    op.create_table(
        "purchase_requests",
        sa.Column("request_id", sa.String(length=16), nullable=False),
        sa.Column("document_type", sa.String(length=32), nullable=False),
        sa.Column("yarn_id", sa.String(length=32), nullable=False),
        sa.Column("supplier_id", sa.String(length=16), nullable=True),
        sa.Column("supplier_name", sa.String(length=200), nullable=False),
        sa.Column("quantity", sa.Numeric(14, 3, asdecimal=False), nullable=False),
        sa.Column("unit", sa.String(length=16), nullable=False),
        sa.Column("buffer_quantity", sa.Numeric(14, 3, asdecimal=False), nullable=False),
        sa.Column("shortage_quantity", sa.Numeric(14, 3, asdecimal=False), nullable=False),
        sa.Column("estimated_unit_cost", sa.Numeric(12, 4, asdecimal=False), nullable=True),
        sa.Column("estimated_total_cost", sa.Numeric(14, 4, asdecimal=False), nullable=True),
        sa.Column("min_order_qty", sa.Numeric(14, 3, asdecimal=False), nullable=True),
        sa.Column("expected_delivery_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("buffer_quantity >= 0", name="ck_request_buffer_non_negative"),
        sa.CheckConstraint(
            "document_type = 'purchase_request'",
            name="ck_request_document_type",
        ),
        sa.CheckConstraint(
            "estimated_total_cost IS NULL OR estimated_total_cost >= 0",
            name="ck_request_total_cost_non_negative",
        ),
        sa.CheckConstraint(
            "estimated_unit_cost IS NULL OR estimated_unit_cost >= 0",
            name="ck_request_unit_cost_non_negative",
        ),
        sa.CheckConstraint("min_order_qty IS NULL OR min_order_qty >= 0", name="ck_request_moq_non_negative"),
        sa.CheckConstraint("quantity > 0", name="ck_request_quantity_positive"),
        sa.CheckConstraint("shortage_quantity >= 0", name="ck_request_shortage_non_negative"),
        sa.CheckConstraint(
            "status IN ('draft', 'submitted', 'cancelled')",
            name="ck_request_status_valid",
        ),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.supplier_id"]),
        sa.ForeignKeyConstraint(["yarn_id"], ["yarn_inventory.yarn_id"]),
        sa.PrimaryKeyConstraint("request_id"),
    )
    op.create_index("ix_purchase_requests_yarn_id", "purchase_requests", ["yarn_id"])
    op.create_index("ix_purchase_requests_status", "purchase_requests", ["status"])


def downgrade() -> None:
    op.drop_table("purchase_requests")
    op.drop_table("stock_alerts")
    op.drop_table("stock_movements")
    op.drop_table("yarn_supplier_history")
    op.drop_table("supplier_product_codes")
    op.drop_table("supplier_categories")
    op.drop_table("suppliers")
    op.drop_table("yarn_inventory")
    op.drop_table("id_sequences")

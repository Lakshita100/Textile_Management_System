"""align the app migration graph with deployed workspace tables

Revision ID: f6a7b8c9d0e1
Revises: e5f6g7h8i9j0
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "f6a7b8c9d0e1"
down_revision: str | None = "e5f6g7h8i9j0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _has_table(name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(name)


def upgrade() -> None:
    bind = op.get_bind()
    user_columns = {column["name"] for column in sa.inspect(bind).get_columns("users")}
    for name, column in (
        ("address", sa.Column("address", sa.String(255), nullable=True)),
        ("city", sa.Column("city", sa.String(120), nullable=True)),
        ("country", sa.Column("country", sa.String(120), nullable=True)),
        ("postal_code", sa.Column("postal_code", sa.String(32), nullable=True)),
    ):
        if name not in user_columns:
            op.add_column("users", column)

    if not _has_table("orders"):
        op.create_table(
            "orders",
            sa.Column("id", sa.String(32), primary_key=True),
            sa.Column("buyer_id", sa.String(64), nullable=False),
            sa.Column("buyer_name", sa.String(120), nullable=False),
            sa.Column("company_name", sa.String(150), nullable=False),
            sa.Column("buyer_email", sa.String(255)), sa.Column("buyer_phone", sa.String(50)),
            sa.Column("source", sa.String(32), nullable=False),
            sa.Column("product_category", sa.String(100)), sa.Column("product_name", sa.String(200), nullable=False),
            sa.Column("product_code", sa.String(64)), sa.Column("yarn_type", sa.String(100)),
            sa.Column("yarn_subtype", sa.String(100)), sa.Column("material_composition", sa.String(255), nullable=False),
            sa.Column("technical_specifications", sa.Text), sa.Column("denier_count", sa.String(100)),
            sa.Column("shade", sa.String(100)), sa.Column("special_requirements", sa.Text),
            sa.Column("quantity", sa.Float, nullable=False), sa.Column("unit", sa.String(32), nullable=False),
            sa.Column("priority", sa.String(32), nullable=False), sa.Column("requested_delivery_date", sa.String(64)),
            sa.Column("delivery_address", sa.Text), sa.Column("delivery_instructions", sa.Text),
            sa.Column("target_price", sa.String(100)), sa.Column("buyer_notes", sa.Text),
            sa.Column("technical_notes", sa.Text), sa.Column("commercial_notes", sa.Text),
            sa.Column("status", sa.String(50), nullable=False), sa.Column("material_availability", sa.JSON),
            sa.Column("review_history", sa.JSON, nullable=False), sa.Column("buyer_visible_updates", sa.JSON, nullable=False),
            sa.Column("status_history", sa.JSON, nullable=False),
            sa.Column("production_job_id", sa.Integer, sa.ForeignKey("production_jobs.id", ondelete="SET NULL")),
            sa.Column("yarn_id", sa.String(32), sa.ForeignKey("yarn_inventory.yarn_id", ondelete="SET NULL")),
            sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
            sa.Column("submitted_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_orders_buyer_id", "orders", ["buyer_id"])
        op.create_index("ix_orders_status", "orders", ["status"])

    if not _has_table("fabric_recipes"):
        op.create_table(
            "fabric_recipes",
            sa.Column("recipe_code", sa.String(40), primary_key=True),
            sa.Column("fabric_name", sa.String(160), nullable=False),
            sa.Column("fabric_category", sa.String(80), nullable=False),
            sa.Column("construction", sa.String(120), nullable=False),
            sa.Column("finished_weight_kg", sa.Float, nullable=False),
            sa.Column("expected_waste_percent", sa.Float, nullable=False),
            sa.Column("notes", sa.Text), sa.Column("active", sa.Boolean, nullable=False),
            sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
            sa.CheckConstraint("finished_weight_kg > 0", name="ck_recipe_finished_weight_positive"),
        )
        op.create_index("ix_fabric_recipes_active", "fabric_recipes", ["active"])
        op.create_index("ix_fabric_recipes_fabric_category", "fabric_recipes", ["fabric_category"])

    if not _has_table("fabric_recipe_ingredients"):
        op.create_table(
            "fabric_recipe_ingredients",
            sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
            sa.Column("recipe_code", sa.String(40), sa.ForeignKey("fabric_recipes.recipe_code", ondelete="CASCADE"), nullable=False),
            sa.Column("line_no", sa.Integer, nullable=False),
            sa.Column("yarn_id", sa.String(32), sa.ForeignKey("yarn_inventory.yarn_id", ondelete="SET NULL")),
            sa.Column("yarn_role", sa.String(80), nullable=False), sa.Column("yarn_type", sa.String(100), nullable=False),
            sa.Column("specification", sa.String(120), nullable=False), sa.Column("quantity_kg", sa.Float, nullable=False),
            sa.Column("waste_percent", sa.Float, nullable=False), sa.Column("notes", sa.Text),
            sa.CheckConstraint("line_no > 0", name="ck_recipe_line_positive"),
            sa.CheckConstraint("quantity_kg > 0", name="ck_recipe_quantity_positive"),
            sa.CheckConstraint("waste_percent >= 0", name="ck_recipe_waste_non_negative"),
        )
        op.create_index("ix_fabric_recipe_ingredients_recipe_code", "fabric_recipe_ingredients", ["recipe_code"])
        op.create_index("ix_fabric_recipe_ingredients_yarn_id", "fabric_recipe_ingredients", ["yarn_id"])

def downgrade() -> None:
    # This revision is also the bridge to a database already populated in Supabase.
    # Keep production tables and user data on downgrade.
    pass

"""inventory filter + recency indexes

Revision ID: 0002_inventory_perf_indexes
Revises: 0001_initial
Create Date: 2026-10-10

Adds b-tree indexes for the new inventory filters (colour, stage) and the
dashboard's recently-updated ordering. Safe to run on an existing table.
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_inventory_perf_indexes"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_yarn_inventory_colour_shade", "yarn_inventory", ["colour_shade"])
    op.create_index("ix_yarn_inventory_inventory_stage", "yarn_inventory", ["inventory_stage"])
    op.create_index("ix_yarn_inventory_updated_at", "yarn_inventory", ["updated_at"])


def downgrade() -> None:
    op.drop_index("ix_yarn_inventory_updated_at", table_name="yarn_inventory")
    op.drop_index("ix_yarn_inventory_inventory_stage", table_name="yarn_inventory")
    op.drop_index("ix_yarn_inventory_colour_shade", table_name="yarn_inventory")

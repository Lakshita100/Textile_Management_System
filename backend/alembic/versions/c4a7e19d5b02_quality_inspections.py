"""quality inspections

Revision ID: c4a7e19d5b02
Revises: 909cc08f3f36
Create Date: 2026-10-10 18:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'c4a7e19d5b02'
down_revision: str | None = '909cc08f3f36'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'quality_inspections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=16), nullable=False),
        sa.Column('roll_id', sa.String(length=64), nullable=False),
        sa.Column('batch_no', sa.String(length=64), nullable=False),
        sa.Column('order_ref', sa.String(length=64), nullable=False),
        sa.Column('machine_id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.String(length=32), nullable=False),
        sa.Column('inspector_name', sa.String(length=120), nullable=False),
        sa.Column('inspected_at', sa.Date(), nullable=False),
        sa.Column('inspected_qty_meters', sa.Float(), nullable=False),
        sa.Column('accepted_qty_meters', sa.Float(), nullable=False),
        sa.Column('total_defect_count', sa.Integer(), nullable=False),
        sa.Column('defects', sa.JSON(), nullable=False),
        sa.Column('outcome', sa.Enum('Approved', 'Rework', 'Rejected', name='inspection_outcome', native_enum=False, length=20), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_quality_inspections_code'), 'quality_inspections', ['code'], unique=True)
    op.create_index(op.f('ix_quality_inspections_roll_id'), 'quality_inspections', ['roll_id'], unique=False)
    op.create_index(op.f('ix_quality_inspections_batch_no'), 'quality_inspections', ['batch_no'], unique=False)
    op.create_index(op.f('ix_quality_inspections_order_ref'), 'quality_inspections', ['order_ref'], unique=False)
    op.create_index(op.f('ix_quality_inspections_machine_id'), 'quality_inspections', ['machine_id'], unique=False)
    op.create_index(op.f('ix_quality_inspections_employee_id'), 'quality_inspections', ['employee_id'], unique=False)
    op.create_index(op.f('ix_quality_inspections_inspected_at'), 'quality_inspections', ['inspected_at'], unique=False)
    op.create_index(op.f('ix_quality_inspections_outcome'), 'quality_inspections', ['outcome'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_quality_inspections_outcome'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_inspected_at'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_employee_id'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_machine_id'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_order_ref'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_batch_no'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_roll_id'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_code'), table_name='quality_inspections')
    op.drop_table('quality_inspections')

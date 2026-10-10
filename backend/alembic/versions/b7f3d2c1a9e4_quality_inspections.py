"""quality inspections (Feature 03 persistent storage)

Revision ID: b7f3d2c1a9e4
Revises: 909cc08f3f36
Create Date: 2026-10-10 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b7f3d2c1a9e4'
down_revision: str | None = '909cc08f3f36'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'quality_inspections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('machine_id', sa.Integer(), nullable=False),
        sa.Column('order_ref', sa.String(length=64), nullable=False),
        sa.Column('batch_no', sa.String(length=64), nullable=False),
        sa.Column('roll_id', sa.String(length=64), nullable=False),
        sa.Column('employee_id', sa.String(length=32), nullable=False),
        sa.Column('inspector_name', sa.String(length=128), nullable=False),
        sa.Column('inspected_at', sa.Date(), nullable=False),
        sa.Column('inspected_qty_meters', sa.Float(), nullable=False),
        sa.Column('accepted_qty_meters', sa.Float(), nullable=False),
        sa.Column('defects', sa.JSON(), nullable=False),
        sa.Column('total_defect_count', sa.Integer(), nullable=False),
        sa.Column('outcome', sa.String(length=20), nullable=False),
        sa.Column('remarks', sa.Text(), nullable=True),
        sa.Column('source', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "outcome IN ('Approved', 'Rework', 'Rejected')",
            name='ck_quality_inspections_outcome',
        ),
        sa.CheckConstraint(
            'inspected_qty_meters > 0',
            name='ck_quality_inspections_inspected_qty_positive',
        ),
        sa.CheckConstraint(
            'total_defect_count >= 0',
            name='ck_quality_inspections_defect_count_nonneg',
        ),
        sa.ForeignKeyConstraint(['job_id'], ['production_jobs.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_quality_inspections_job_id'), 'quality_inspections', ['job_id'], unique=False)
    op.create_index(op.f('ix_quality_inspections_machine_id'), 'quality_inspections', ['machine_id'], unique=False)
    op.create_index(op.f('ix_quality_inspections_order_ref'), 'quality_inspections', ['order_ref'], unique=False)
    op.create_index(op.f('ix_quality_inspections_batch_no'), 'quality_inspections', ['batch_no'], unique=False)
    op.create_index(op.f('ix_quality_inspections_employee_id'), 'quality_inspections', ['employee_id'], unique=False)
    op.create_index(op.f('ix_quality_inspections_inspected_at'), 'quality_inspections', ['inspected_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_quality_inspections_inspected_at'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_employee_id'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_batch_no'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_order_ref'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_machine_id'), table_name='quality_inspections')
    op.drop_index(op.f('ix_quality_inspections_job_id'), table_name='quality_inspections')
    op.drop_table('quality_inspections')

"""Predictive Academic Intelligence Engine Phase 8 Migration

Revision ID: a8h07l00g800
Revises: 97g06k00f700
Create Date: 2026-08-23 01:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a8h07l00g800'
down_revision: Union[str, Sequence[str], None] = '97g06k00f700'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. prediction_snapshots
    op.create_table(
        'prediction_snapshots',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('prediction_type', sa.String(length=50), nullable=False),
        sa.Column('score', sa.Float(), server_default=sa.text('0.0')),
        sa.Column('confidence', sa.Float(), server_default=sa.text('90.0')),
        sa.Column('reasons_json', sa.JSON(), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 2. interventions
    op.create_table(
        'interventions',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('prediction_id', sa.String(length=36), sa.ForeignKey('prediction_snapshots.id', ondelete='SET NULL'), nullable=True),
        sa.Column('intervention_type', sa.String(length=50), server_default=sa.text("'REMEDIAL_PRACTICE'")),
        sa.Column('priority', sa.String(length=20), server_default=sa.text("'HIGH'")),
        sa.Column('action_plan', sa.JSON(), nullable=False),
        sa.Column('completed', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 3. placement_readiness
    op.create_table(
        'placement_readiness',
        sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False, primary_key=True),
        sa.Column('score', sa.Float(), server_default=sa.text('0.0')),
        sa.Column('technical', sa.Float(), server_default=sa.text('75.0')),
        sa.Column('coding', sa.Float(), server_default=sa.text('70.0')),
        sa.Column('aptitude', sa.Float(), server_default=sa.text('80.0')),
        sa.Column('communication', sa.Float(), server_default=sa.text('85.0')),
        sa.Column('projects', sa.Float(), server_default=sa.text('75.0')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

def downgrade() -> None:
    op.drop_table('placement_readiness')
    op.drop_table('interventions')
    op.drop_table('prediction_snapshots')

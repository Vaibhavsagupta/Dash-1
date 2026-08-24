"""Institutional Intelligence Command Center Phase 9 Migration

Revision ID: b9i08m00h900
Revises: a8h07l00g800
Create Date: 2026-08-23 02:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b9i08m00h900'
down_revision: Union[str, Sequence[str], None] = 'a8h07l00g800'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. institutional_kpis
    op.create_table(
        'institutional_kpis',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('kpi_name', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=50), server_default=sa.text("'ACADEMIC'")),
        sa.Column('formula', sa.Text(), nullable=True),
        sa.Column('target_value', sa.Float(), server_default=sa.text('80.0')),
        sa.Column('current_value', sa.Float(), server_default=sa.text('82.5')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 2. scheduled_reports
    op.create_table(
        'scheduled_reports',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('report_name', sa.String(length=100), nullable=False),
        sa.Column('frequency', sa.String(length=20), server_default=sa.text("'WEEKLY'")),
        sa.Column('recipient_role', sa.String(length=50), server_default=sa.text("'HOD'")),
        sa.Column('format', sa.String(length=10), server_default=sa.text("'PDF'")),
        sa.Column('last_sent', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('active', sa.Boolean(), server_default=sa.text('true'))
    )

    # 3. report_history
    op.create_table(
        'report_history',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('file_path', sa.Text(), nullable=True),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 4. accreditation_evidence
    op.create_table(
        'accreditation_evidence',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('accreditation_body', sa.String(length=20), nullable=False),
        sa.Column('criterion_code', sa.String(length=50), nullable=False),
        sa.Column('evidence_title', sa.Text(), nullable=False),
        sa.Column('evidence_data', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default=sa.text("'VERIFIED'")),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 5. benchmark_snapshots
    op.create_table(
        'benchmark_snapshots',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('benchmark_type', sa.String(length=50), nullable=False),
        sa.Column('entity_a', sa.String(length=100), nullable=False),
        sa.Column('entity_b', sa.String(length=100), nullable=False),
        sa.Column('metrics_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

def downgrade() -> None:
    op.drop_table('benchmark_snapshots')
    op.drop_table('accreditation_evidence')
    op.drop_table('report_history')
    op.drop_table('scheduled_reports')
    op.drop_table('institutional_kpis')

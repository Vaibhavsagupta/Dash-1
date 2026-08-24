"""Curriculum OS Phase 1 Migration

Revision ID: 31a89f92b100
Revises: 20d95af8d0fb
Create Date: 2026-08-22 23:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '31a89f92b100'
down_revision: Union[str, Sequence[str], None] = '20d95af8d0fb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. programs
    op.create_table(
        'programs',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('code', sa.String(length=10), nullable=False, unique=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'))
    )

    # 2. semester_templates
    op.create_table(
        'semester_templates',
        sa.Column('semester', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('total_marks', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 3. course_slots
    op.create_table(
        'course_slots',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('semester', sa.Integer(), sa.ForeignKey('semester_templates.semester'), nullable=False),
        sa.Column('slot_code', sa.String(length=30), nullable=False),
        sa.Column('slot_name', sa.Text(), nullable=False),
        sa.Column('slot_type', sa.String(length=50), nullable=True),
        sa.Column('max_marks', sa.Integer(), nullable=True),
        sa.Column('is_specialization', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('is_generic_elective', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('display_order', sa.Integer(), server_default=sa.text('0'))
    )

    # 4. courses
    op.create_table(
        'courses',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('program_id', sa.Integer(), sa.ForeignKey('programs.id'), nullable=False),
        sa.Column('semester', sa.Integer(), sa.ForeignKey('semester_templates.semester'), nullable=False),
        sa.Column('slot_id', sa.Integer(), sa.ForeignKey('course_slots.id'), nullable=True),
        sa.Column('course_code', sa.String(length=30), nullable=False),
        sa.Column('course_name', sa.Text(), nullable=False),
        sa.Column('theory_marks', sa.Integer(), server_default=sa.text('0')),
        sa.Column('practical_marks', sa.Integer(), server_default=sa.text('0')),
        sa.Column('internal_marks', sa.Integer(), server_default=sa.text('0')),
        sa.Column('external_marks', sa.Integer(), server_default=sa.text('0')),
        sa.UniqueConstraint('program_id', 'semester', 'course_code', name='uq_program_sem_course_code')
    )

    # 5. curriculum_versions
    op.create_table(
        'curriculum_versions',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('program_id', sa.Integer(), sa.ForeignKey('programs.id'), nullable=False),
        sa.Column('semester', sa.Integer(), nullable=False),
        sa.Column('academic_year', sa.String(length=20), nullable=True),
        sa.Column('version_no', sa.Integer(), server_default=sa.text('1')),
        sa.Column('status', sa.String(length=20), server_default=sa.text("'ACTIVE'")),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 6. batches
    op.create_table(
        'batches',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('batch_year', sa.Integer(), nullable=False, unique=True)
    )

    # 7. academic_sessions
    op.create_table(
        'academic_sessions',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('session_name', sa.String(length=20), nullable=False),
        sa.Column('is_current', sa.Boolean(), server_default=sa.text('false'))
    )

    # 8. curriculum_audit
    op.create_table(
        'curriculum_audit',
        sa.Column('id', sa.BigInteger(), nullable=False, primary_key=True, autoincrement=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('table_name', sa.String(length=50), nullable=False),
        sa.Column('record_id', sa.Text(), nullable=True),
        sa.Column('performed_by', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

def downgrade() -> None:
    op.drop_table('curriculum_audit')
    op.drop_table('academic_sessions')
    op.drop_table('batches')
    op.drop_table('curriculum_versions')
    op.drop_table('courses')
    op.drop_table('course_slots')
    op.drop_table('semester_templates')
    op.drop_table('programs')

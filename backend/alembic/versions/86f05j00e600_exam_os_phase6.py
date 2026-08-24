"""Exam Operating System Phase 6 Migration

Revision ID: 86f05j00e600
Revises: 75e04i00d500
Create Date: 2026-08-23 01:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '86f05j00e600'
down_revision: Union[str, Sequence[str], None] = '75e04i00d500'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. tests
    op.create_table(
        'tests',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('course_id', sa.String(length=36), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('faculty_id', sa.String(length=36), sa.ForeignKey('faculty.id', ondelete='SET NULL'), nullable=True),
        sa.Column('total_marks', sa.Integer(), server_default=sa.text('100')),
        sa.Column('duration_minutes', sa.Integer(), server_default=sa.text('180')),
        sa.Column('test_type', sa.String(length=30), server_default=sa.text("'ENDSEM'")),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=20), server_default=sa.text("'ACTIVE'")),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 2. test_assignments
    op.create_table(
        'test_assignments',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('test_id', sa.String(length=36), sa.ForeignKey('tests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('attempt_limit', sa.Integer(), server_default=sa.text('1'))
    )

    # 3. test_attempts
    op.create_table(
        'test_attempts',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('test_id', sa.String(length=36), sa.ForeignKey('tests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('score', sa.Float(), server_default=sa.text('0.0')),
        sa.Column('percentage', sa.Float(), server_default=sa.text('0.0')),
        sa.Column('tab_switch_count', sa.Integer(), server_default=sa.text('0')),
        sa.Column('fullscreen_violations', sa.Integer(), server_default=sa.text('0')),
        sa.Column('suspicious_score', sa.Float(), server_default=sa.text('0.0'))
    )

    # 4. student_answers
    op.create_table(
        'student_answers',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('attempt_id', sa.String(length=36), sa.ForeignKey('test_attempts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_id', sa.String(length=36), sa.ForeignKey('questions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('answer', sa.Text(), nullable=True),
        sa.Column('code_language', sa.String(length=20), nullable=True),
        sa.Column('obtained_marks', sa.Float(), server_default=sa.text('0.0')),
        sa.Column('is_correct', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('ai_feedback', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

def downgrade() -> None:
    op.drop_table('student_answers')
    op.drop_table('test_attempts')
    op.drop_table('test_assignments')
    op.drop_table('tests')

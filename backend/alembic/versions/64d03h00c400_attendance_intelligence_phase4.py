"""Attendance Intelligence Engine Phase 4 Migration

Revision ID: 64d03h00c400
Revises: 53c92g00b300
Create Date: 2026-08-23 00:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '64d03h00c400'
down_revision: Union[str, Sequence[str], None] = '53c92g00b300'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. lecture_sessions
    op.create_table(
        'lecture_sessions',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('faculty_id', sa.String(length=36), sa.ForeignKey('faculty.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', sa.String(length=36), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('batch_id', sa.Integer(), sa.ForeignKey('batches.id'), nullable=True),
        sa.Column('semester', sa.Integer(), nullable=False),
        sa.Column('topic_id', sa.String(length=36), sa.ForeignKey('course_topics.id', ondelete='SET NULL'), nullable=True),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('lecture_date', sa.Date(), server_default=sa.func.current_date()),
        sa.Column('start_time', sa.Time(), nullable=True),
        sa.Column('end_time', sa.Time(), nullable=True),
        sa.Column('qr_token', sa.String(length=100), nullable=True, unique=True),
        sa.Column('session_status', sa.String(length=20), server_default=sa.text("'ACTIVE'")),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 2. attendance_records
    op.create_table(
        'attendance_records',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('lecture_id', sa.String(length=36), sa.ForeignKey('lecture_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(length=20), server_default=sa.text("'PRESENT'")),
        sa.Column('check_in', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('check_out', sa.DateTime(timezone=True), nullable=True),
        sa.Column('attendance_mode', sa.String(length=20), server_default=sa.text("'QR'")),
        sa.Column('confidence_score', sa.Numeric(precision=5, scale=2), server_default=sa.text('100.0')),
        sa.Column('device_fingerprint', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 3. attendance_summary
    op.create_table(
        'attendance_summary',
        sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False, primary_key=True),
        sa.Column('course_id', sa.String(length=36), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False, primary_key=True),
        sa.Column('total_classes', sa.Integer(), server_default=sa.text('0')),
        sa.Column('attended', sa.Integer(), server_default=sa.text('0')),
        sa.Column('percentage', sa.Numeric(precision=5, scale=2), server_default=sa.text('0.0')),
        sa.Column('risk_score', sa.Numeric(precision=5, scale=2), server_default=sa.text('0.0'))
    )

    # 4. attendance_alerts
    op.create_table(
        'attendance_alerts',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('resolved', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

def downgrade() -> None:
    op.drop_table('attendance_alerts')
    op.drop_table('attendance_summary')
    op.drop_table('attendance_records')
    op.drop_table('lecture_sessions')

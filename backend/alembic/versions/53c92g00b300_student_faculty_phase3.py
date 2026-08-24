"""Student & Faculty Management System Phase 3 Migration

Revision ID: 53c92g00b300
Revises: 42b91f00a200
Create Date: 2026-08-23 00:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '53c92g00b300'
down_revision: Union[str, Sequence[str], None] = '42b91f00a200'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. students
    op.create_table(
        'students',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('enrollment_no', sa.String(length=50), nullable=False, unique=True),
        sa.Column('scholar_no', sa.String(length=50), nullable=True, unique=True),
        sa.Column('full_name', sa.Text(), nullable=False),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('dob', sa.Date(), nullable=True),
        sa.Column('email', sa.Text(), nullable=True),
        sa.Column('mobile', sa.String(length=20), nullable=True),
        sa.Column('parent_name', sa.Text(), nullable=True),
        sa.Column('parent_mobile', sa.String(length=20), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('blood_group', sa.String(length=10), nullable=True),
        sa.Column('batch_id', sa.Integer(), sa.ForeignKey('batches.id'), nullable=True),
        sa.Column('program_id', sa.Integer(), sa.ForeignKey('programs.id'), nullable=True),
        sa.Column('current_semester', sa.Integer(), server_default=sa.text('1')),
        sa.Column('admission_year', sa.Integer(), server_default=sa.text('2023')),
        sa.Column('status', sa.String(length=20), server_default=sa.text("'ACTIVE'")),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 2. faculty
    op.create_table(
        'faculty',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('employee_code', sa.String(length=30), nullable=False, unique=True),
        sa.Column('full_name', sa.Text(), nullable=False),
        sa.Column('email', sa.Text(), nullable=False, unique=True),
        sa.Column('mobile', sa.String(length=20), nullable=True),
        sa.Column('designation', sa.Text(), server_default=sa.text("'Assistant Professor'")),
        sa.Column('department', sa.Text(), server_default=sa.text("'CSE'")),
        sa.Column('joining_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default=sa.text("'ACTIVE'"))
    )

    # 3. faculty_course_mapping
    op.create_table(
        'faculty_course_mapping',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('faculty_id', sa.String(length=36), sa.ForeignKey('faculty.id', ondelete='CASCADE'), nullable=False),
        sa.Column('course_id', sa.String(length=36), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('batch_id', sa.Integer(), sa.ForeignKey('batches.id'), nullable=True),
        sa.Column('semester', sa.Integer(), nullable=False),
        sa.Column('academic_session_id', sa.Integer(), sa.ForeignKey('academic_sessions.id'), nullable=True)
    )

    # 4. student_academic_mapping
    op.create_table(
        'student_academic_mapping',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('academic_session_id', sa.Integer(), sa.ForeignKey('academic_sessions.id'), nullable=True),
        sa.Column('batch_id', sa.Integer(), sa.ForeignKey('batches.id'), nullable=True),
        sa.Column('program_id', sa.Integer(), sa.ForeignKey('programs.id'), nullable=True),
        sa.Column('semester', sa.Integer(), nullable=False),
        sa.Column('promoted', sa.Boolean(), server_default=sa.text('true'))
    )

    # 5. user_accounts
    op.create_table(
        'user_accounts',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('email', sa.Text(), nullable=False, unique=True),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('linked_student', sa.String(length=36), sa.ForeignKey('students.id', ondelete='SET NULL'), nullable=True),
        sa.Column('linked_faculty', sa.String(length=36), sa.ForeignKey('faculty.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'))
    )

def downgrade() -> None:
    op.drop_table('user_accounts')
    op.drop_table('student_academic_mapping')
    op.drop_table('faculty_course_mapping')
    op.drop_table('faculty')
    op.drop_table('students')

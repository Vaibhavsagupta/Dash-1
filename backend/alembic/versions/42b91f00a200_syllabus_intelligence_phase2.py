"""Syllabus Intelligence Engine Phase 2 Migration

Revision ID: 42b91f00a200
Revises: 31a89f92b100
Create Date: 2026-08-22 23:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '42b91f00a200'
down_revision: Union[str, Sequence[str], None] = '31a89f92b100'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. syllabus_files
    op.create_table(
        'syllabus_files',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('course_id', sa.String(length=36), sa.ForeignKey('courses.id', ondelete='SET NULL'), nullable=True),
        sa.Column('source_type', sa.String(length=20), server_default=sa.text("'OFFICIAL'"), nullable=False),
        sa.Column('file_name', sa.Text(), nullable=False),
        sa.Column('file_path', sa.Text(), nullable=False),
        sa.Column('file_hash', sa.String(length=64), nullable=False, unique=True),
        sa.Column('uploaded_by', sa.String(length=36), nullable=True),
        sa.Column('upload_status', sa.String(length=20), server_default=sa.text("'PROCESSED'")),
        sa.Column('parser_confidence', sa.Numeric(precision=5, scale=2), server_default=sa.text('95.00')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 2. course_units
    op.create_table(
        'course_units',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('syllabus_file_id', sa.String(length=36), sa.ForeignKey('syllabus_files.id', ondelete='CASCADE'), nullable=False),
        sa.Column('unit_number', sa.Integer(), nullable=False),
        sa.Column('unit_title', sa.Text(), nullable=False),
        sa.Column('teaching_hours', sa.Integer(), server_default=sa.text('8')),
        sa.Column('display_order', sa.Integer(), server_default=sa.text('1'))
    )

    # 3. course_topics
    op.create_table(
        'course_topics',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('unit_id', sa.String(length=36), sa.ForeignKey('course_units.id', ondelete='CASCADE'), nullable=False),
        sa.Column('topic_order', sa.Integer(), server_default=sa.text('1')),
        sa.Column('topic_name', sa.Text(), nullable=False),
        sa.Column('keywords', sa.Text(), nullable=True),
        sa.Column('embedding', sa.Text(), nullable=True)
    )

    # 4. course_outcomes
    op.create_table(
        'course_outcomes',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('syllabus_file_id', sa.String(length=36), sa.ForeignKey('syllabus_files.id', ondelete='CASCADE'), nullable=False),
        sa.Column('co_code', sa.String(length=10), nullable=False),
        sa.Column('description', sa.Text(), nullable=False)
    )

    # 5. topic_co_mapping
    op.create_table(
        'topic_co_mapping',
        sa.Column('topic_id', sa.String(length=36), sa.ForeignKey('course_topics.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('outcome_id', sa.String(length=36), sa.ForeignKey('course_outcomes.id', ondelete='CASCADE'), primary_key=True)
    )

    # 6. recommended_books
    op.create_table(
        'recommended_books',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('syllabus_file_id', sa.String(length=36), sa.ForeignKey('syllabus_files.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('author', sa.Text(), nullable=True),
        sa.Column('publisher', sa.Text(), nullable=True)
    )

def downgrade() -> None:
    op.drop_table('recommended_books')
    op.drop_table('topic_co_mapping')
    op.drop_table('course_outcomes')
    op.drop_table('course_topics')
    op.drop_table('course_units')
    op.drop_table('syllabus_files')

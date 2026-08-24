"""AI Question Intelligence Engine Phase 5 Migration

Revision ID: 75e04i00d500
Revises: 64d03h00c400
Create Date: 2026-08-23 00:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '75e04i00d500'
down_revision: Union[str, Sequence[str], None] = '64d03h00c400'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. questions
    op.create_table(
        'questions',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('course_id', sa.String(length=36), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('topic_id', sa.String(length=36), sa.ForeignKey('course_topics.id', ondelete='SET NULL'), nullable=True),
        sa.Column('co_id', sa.String(length=36), sa.ForeignKey('course_outcomes.id', ondelete='SET NULL'), nullable=True),
        sa.Column('unit_id', sa.String(length=36), sa.ForeignKey('course_units.id', ondelete='SET NULL'), nullable=True),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(length=30), server_default=sa.text("'SHORT'")),
        sa.Column('difficulty', sa.String(length=20), server_default=sa.text("'Medium'")),
        sa.Column('bloom_level', sa.String(length=30), server_default=sa.text("'Understand'")),
        sa.Column('marks', sa.Integer(), server_default=sa.text('5')),
        sa.Column('language', sa.String(length=20), server_default=sa.text("'English'")),
        sa.Column('source_type', sa.String(length=20), server_default=sa.text("'OFFICIAL'")),
        sa.Column('ai_generated', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('status', sa.String(length=20), server_default=sa.text("'PENDING_REVIEW'")),
        sa.Column('version', sa.Integer(), server_default=sa.text('1')),
        sa.Column('embedding_str', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 2. question_versions
    op.create_table(
        'question_versions',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('question_id', sa.String(length=36), sa.ForeignKey('questions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('modified_by', sa.String(length=36), nullable=True),
        sa.Column('change_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

    # 3. question_options
    op.create_table(
        'question_options',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('question_id', sa.String(length=36), sa.ForeignKey('questions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('option_key', sa.String(length=10), nullable=False),
        sa.Column('option_text', sa.Text(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), server_default=sa.text('false'))
    )

    # 4. question_solutions
    op.create_table(
        'question_solutions',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('question_id', sa.String(length=36), sa.ForeignKey('questions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('solution_text', sa.Text(), nullable=False),
        sa.Column('stepwise_explanation', sa.Text(), nullable=True),
        sa.Column('references_text', sa.Text(), nullable=True)
    )

    # 5. question_papers
    op.create_table(
        'question_papers',
        sa.Column('id', sa.String(length=36), nullable=False, primary_key=True),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('course_id', sa.String(length=36), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('batch_id', sa.Integer(), sa.ForeignKey('batches.id'), nullable=True),
        sa.Column('semester', sa.Integer(), nullable=False),
        sa.Column('total_marks', sa.Integer(), server_default=sa.text('100')),
        sa.Column('duration_minutes', sa.Integer(), server_default=sa.text('180')),
        sa.Column('template_type', sa.String(length=30), server_default=sa.text("'EndSem'")),
        sa.Column('paper_structure', sa.JSON(), nullable=False),
        sa.Column('created_by', sa.String(length=36), sa.ForeignKey('faculty.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )

def downgrade() -> None:
    op.drop_table('question_papers')
    op.drop_table('question_solutions')
    op.drop_table('question_options')
    op.drop_table('question_versions')
    op.drop_table('questions')

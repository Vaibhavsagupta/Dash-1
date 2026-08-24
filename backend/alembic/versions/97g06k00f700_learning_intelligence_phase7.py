"""Learning Intelligence Engine Phase 7 Migration

Revision ID: 97g06k00f700
Revises: 86f05j00e600
Create Date: 2026-08-23 01:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '97g06k00f700'
down_revision: Union[str, Sequence[str], None] = '86f05j00e600'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. student_topic_mastery
    op.create_table(
        'student_topic_mastery',
        sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('topic_id', sa.String(length=36), sa.ForeignKey('course_topics.id', ondelete='CASCADE'), nullable=False),
        sa.Column('mastery_score', sa.Float(), server_default=sa.text('0.0')),
        sa.Column('confidence', sa.Float(), server_default=sa.text('0.0')),
        sa.Column('last_updated', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('student_id', 'topic_id')
    )

    # 2. student_co_attainment
    op.create_table(
        'student_co_attainment',
        sa.Column('student_id', sa.String(length=36), sa.ForeignKey('students.id', ondelete='CASCADE'), nullable=False),
        sa.Column('co_id', sa.String(length=36), sa.ForeignKey('course_outcomes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('attainment', sa.Float(), server_default=sa.text('0.0')),
        sa.Column('last_updated', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('student_id', 'co_id')
    )

def downgrade() -> None:
    op.drop_table('student_co_attainment')
    op.drop_table('student_topic_mastery')

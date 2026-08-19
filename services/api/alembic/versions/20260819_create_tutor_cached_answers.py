"""create_tutor_cached_answers

Revision ID: e5f6g7h8i9j0
Revises: e4b5c6d7e8f9
Create Date: 2026-08-19 13:15:00.000000
"""

from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision = 'e5f6g7h8i9j0'
down_revision = 'e4b5c6d7e8f9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tutor_cached_answers',
        sa.Column('id', sa.UUID(), primary_key=True, default=uuid.uuid4),
        sa.Column('question_hash', sa.String(length=64), unique=True, nullable=False),
        sa.Column('age_tier', sa.String(length=50), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_tutor_cached_answers_hash', 'tutor_cached_answers', ['question_hash'])


def downgrade() -> None:
    op.drop_index('idx_tutor_cached_answers_hash', table_name='tutor_cached_answers')
    op.drop_table('tutor_cached_answers')

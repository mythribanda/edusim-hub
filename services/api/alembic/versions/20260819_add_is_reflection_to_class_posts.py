"""add_is_reflection_to_class_posts

Revision ID: e3b4c5d6e7f8
Revises: e2b3c4d5e6f7
Create Date: 2026-08-19 12:40:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e3b4c5d6e7f8'
down_revision = 'e2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('class_posts', sa.Column('is_reflection', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('class_posts', 'is_reflection')

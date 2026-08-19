"""add_reactions_to_class_posts

Revision ID: e2b3c4d5e6f7
Revises: e1a2b3c4d5e6
Create Date: 2026-08-19 12:26:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e2b3c4d5e6f7'
down_revision = 'e1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('class_posts', sa.Column('reactions', sa.JSON(), server_default='{}', nullable=False))


def downgrade() -> None:
    op.drop_column('class_posts', 'reactions')

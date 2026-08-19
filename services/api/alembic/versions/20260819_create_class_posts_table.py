"""create_class_posts_table

Revision ID: e1a2b3c4d5e6
Revises: c01f90fa39c7
Create Date: 2026-08-19 11:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e1a2b3c4d5e6'
down_revision = 'c01f90fa39c7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'class_posts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('class_id', sa.UUID(), nullable=False),
        sa.Column('author_id', sa.UUID(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('parent_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['class_posts.id'], ondelete='CASCADE')
    )
    op.create_index('idx_class_posts_class_id', 'class_posts', ['class_id'], unique=False)
    op.create_index('idx_class_posts_author_id', 'class_posts', ['author_id'], unique=False)
    op.create_index('idx_class_posts_parent_id', 'class_posts', ['parent_id'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_class_posts_parent_id', table_name='class_posts')
    op.drop_index('idx_class_posts_author_id', table_name='class_posts')
    op.drop_index('idx_class_posts_class_id', table_name='class_posts')
    op.drop_table('class_posts')

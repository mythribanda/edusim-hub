"""create_tutor_request_logs

Revision ID: e4b5c6d7e8f9
Revises: e3b4c5d6e7f8
Create Date: 2026-08-19 13:08:00.000000
"""

from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision = 'e4b5c6d7e8f9'
down_revision = 'e3b4c5d6e7f8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tutor_request_logs',
        sa.Column('id', sa.UUID(), primary_key=True, default=uuid.uuid4),
        sa.Column('student_id', sa.UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tier', sa.String(length=50), nullable=False),
        sa.Column('model_used', sa.String(length=255), nullable=False),
        sa.Column('token_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_tutor_request_logs_student_id', 'tutor_request_logs', ['student_id'])


def downgrade() -> None:
    op.drop_index('idx_tutor_request_logs_student_id', table_name='tutor_request_logs')
    op.drop_table('tutor_request_logs')

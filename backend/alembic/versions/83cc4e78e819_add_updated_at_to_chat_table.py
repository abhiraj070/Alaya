"""add_updated_at_to_chat_table

Revision ID: 83cc4e78e819
Revises: 4f44b756b602
Create Date: 2026-10-14 21:34:16.561379

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '83cc4e78e819'
down_revision: Union[str, Sequence[str], None] = '4f44b756b602'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'chat',
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.add_column(
        'chat',
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('chat', 'updated_at')
    op.drop_column('chat', 'created_at')


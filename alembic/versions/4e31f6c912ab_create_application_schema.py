"""Create application schema.

Revision ID: 4e31f6c912ab
Revises: ff637121967c
Create Date: 2026-09-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector


revision: str = "4e31f6c912ab"
down_revision: Union[str, Sequence[str], None] = "ff637121967c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


sender = sa.Enum("LLM", "USER", name="sender")
embedding_kind = sa.Enum("MESSAGE", "KNOWLEDGE", name="embedding_kind")


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("username", sa.Text(), nullable=False),
        sa.Column("password", sa.Text(), nullable=False),
        sa.Column("refreshToken", sa.Text(), nullable=False),
    )
    op.create_table(
        "chat",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("chat_title", sa.Text()),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id")),
    )
    op.create_table(
        "message",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("chat_id", sa.Integer(), sa.ForeignKey("chat.id")),
        sa.Column("message_content", sa.Text(), nullable=False),
        sa.Column("sent_by", sender),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_table(
        "knowledge",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("knowledge_type", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id")),
        sa.Column("text_content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_table(
        "embeddings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("message_id", sa.Integer(), sa.ForeignKey("message.id")),
        sa.Column("knowledge_id", sa.Integer(), sa.ForeignKey("knowledge.id")),
        sa.Column("kind", embedding_kind, nullable=False),
        sa.Column("embedded_text", sa.Text(), nullable=False),
        sa.Column("seq", sa.Integer()),
        sa.Column("vector", Vector(1536), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("embeddings")
    op.drop_table("knowledge")
    op.drop_table("message")
    op.drop_table("chat")
    op.drop_table("user")
    embedding_kind.drop(op.get_bind(), checkfirst=True)
    sender.drop(op.get_bind(), checkfirst=True)

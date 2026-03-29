"""asset metadata foundation

Revision ID: 0003_asset_metadata_foundation
Revises: 0002_spatial_model_foundation
Create Date: 2026-03-29 00:00:02.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0003_asset_metadata_foundation"
down_revision = "0002_spatial_model_foundation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "asset_metadata",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("asset_key", sa.String(length=128), nullable=False),
        sa.Column("asset_type", sa.String(length=64), nullable=False),
        sa.Column("source_url", sa.String(length=512), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_asset_metadata_asset_key"), "asset_metadata", ["asset_key"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_asset_metadata_asset_key"), table_name="asset_metadata")
    op.drop_table("asset_metadata")

"""spatial model foundation

Revision ID: 0002_spatial_model_foundation
Revises: 0001_initial_noop
Create Date: 2026-03-29 00:00:01.000000
"""

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry


# revision identifiers, used by Alembic.
revision = "0002_spatial_model_foundation"
down_revision = "0001_initial_noop"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "spatial_features",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("location", Geometry("POINT", srid=4326), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("spatial_features")


"""gaia catalog proof foundation

Revision ID: 0004_gaia_catalog_proof
Revises: 0003_asset_metadata_foundation
Create Date: 2026-05-05 00:00:03.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0004_gaia_catalog_proof"
down_revision = "0003_asset_metadata_foundation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "catalog_sources",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_key", sa.String(length=128), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("source_family", sa.String(length=64), nullable=False),
        sa.Column("version", sa.String(length=128), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("license_note", sa.Text(), nullable=True),
        sa.Column("imported_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_catalog_sources_source_key"), "catalog_sources", ["source_key"], unique=True)

    op.create_table(
        "data_health_checks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("check_key", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("checked_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_data_health_checks_check_key"), "data_health_checks", ["check_key"], unique=False)

    op.create_table(
        "import_jobs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("job_key", sa.String(length=255), nullable=False),
        sa.Column("source_key", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("rows_seen", sa.Integer(), server_default="0", nullable=False),
        sa.Column("rows_imported", sa.Integer(), server_default="0", nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_import_jobs_source_key"), "import_jobs", ["source_key"], unique=False)

    op.create_table(
        "gaia_dr2_sources",
        sa.Column("source_id", sa.BigInteger(), nullable=False),
        sa.Column("ra", sa.Float(), nullable=False),
        sa.Column("dec", sa.Float(), nullable=False),
        sa.Column("phot_g_mean_mag", sa.Float(), nullable=True),
        sa.Column("bp_rp", sa.Float(), nullable=True),
        sa.Column("parallax", sa.Float(), nullable=True),
        sa.Column("pmra", sa.Float(), nullable=True),
        sa.Column("pmdec", sa.Float(), nullable=True),
        sa.Column("catalog_source_id", sa.Integer(), nullable=True),
        sa.Column("imported_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["catalog_source_id"], ["catalog_sources.id"]),
        sa.PrimaryKeyConstraint("source_id"),
    )
    op.create_index(op.f("ix_gaia_dr2_sources_catalog_source_id"), "gaia_dr2_sources", ["catalog_source_id"], unique=False)
    op.create_index("ix_gaia_dr2_sources_ra_dec", "gaia_dr2_sources", ["ra", "dec"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_gaia_dr2_sources_ra_dec", table_name="gaia_dr2_sources")
    op.drop_index(op.f("ix_gaia_dr2_sources_catalog_source_id"), table_name="gaia_dr2_sources")
    op.drop_table("gaia_dr2_sources")
    op.drop_index(op.f("ix_import_jobs_source_key"), table_name="import_jobs")
    op.drop_table("import_jobs")
    op.drop_index(op.f("ix_data_health_checks_check_key"), table_name="data_health_checks")
    op.drop_table("data_health_checks")
    op.drop_index(op.f("ix_catalog_sources_source_key"), table_name="catalog_sources")
    op.drop_table("catalog_sources")
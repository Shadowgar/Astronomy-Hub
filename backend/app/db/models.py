"""Minimal declarative + spatial + asset model foundation."""

from datetime import datetime, timezone

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import UserDefinedType

try:
    from geoalchemy2 import Geometry
except Exception:  # pragma: no cover - import-safe fallback for current env
    class Geometry(UserDefinedType):  # type: ignore[no-redef]
        """Fallback Geometry type before GeoAlchemy2 is available."""

        def __init__(self, geometry_type: str = "GEOMETRY", srid: int = 4326):
            self.geometry_type = geometry_type
            self.srid = srid

        def get_col_spec(self, **kw):
            return self.geometry_type


class Base(DeclarativeBase):
    """Canonical SQLAlchemy declarative base."""

    pass


class SpatialFeature(Base):
    """Minimal canonical spatial-capable model foundation."""

    __tablename__ = "spatial_features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False, default="feature")
    location: Mapped[object] = mapped_column(Geometry("POINT", srid=4326), nullable=False)


class AssetMetadata(Base):
    """Minimal canonical asset metadata model foundation."""

    __tablename__ = "asset_metadata"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_key: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    asset_type: Mapped[str] = mapped_column(String(64), nullable=False, default="unknown")
    source_url: Mapped[str | None] = mapped_column(String(512), nullable=True)


class CatalogSource(Base):
    """Catalog provenance metadata for ORAS-owned import proofs."""

    __tablename__ = "catalog_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_key: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_family: Mapped[str] = mapped_column(String(64), nullable=False)
    version: Mapped[str | None] = mapped_column(String(128), nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    license_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    imported_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class GaiaDr2Source(Base):
    """Minimal Gaia DR2 metadata used for search and proof lookups."""

    __tablename__ = "gaia_dr2_sources"
    __table_args__ = (Index("ix_gaia_dr2_sources_ra_dec", "ra", "dec"),)

    source_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    ra: Mapped[float] = mapped_column(Float, nullable=False)
    dec: Mapped[float] = mapped_column(Float, nullable=False)
    phot_g_mean_mag: Mapped[float | None] = mapped_column(Float, nullable=True)
    bp_rp: Mapped[float | None] = mapped_column(Float, nullable=True)
    parallax: Mapped[float | None] = mapped_column(Float, nullable=True)
    pmra: Mapped[float | None] = mapped_column(Float, nullable=True)
    pmdec: Mapped[float | None] = mapped_column(Float, nullable=True)
    catalog_source_id: Mapped[int | None] = mapped_column(
        ForeignKey("catalog_sources.id"), nullable=True, index=True
    )
    imported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class ImportJob(Base):
    """Operational record for bounded import runs."""

    __tablename__ = "import_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_key: Mapped[str] = mapped_column(String(255), nullable=False)
    source_key: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    rows_seen: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    rows_imported: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DataHealthCheck(Base):
    """Minimal data-health record for catalog proof readiness."""

    __tablename__ = "data_health_checks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    check_key: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

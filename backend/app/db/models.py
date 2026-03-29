"""Minimal declarative + spatial model foundation for BE7.2."""

try:
    from sqlalchemy import Integer, String
    from geoalchemy2 import Geometry
    from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

    class Base(DeclarativeBase):
        """Canonical SQLAlchemy declarative base."""

        pass

    class SpatialFeature(Base):
        """Minimal canonical spatial-capable model foundation."""

        __tablename__ = "spatial_features"

        id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
        name: Mapped[str] = mapped_column(String(128), nullable=False, default="feature")
        location: Mapped[object] = mapped_column(Geometry("POINT", srid=4326), nullable=False)
except Exception:  # pragma: no cover - import-safe fallback for current env
    class Geometry:  # type: ignore[no-redef]
        """Fallback Geometry symbol before GeoAlchemy2 is available."""

        pass

    class Base:  # type: ignore[no-redef]
        """Fallback base to keep module import-safe before DB deps are wired."""

        pass

    class SpatialFeature(Base):  # type: ignore[no-redef]
        """Fallback spatial model symbol to keep module import-safe."""

        pass

"""Minimal declarative model foundation for BE6.2."""

try:
    from sqlalchemy.orm import DeclarativeBase
    from geoalchemy2 import Geometry

    class Base(DeclarativeBase):
        """Canonical SQLAlchemy declarative base."""

        pass
except Exception:  # pragma: no cover - import-safe fallback for current env
    class Geometry:  # type: ignore[no-redef]
        """Fallback Geometry symbol before GeoAlchemy2 is available."""

        pass

    class Base:  # type: ignore[no-redef]
        """Fallback base to keep module import-safe before DB deps are wired."""

        pass

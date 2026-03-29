"""Minimal declarative + spatial model foundation for BE7.2."""

from sqlalchemy import Integer, String
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

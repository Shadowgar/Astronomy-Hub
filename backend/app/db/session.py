from contextlib import contextmanager

from . import create_engine_from_url


def get_engine(database_url: str | None = None):
    """Return the canonical SQLAlchemy engine for DB sessions."""
    return create_engine_from_url(database_url)


def get_session_factory(database_url: str | None = None):
    """Return a SQLAlchemy sessionmaker bound to the engine."""
    from sqlalchemy.orm import sessionmaker

    engine = get_engine(database_url)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def build_nearby_spatial_features_query(
    longitude: float, latitude: float, radius_meters: float
):
    """Build a minimal location-based query shape for spatial foundation checks."""
    from sqlalchemy import func, select

    from .models import SpatialFeature

    point = func.ST_SetSRID(func.ST_MakePoint(longitude, latitude), 4326)
    return select(SpatialFeature).where(func.ST_DWithin(SpatialFeature.location, point, radius_meters))


@contextmanager
def session_scope(database_url: str | None = None):
    """Provide a transactional scope around a series of operations."""
    session_factory = get_session_factory(database_url)
    session = session_factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

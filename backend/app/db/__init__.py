DEFAULT_DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/astronomy_hub"
POSTGIS_EXTENSION_NAME = "postgis"


def create_engine_from_url(database_url: str):
    """Create a SQLAlchemy engine from a database URL."""
    from sqlalchemy import create_engine

    return create_engine(database_url, future=True, pool_pre_ping=True)


def get_postgis_extension_sql() -> str:
    """Return the canonical SQL used to enable PostGIS."""
    return f"CREATE EXTENSION IF NOT EXISTS {POSTGIS_EXTENSION_NAME}"

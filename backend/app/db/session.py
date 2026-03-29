from contextlib import contextmanager

from . import DEFAULT_DATABASE_URL, create_engine_from_url


def get_engine(database_url: str = DEFAULT_DATABASE_URL):
    """Return the canonical SQLAlchemy engine for DB sessions."""
    return create_engine_from_url(database_url)


def get_session_factory(database_url: str = DEFAULT_DATABASE_URL):
    """Return a SQLAlchemy sessionmaker bound to the engine."""
    from sqlalchemy.orm import sessionmaker

    engine = get_engine(database_url)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


@contextmanager
def session_scope(database_url: str = DEFAULT_DATABASE_URL):
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

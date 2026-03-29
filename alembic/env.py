import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

config = context.config
override_url = os.getenv("ALEMBIC_DATABASE_URL")
if override_url:
    config.set_main_option("sqlalchemy.url", override_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from backend.app.db.models import Base  # noqa: E402

try:  # noqa: F401
    import geoalchemy2  # ensure spatial types are available during migration autogenerate
except Exception:
    geoalchemy2 = None  # type: ignore[assignment]

target_metadata = Base.metadata if hasattr(Base, "metadata") else None


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

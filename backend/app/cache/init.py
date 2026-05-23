import os


DEFAULT_REDIS_URL = "redis://localhost:6379/0"


def get_redis_url() -> str:
    """Return canonical Redis URL from environment or default."""
    return os.getenv("REDIS_URL", DEFAULT_REDIS_URL)


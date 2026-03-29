from .init import get_redis_url

_redis_client = None


def get_redis_client():
    """Return a lazily-created Redis client using canonical Redis URL."""
    global _redis_client
    if _redis_client is None:
        import redis

        _redis_client = redis.Redis.from_url(get_redis_url(), decode_responses=True)
    return _redis_client


def ping_redis() -> bool:
    """Return True when Redis responds to ping; False otherwise."""
    try:
        return bool(get_redis_client().ping())
    except Exception:
        return False


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


def cache_set(key: str, value: str, ttl_seconds: int | None = None) -> bool:
    """Set cache value with optional TTL (seconds)."""
    try:
        client = get_redis_client()
        if ttl_seconds is None:
            return bool(client.set(key, value))
        return bool(client.set(key, value, ex=ttl_seconds))
    except Exception:
        return False


def cache_get(key: str) -> str | None:
    """Get cache value by key; return None on miss/error."""
    try:
        value = get_redis_client().get(key)
        if value is None:
            return None
        return str(value)
    except Exception:
        return None

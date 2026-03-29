from backend.app.cache import redis_cache


class _FakeRedis:
    def __init__(self):
        self.data = {}
        self.set_calls = []

    def set(self, key, value, ex=None):
        self.data[key] = value
        self.set_calls.append((key, value, ex))
        return True

    def get(self, key):
        return self.data.get(key)


def test_cache_set_and_get_without_ttl(monkeypatch):
    fake = _FakeRedis()
    monkeypatch.setattr(redis_cache, "_redis_client", fake)

    ok = redis_cache.cache_set("k1", "v1")
    got = redis_cache.cache_get("k1")

    assert ok is True
    assert got == "v1"
    assert fake.set_calls[-1] == ("k1", "v1", None)


def test_cache_set_with_ttl_passes_ex(monkeypatch):
    fake = _FakeRedis()
    monkeypatch.setattr(redis_cache, "_redis_client", fake)

    ok = redis_cache.cache_set("k2", "v2", ttl_seconds=30)
    got = redis_cache.cache_get("k2")

    assert ok is True
    assert got == "v2"
    assert fake.set_calls[-1] == ("k2", "v2", 30)


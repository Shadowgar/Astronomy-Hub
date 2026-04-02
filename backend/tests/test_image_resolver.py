import json

from backend.services import imageResolver


class _FakeResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def read(self) -> bytes:
        return json.dumps(self._payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


def test_get_object_image_prefers_relevant_nasa_item(monkeypatch):
    imageResolver._cache.clear()
    payload = {
        "collection": {
            "items": [
                {
                    "data": [{"title": "Solar dynamics image"}],
                    "links": [{"href": "https://example.test/sun.jpg"}],
                },
                {
                    "data": [{"title": "Jupiter infrared portrait"}],
                    "links": [{"href": "https://example.test/jupiter.jpg"}],
                },
            ]
        }
    }

    monkeypatch.setattr(
        imageResolver.urllib.request,
        "urlopen",
        lambda url, timeout=4: _FakeResponse(payload),
    )

    result = imageResolver.get_object_image("Jupiter")
    assert result == {"image_url": "https://example.test/jupiter.jpg", "source": "nasa"}


def test_get_object_image_returns_none_when_no_relevant_item(monkeypatch):
    imageResolver._cache.clear()
    payload = {
        "collection": {
            "items": [
                {
                    "data": [{"title": "Solar dynamics image"}],
                    "links": [{"href": "https://example.test/sun.jpg"}],
                },
                {
                    "data": [{"title": "Lunar crater catalog"}],
                    "links": [{"href": "https://example.test/moon.jpg"}],
                },
            ]
        }
    }

    monkeypatch.setattr(
        imageResolver.urllib.request,
        "urlopen",
        lambda url, timeout=4: _FakeResponse(payload),
    )

    result = imageResolver.get_object_image("Neptune")
    assert result is None

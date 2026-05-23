from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services import news_service


client = TestClient(app)


def _request_json(path: str):
    resp = client.get(path, headers={"User-Agent": "pytest"})
    return resp.status_code, resp.json()


def test_news_endpoint_returns_normalized_items(monkeypatch):
    monkeypatch.setattr(
        news_service,
        "_fetch_spaceflight_news",
        lambda limit: [
            {
                "id": 101,
                "title": "Falcon 9 launches science satellite",
                "summary": "Mission update with payload deployment.",
                "url": "https://example.test/news/101",
                "published_at": "2026-04-03T01:10:00Z",
                "news_site": "Spaceflight Now",
            },
            {
                "id": 102,
                "title": "Solar flare watch issued",
                "summary": "Elevated active region observed.",
                "url": "https://example.test/news/102",
                "published_at": "2026-04-03T00:10:00Z",
                "news_site": "NOAA",
            },
        ],
    )

    status, payload = _request_json("/api/v1/news?scope=above_me&engine=above_me&lat=40.0&lon=-75.0")
    assert status == 200
    assert isinstance(payload, list) and payload

    item = payload[0]
    assert isinstance(item.get("id"), str) and item["id"].startswith("news:")
    assert isinstance(item.get("title"), str) and item["title"]
    assert isinstance(item.get("summary"), str)
    assert isinstance(item.get("url"), str) and item["url"].startswith("http")
    assert isinstance(item.get("related_engines"), list)
    assert isinstance(item.get("relevance"), dict)
    assert isinstance(item.get("trace"), dict)
    assert item["trace"].get("provider") == "spaceflight_news_api"


def test_news_endpoint_is_deterministic_for_identical_inputs(monkeypatch):
    monkeypatch.setattr(
        news_service,
        "_fetch_spaceflight_news",
        lambda limit: [
            {
                "id": 201,
                "title": "Jupiter image released",
                "summary": "New planetary image from mission team.",
                "url": "https://example.test/news/201",
                "published_at": "2026-04-02T23:00:00Z",
                "news_site": "NASA",
            }
        ],
    )

    path = "/api/v1/news?scope=solar_system&engine=planets&lat=40.0&lon=-75.0&limit=3"
    status_a, payload_a = _request_json(path)
    status_b, payload_b = _request_json(path)
    assert status_a == 200 and status_b == 200
    assert payload_a == payload_b


def test_news_relevance_changes_with_context(monkeypatch):
    monkeypatch.setattr(
        news_service,
        "_fetch_spaceflight_news",
        lambda limit: [
            {
                "id": 301,
                "title": "Starlink launch expands satellite network",
                "summary": "New deployment in low Earth orbit.",
                "url": "https://example.test/news/301",
                "published_at": "2026-04-03T01:00:00Z",
                "news_site": "SpaceNews",
            }
        ],
    )

    status_sat, payload_sat = _request_json("/api/v1/news?scope=satellites&engine=satellites")
    status_deep, payload_deep = _request_json("/api/v1/news?scope=deep_sky&engine=deep_sky")
    assert status_sat == 200 and status_deep == 200
    assert payload_sat and payload_deep
    assert payload_sat[0].get("why_it_matters") != payload_deep[0].get("why_it_matters")

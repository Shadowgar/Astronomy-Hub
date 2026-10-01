from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_invalid_date_and_api_shape(monkeypatch):
    assert client.get("/api/tonight?date=2026-02-30").status_code == 400
    assert client.get("/api/tonight?date=bad").status_code == 400
    # No kernel fallback: this endpoint still returns honest degraded night/forecast contracts.
    response = client.get("/api/tonight?date=2200-01-01")
    assert response.status_code == 200
    payload = response.json()
    assert payload["meta"]["contract_version"] == "tonight.v1"
    assert payload["data"]["night"]["status"] == "ephemeris_unavailable"
    assert payload["data"]["targets"] == []

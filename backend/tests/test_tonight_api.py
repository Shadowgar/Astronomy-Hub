import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.routes import tonight as tonight_route

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


@pytest.mark.parametrize(
    "internal_message",
    [
        "cannot read /srv/private/catalog.json: secret-token=fixture-secret",
        "invalid record\nSQL: SELECT private_field FROM internal_table",
    ],
)
def test_tonight_value_error_does_not_expose_internal_details(monkeypatch, internal_message):
    def fail_build(*, date):
        raise ValueError(internal_message)

    monkeypatch.setattr(tonight_route, "build_tonight_payload", fail_build)
    response = client.get("/api/tonight?date=2026-10-01")
    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "invalid_request"
    assert error["request_id"]
    assert error["message"]
    assert internal_message not in error["message"]
    assert "fixture-secret" not in response.text
    assert "private_field" not in response.text


@pytest.mark.parametrize("date", ["bad", "2026-02-30", "9999-12-31"])
def test_tonight_invalid_date_returns_controlled_guidance(date):
    response = client.get("/api/tonight", params={"date": date})
    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "invalid_request"
    assert error["request_id"]
    assert "YYYY-MM-DD" in error["message"]

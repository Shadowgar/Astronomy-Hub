from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_conditions_minimal_contract():
    resp = client.get("/api/v1/conditions")
    assert resp.status_code == 200
    body = resp.json()
    # Minimal stable contract checks
    assert "status" in body
    assert "data" in body

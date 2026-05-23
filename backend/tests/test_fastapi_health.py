from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_root_ok():
    resp = client.get("/")
    assert resp.status_code == 200
    body = resp.json()
    # minimal stable assertions
    assert body.get("status") == "ok"
    assert body.get("service") == "astronomy-hub-backend"


def test_health_ok():
    resp = client.get("api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body.get("status") == "healthy"

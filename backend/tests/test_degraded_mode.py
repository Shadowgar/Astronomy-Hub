import os

from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_conditions_module_failure_returns_error_contract(monkeypatch):
    monkeypatch.setenv("SIMULATE_NORMALIZER_FAIL", "conditions")

    resp = client.get("/api/v1/conditions", headers={"User-Agent": "pytest"})

    assert resp.status_code == 500, f"expected status 500, got {resp.status_code} body={resp.text}"

    data = resp.json()
    assert isinstance(data, dict), f"expected JSON dict body, got: {resp.text}"

    err = data.get("error")
    err_code = err.get("code") if isinstance(err, dict) else err

    assert data.get("module") == "conditions" or err_code == "module_error"
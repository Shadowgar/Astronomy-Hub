from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.conditions import ConditionsResponse


client = TestClient(app)


def test_conditions_response_parses():
    resp = client.get("/api/conditions")
    assert resp.status_code == 200
    body = resp.json()
    # minimal parse: ensure the canonical conditions response model accepts it
    parsed = ConditionsResponse.parse_obj(body)
    assert parsed.status  # simple truthy check

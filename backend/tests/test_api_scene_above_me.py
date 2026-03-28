from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.contracts.phase1 import SceneContract


client = TestClient(app)


def test_get_above_me_scene_contract():
    resp = client.get("/api/v1/scene/above-me")
    assert resp.status_code == 200
    payload = resp.json()

    # Validate against SceneContract model
    scene = SceneContract.parse_obj(payload)

    assert scene.scope == "above_me"
    assert len(scene.objects) >= 1

    # Ensure only allowed Phase 1 types appear
    for obj in scene.objects:
        assert obj.type in ("satellite", "planet", "deep_sky")

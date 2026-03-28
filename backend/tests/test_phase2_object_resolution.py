import os
import sys
from urllib.parse import quote
from fastapi.testclient import TestClient

from backend.app.main import app

root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
backend_dir = os.path.join(root, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import server

client = TestClient(app)

REQUIRED_ENGINE_SCENES = (
    ("sky", "above_me"),
    ("sky", "deep_sky"),
    ("solar_system", "planets"),
    ("solar_system", "moon"),
    ("earth", "satellites"),
)
DETAIL_FIELDS = ("description", "media", "related_objects")


def _request_json(path):
    resp = client.get(path, headers={"User-Agent": "pytest"})
    return resp.status_code, resp.json()


def _build_required_scene(scope_slug, engine_slug):
    filter_slug = server.PHASE2_ENGINE_REGISTRY[engine_slug]["default_filter"]
    return server._build_phase2_scene(scope_slug, engine_slug, filter_slug)


def _first_scene_object_id(scene):
    for group in scene.get("groups", []):
        for obj in group.get("objects", []):
            object_id = obj.get("id")
            if isinstance(object_id, str) and object_id.strip():
                return object_id
    raise AssertionError("scene did not include any object IDs")


def test_all_required_engine_scene_objects_have_valid_ids_without_detail_payloads():
    for scope_slug, engine_slug in REQUIRED_ENGINE_SCENES:
        scene = _build_required_scene(scope_slug, engine_slug)
        for group in scene.get("groups", []):
            for obj in group.get("objects", []):
                object_id = obj.get("id")
                assert isinstance(object_id, str)
                assert object_id.strip()
                for field in DETAIL_FIELDS:
                    assert field not in obj


def test_object_endpoint_resolves_representative_ids_from_all_required_engines():
    representative_ids = {}
    for scope_slug, engine_slug in REQUIRED_ENGINE_SCENES:
        scene = _build_required_scene(scope_slug, engine_slug)
        representative_ids[engine_slug] = _first_scene_object_id(scene)

    for engine_slug, object_id in representative_ids.items():
        status, payload = _request_json(f"/api/v1/object/{quote(object_id, safe='')}")
        assert status == 200
        assert payload.get("status") == "ok"
        data = payload.get("data") or {}
        assert data.get("id") == object_id
        assert isinstance(data.get("name"), str) and data.get("name")
        assert isinstance(data.get("type"), str) and data.get("type")
        assert isinstance(data.get("summary"), str)
        assert "description" in data
        assert "media" in data
        assert "related_objects" in data


def test_unknown_object_id_returns_404():
    status, payload = _request_json(f"/api/v1/object/{quote('not-a-real-object-id', safe='')}")

    assert status == 404
    err = payload.get("error")
    assert isinstance(err, dict)
    assert err.get("code") == "not_found"


def test_object_resolution_is_stable_across_repeated_requests():
    representative_ids = []
    for scope_slug, engine_slug in REQUIRED_ENGINE_SCENES:
        scene = _build_required_scene(scope_slug, engine_slug)
        representative_ids.append(_first_scene_object_id(scene))

    for _ in range(2):
        for object_id in representative_ids:
            status, payload = _request_json(f"/api/v1/object/{quote(object_id, safe='')}")
            assert status == 200
            assert payload.get("status") == "ok"
            assert (payload.get("data") or {}).get("id") == object_id

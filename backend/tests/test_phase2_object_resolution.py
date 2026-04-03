from urllib.parse import quote
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)

REQUIRED_ENGINE_SCENES = (
    ("above_me", "above_me"),
    ("deep_sky", "deep_sky"),
    ("solar_system", "planets"),
    ("sun", "moon"),
    ("earth", "satellites"),
)
DETAIL_FIELDS = ("description", "media", "related_objects")


def _request_json(path):
    resp = client.get(path, headers={"User-Agent": "pytest"})
    return resp.status_code, resp.json()


def _build_required_scene(scope_slug, engine_slug):
    status, payload = _request_json(
        "/api/v1/scene"
        f"?scope={scope_slug}&engine={engine_slug}&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )
    assert status == 200
    scene = {
        "groups": [
            {
                "objects": payload.get("objects") or [],
            }
        ]
    }
    return scene


def _first_scene_object_id(scene):
    for group in scene.get("groups", []):
        for obj in group.get("objects", []):
            object_id = obj.get("id")
            if isinstance(object_id, str) and object_id.strip():
                return object_id
    return None


def test_all_required_engine_scene_objects_have_valid_ids_without_detail_payloads():
    for scope_slug, engine_slug in REQUIRED_ENGINE_SCENES:
        scene = _build_required_scene(scope_slug, engine_slug)
        for group in scene.get("groups", []):
            for obj in group.get("objects", []):
                object_id = obj.get("id")
                assert isinstance(object_id, str)
                assert object_id.strip()
                assert isinstance(obj.get("provider_source"), str)
                assert obj.get("provider_source")
                for field in DETAIL_FIELDS:
                    assert field not in obj


def test_object_endpoint_resolves_representative_ids_from_all_required_engines():
    representative_ids = {}
    for scope_slug, engine_slug in REQUIRED_ENGINE_SCENES:
        scene = _build_required_scene(scope_slug, engine_slug)
        object_id = _first_scene_object_id(scene)
        if object_id:
            representative_ids[engine_slug] = object_id

    assert representative_ids

    for engine_slug, object_id in representative_ids.items():
        status, payload = _request_json(
            f"/api/v1/object/{quote(object_id, safe='')}?lat=40.0&lon=-75.0"
        )
        assert status == 200
        assert payload.get("status") == "ok"
        data = payload.get("data") or {}
        assert data.get("id") == object_id
        assert isinstance(data.get("name"), str) and data.get("name")
        assert isinstance(data.get("type"), str) and data.get("type")
        assert isinstance(data.get("provider_source"), str) and data.get("provider_source")
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
        object_id = _first_scene_object_id(scene)
        if object_id:
            representative_ids.append(object_id)

    assert representative_ids

    for _ in range(2):
        for object_id in representative_ids:
            status, payload = _request_json(
                f"/api/v1/object/{quote(object_id, safe='')}?lat=40.0&lon=-75.0"
            )
            assert status == 200
            assert payload.get("status") == "ok"
            assert (payload.get("data") or {}).get("id") == object_id


def test_moon_object_detail_includes_solar_activity_fields_via_api():
    status, payload = _request_json(
        "/api/v1/scene"
        "?scope=sun&engine=moon&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )
    assert status == 200
    scene_objects = payload.get("objects") or []
    moon = next((obj for obj in scene_objects if str(obj.get("id") or "") == "moon"), None)
    assert isinstance(moon, dict)

    status, payload = _request_json("/api/v1/object/moon?lat=40.0&lon=-75.0")
    assert status == 200
    assert payload.get("status") == "ok"

    data = payload.get("data") or {}
    assert data.get("id") == "moon"
    related = data.get("related_objects") or []
    rows = {str(row.get("title") or ""): str(row.get("summary") or "") for row in related}

    assert "Solar activity status" in rows
    assert rows["Solar activity status"] in {"quiet", "elevated", "active"}
    assert "Solar activity summary" in rows
    assert rows["Solar activity summary"].strip()


def test_deep_sky_object_detail_includes_catalog_fields_and_location_consistency():
    status, payload = _request_json(
        "/api/v1/scene"
        "?scope=deep_sky&engine=deep_sky&filter=visible_now"
        "&lat=41.3219&lon=-79.5854&at=2026-04-02T02:00:00Z"
    )
    assert status == 200
    scene_objects = payload.get("objects") or []
    deep_sky_id = next(
        (str(obj.get("id") or "").strip() for obj in scene_objects if str(obj.get("id") or "").strip()),
        "",
    )
    assert deep_sky_id

    status_a, payload_a = _request_json(
        f"/api/v1/object/{quote(deep_sky_id, safe='')}?lat=40.0&lon=-75.0"
    )
    status_b, payload_b = _request_json(
        f"/api/v1/object/{quote(deep_sky_id, safe='')}?lat=41.3219&lon=-79.5854"
    )
    assert status_a == 200
    assert status_b == 200
    assert payload_a.get("status") == "ok"
    assert payload_b.get("status") == "ok"

    data_a = payload_a.get("data") or {}
    data_b = payload_b.get("data") or {}
    assert data_a.get("id") == deep_sky_id
    assert data_b.get("id") == deep_sky_id

    rows_a = {
        str(row.get("title") or ""): str(row.get("summary") or "")
        for row in (data_a.get("related_objects") or [])
        if isinstance(row, dict)
    }
    rows_b = {
        str(row.get("title") or ""): str(row.get("summary") or "")
        for row in (data_b.get("related_objects") or [])
        if isinstance(row, dict)
    }

    for title in ("Catalog", "Catalog reference", "Object class", "Constellation", "Magnitude"):
        assert rows_a.get(title)
        assert rows_b.get(title)
        assert rows_a.get(title) == rows_b.get(title)


def test_planet_object_detail_changes_when_at_changes():
    status, payload = _request_json(
        "/api/v1/scene"
        "?scope=solar_system&engine=planets&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )
    assert status == 200
    scene_objects = payload.get("objects") or []
    planet_id = next(
        (
            str(obj.get("id") or "").strip()
            for obj in scene_objects
            if str(obj.get("type") or "").strip().lower() == "planet"
            and str(obj.get("id") or "").strip()
        ),
        "",
    )
    assert planet_id

    status_a, payload_a = _request_json(
        f"/api/v1/object/{quote(planet_id, safe='')}?lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )
    status_b, payload_b = _request_json(
        f"/api/v1/object/{quote(planet_id, safe='')}?lat=40.0&lon=-75.0&at=2026-03-31T13:00:00Z"
    )
    assert status_a == 200
    assert status_b == 200
    assert payload_a.get("status") == "ok"
    assert payload_b.get("status") == "ok"

    rows_a = {
        str(row.get("title") or ""): str(row.get("summary") or "")
        for row in ((payload_a.get("data") or {}).get("related_objects") or [])
        if isinstance(row, dict)
    }
    rows_b = {
        str(row.get("title") or ""): str(row.get("summary") or "")
        for row in ((payload_b.get("data") or {}).get("related_objects") or [])
        if isinstance(row, dict)
    }
    assert rows_a.get("Best viewing time")
    assert rows_b.get("Best viewing time")
    assert rows_a.get("Best viewing time") != rows_b.get("Best viewing time")


def test_planet_object_detail_identical_for_identical_inputs_with_at():
    status, payload = _request_json(
        "/api/v1/scene"
        "?scope=solar_system&engine=planets&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )
    assert status == 200
    scene_objects = payload.get("objects") or []
    planet_id = next(
        (
            str(obj.get("id") or "").strip()
            for obj in scene_objects
            if str(obj.get("type") or "").strip().lower() == "planet"
            and str(obj.get("id") or "").strip()
        ),
        "",
    )
    assert planet_id

    path = f"/api/v1/object/{quote(planet_id, safe='')}?lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    status_a, payload_a = _request_json(path)
    status_b, payload_b = _request_json(path)
    assert status_a == 200
    assert status_b == 200
    assert payload_a == payload_b


def test_deep_sky_object_detail_changes_when_at_changes():
    status, payload = _request_json(
        "/api/v1/scene"
        "?scope=deep_sky&engine=deep_sky&filter=visible_now"
        "&lat=41.3219&lon=-79.5854&at=2026-04-02T02:00:00Z"
    )
    assert status == 200
    scene_objects = payload.get("objects") or []
    deep_sky_id = next(
        (str(obj.get("id") or "").strip() for obj in scene_objects if str(obj.get("id") or "").strip()),
        "",
    )
    assert deep_sky_id

    status_a, payload_a = _request_json(
        f"/api/v1/object/{quote(deep_sky_id, safe='')}?lat=41.3219&lon=-79.5854&at=2026-04-02T02:00:00Z"
    )
    status_b, payload_b = _request_json(
        f"/api/v1/object/{quote(deep_sky_id, safe='')}?lat=41.3219&lon=-79.5854&at=2026-04-02T06:00:00Z"
    )
    assert status_a == 200
    assert status_b == 200

    rows_a = {
        str(row.get("title") or ""): str(row.get("summary") or "")
        for row in ((payload_a.get("data") or {}).get("related_objects") or [])
        if isinstance(row, dict)
    }
    rows_b = {
        str(row.get("title") or ""): str(row.get("summary") or "")
        for row in ((payload_b.get("data") or {}).get("related_objects") or [])
        if isinstance(row, dict)
    }

    assert rows_a.get("Azimuth")
    assert rows_b.get("Azimuth")
    assert rows_a.get("Azimuth") != rows_b.get("Azimuth")
    assert rows_a.get("Best viewing time")
    assert rows_b.get("Best viewing time")
    assert rows_a.get("Best viewing time") != rows_b.get("Best viewing time")

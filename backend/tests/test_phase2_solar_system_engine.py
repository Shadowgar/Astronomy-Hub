from datetime import datetime, timezone

from backend.app.services import live_providers
from backend.app.services._legacy_scene_logic import (
    _build_solar_system_engine_slice,
    build_phase1_object_detail,
)


def test_jpl_ephemeris_fetches_expected_body_set(monkeypatch):
    monkeypatch.setattr(live_providers, "_cache_get", lambda key: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda key, payload, ttl_seconds: None)

    seen_commands: list[str] = []

    def _http_get_json(url, *, params=None, timeout_s=5.0):
        command = str((params or {}).get("COMMAND") or "").strip("'")
        seen_commands.append(command)
        return {"result": "$$SOE\n2026-Mar-31 00:00 A 180.0 45.0\n$$EOE"}

    monkeypatch.setattr(live_providers, "_http_get_json", _http_get_json)

    payload = live_providers.fetch_jpl_ephemeris(40.0, -75.0, elevation_ft=100.0)

    expected_ids = {"moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"}
    returned_ids = {str(item.get("id") or "") for item in payload}
    assert expected_ids.issubset(returned_ids)
    assert set(seen_commands) == {body_id for body_id, _ in live_providers.JPL_EPHEMERIS_BODIES}


def test_solar_system_slice_filters_below_horizon_and_keeps_provider_source():
    objects = _build_solar_system_engine_slice(
        live_inputs={
            "ephemeris": [
                {"id": "mars", "name": "Mars", "azimuth": 220.0, "elevation": 35.0, "source": "jpl_ephemeris"},
                {"id": "venus", "name": "Venus", "azimuth": 95.0, "elevation": -3.0, "source": "jpl_ephemeris"},
            ]
        }
    )

    assert len(objects) == 1
    assert objects[0]["id"] == "mars"
    assert objects[0]["engine"] == "solar_system"
    assert objects[0]["provider_source"] == "jpl_ephemeris"
    visibility = objects[0].get("visibility") or {}
    assert isinstance(visibility.get("visibility_window_start"), str) and visibility.get("visibility_window_start")
    assert isinstance(visibility.get("visibility_window_end"), str) and visibility.get("visibility_window_end")
    assert "best viewing around" in (objects[0].get("summary") or "").lower()


def test_solar_system_slice_filters_non_moon_objects_below_five_degrees():
    objects = _build_solar_system_engine_slice(
        live_inputs={
            "ephemeris": [
                {"id": "mars", "name": "Mars", "azimuth": 220.0, "elevation": 3.0, "source": "jpl_ephemeris"},
                {"id": "jupiter", "name": "Jupiter", "azimuth": 140.0, "elevation": 6.0, "source": "jpl_ephemeris"},
            ]
        }
    )

    ids = {obj.get("id") for obj in objects}
    assert "jupiter" in ids
    assert "mars" not in ids


def test_solar_system_slice_relevance_includes_conditions_influence():
    payload = {
        "ephemeris": [
            {"id": "mars", "name": "Mars", "azimuth": 220.0, "elevation": 45.0, "source": "jpl_ephemeris"},
        ],
    }
    excellent = _build_solar_system_engine_slice(
        live_inputs={**payload, "conditions": {"observing_score": "excellent"}}
    )
    poor = _build_solar_system_engine_slice(
        live_inputs={**payload, "conditions": {"observing_score": "poor"}}
    )

    assert excellent and poor
    excellent_score = float(excellent[0].get("relevance_score") or 0.0)
    poor_score = float(poor[0].get("relevance_score") or 0.0)
    assert excellent_score > poor_score


def test_jpl_ephemeris_same_inputs_same_output(monkeypatch):
    monkeypatch.setattr(live_providers, "_cache_get", lambda key: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda key, payload, ttl_seconds: None)

    def _http_get_json(url, *, params=None, timeout_s=5.0):
        return {"result": "$$SOE\n2026-Mar-31 00:00 A 123.0 45.0\n$$EOE"}

    monkeypatch.setattr(live_providers, "_http_get_json", _http_get_json)
    as_of = datetime(2026, 3, 31, 12, 30, tzinfo=timezone.utc)

    first = live_providers.fetch_jpl_ephemeris(40.0, -75.0, elevation_ft=100.0, as_of=as_of)
    second = live_providers.fetch_jpl_ephemeris(40.0, -75.0, elevation_ft=100.0, as_of=as_of)

    assert first == second


def test_jpl_ephemeris_default_behavior_works_without_as_of(monkeypatch):
    monkeypatch.setattr(live_providers, "_cache_get", lambda key: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda key, payload, ttl_seconds: None)

    def _http_get_json(url, *, params=None, timeout_s=5.0):
        return {"result": "$$SOE\n2026-Mar-31 00:00 A 180.0 45.0\n$$EOE"}

    monkeypatch.setattr(live_providers, "_http_get_json", _http_get_json)

    payload = live_providers.fetch_jpl_ephemeris(40.0, -75.0, elevation_ft=100.0)

    assert payload


def test_jpl_ephemeris_uses_explicit_as_of_in_query_window(monkeypatch):
    monkeypatch.setattr(live_providers, "_cache_get", lambda key: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda key, payload, ttl_seconds: None)
    seen_start_times: list[str] = []

    def _http_get_json(url, *, params=None, timeout_s=5.0):
        seen_start_times.append(str((params or {}).get("START_TIME") or ""))
        return {"result": "$$SOE\n2026-Mar-31 00:00 A 180.0 45.0\n$$EOE"}

    monkeypatch.setattr(live_providers, "_http_get_json", _http_get_json)

    as_of = datetime(2026, 3, 31, 19, 45, tzinfo=timezone.utc)
    live_providers.fetch_jpl_ephemeris(40.0, -75.0, elevation_ft=100.0, as_of=as_of)

    assert seen_start_times
    assert all("'2026-03-31 19:00'" == value for value in seen_start_times)


def test_solar_system_slice_time_context_changes_viewing_window():
    payload = {
        "ephemeris": [
            {"id": "mars", "name": "Mars", "azimuth": 220.0, "elevation": 35.0, "source": "jpl_ephemeris"},
        ]
    }
    t1 = datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 3, 31, 13, 0, tzinfo=timezone.utc)

    objects_1 = _build_solar_system_engine_slice(time_context=t1, live_inputs=payload)
    objects_2 = _build_solar_system_engine_slice(time_context=t2, live_inputs=payload)

    start_1 = ((objects_1[0].get("visibility") or {}).get("visibility_window_start"))
    start_2 = ((objects_2[0].get("visibility") or {}).get("visibility_window_start"))
    assert start_1 != start_2


def test_solar_system_slice_marks_moon_as_moon_type():
    payload = {
        "ephemeris": [
            {"id": "moon", "name": "Moon", "azimuth": 180.0, "elevation": 40.0, "source": "jpl_ephemeris"},
            {"id": "mars", "name": "Mars", "azimuth": 220.0, "elevation": 35.0, "source": "jpl_ephemeris"},
        ]
    }

    objects = _build_solar_system_engine_slice(time_context=datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc), live_inputs=payload)
    by_id = {str(obj.get("id") or ""): obj for obj in objects}
    assert by_id["moon"]["type"] == "moon"
    assert by_id["mars"]["type"] == "planet"


def test_moon_slice_includes_solar_activity_context_from_swpc_alerts():
    payload = {
        "ephemeris": [
            {"id": "moon", "name": "Moon", "azimuth": 180.0, "elevation": 40.0, "source": "jpl_ephemeris"},
        ],
        "alerts": [
            {
                "priority": "high",
                "category": "space_weather",
                "title": "Geomagnetic Storm Watch",
                "summary": "Elevated geomagnetic activity expected (Kp 6).",
                "relevance": "high",
            }
        ],
    }

    objects = _build_solar_system_engine_slice(
        time_context=datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc),
        live_inputs=payload,
    )
    assert objects
    moon = objects[0]
    assert moon.get("id") == "moon"
    assert moon.get("solar_activity_status") == "active"
    assert isinstance(moon.get("solar_activity_summary"), str) and moon.get("solar_activity_summary")
    assert "solar activity: active" in str(moon.get("summary") or "").lower()


def test_planet_detail_exposes_structured_solar_system_metadata():
    found = {
        "id": "jupiter",
        "name": "Jupiter",
        "type": "planet",
        "engine": "solar_system",
        "provider_source": "jpl_ephemeris",
        "summary": "Live ephemeris position az 130.0 el 45.0; best viewing around 2026-03-31T21:00:00+00:00",
        "position": {"azimuth": 130.0, "elevation": 45.0},
        "visibility": {
            "is_visible": True,
            "visibility_window_start": "2026-03-31T21:00:00+00:00",
            "visibility_window_end": "2026-03-31T23:00:00+00:00",
        },
    }

    detail = build_phase1_object_detail(found, scene_objects=[found])
    rows = {row.get("title"): row.get("summary") for row in (detail.get("related_objects") or [])}
    assert rows.get("Body type") == "Planet"
    assert rows.get("Azimuth") == "130.0 deg"
    assert rows.get("Elevation") == "45.0 deg"
    assert rows.get("Visibility") == "Visible now"
    assert rows.get("Best viewing time") == "2026-03-31T21:00:00+00:00"
    assert rows.get("Ephemeris source") == "jpl_ephemeris"


def test_planet_detail_excludes_non_solar_related_objects():
    found = {
        "id": "neptune",
        "name": "Neptune",
        "type": "planet",
        "engine": "planets",
        "provider_source": "jpl_ephemeris",
        "summary": "Live ephemeris position az 280.0 el 12.0; best viewing around 2026-03-31T22:00:00+00:00",
        "position": {"azimuth": 280.0, "elevation": 12.0},
        "visibility": {
            "is_visible": True,
            "visibility_window_start": "2026-03-31T22:00:00+00:00",
            "visibility_window_end": "2026-04-01T00:00:00+00:00",
        },
    }
    scene_objects = [
        found,
        {"id": "jupiter", "name": "Jupiter", "type": "planet", "engine": "planets", "summary": "Visible"},
        {"id": "hj-1a", "name": "HJ-1A", "type": "satellite", "engine": "satellites", "summary": "Pass now"},
    ]

    detail = build_phase1_object_detail(found, scene_objects=scene_objects)
    titles = {row.get("title") for row in (detail.get("related_objects") or [])}
    assert "Jupiter" in titles
    assert "HJ-1A" not in titles


def test_moon_detail_exposes_solar_activity_rows():
    found = {
        "id": "moon",
        "name": "Moon",
        "type": "moon",
        "engine": "moon",
        "provider_source": "jpl_ephemeris",
        "summary": "Live ephemeris position az 180.0 el 45.0; best viewing around 2026-03-31T21:00:00+00:00; solar activity: elevated",
        "position": {"azimuth": 180.0, "elevation": 45.0},
        "visibility": {
            "is_visible": True,
            "visibility_window_start": "2026-03-31T21:00:00+00:00",
            "visibility_window_end": "2026-03-31T23:00:00+00:00",
        },
        "solar_activity_status": "elevated",
        "solar_activity_summary": "Elevated geomagnetic activity expected (Kp 5).",
    }

    detail = build_phase1_object_detail(found, scene_objects=[found])
    rows = {row.get("title"): row.get("summary") for row in (detail.get("related_objects") or [])}
    assert rows.get("Solar activity status") == "elevated"
    assert rows.get("Solar activity summary") == "Elevated geomagnetic activity expected (Kp 5)."


def test_planet_detail_uses_object_specific_fallback_media_when_resolver_misses(monkeypatch):
    from backend.services import imageResolver

    monkeypatch.setattr(imageResolver, "get_object_image", lambda target_name: None)

    found = {
        "id": "neptune",
        "name": "Neptune",
        "type": "planet",
        "engine": "planets",
        "provider_source": "jpl_ephemeris",
        "summary": "Live ephemeris position",
        "position": {"azimuth": 262.5, "elevation": 8.0},
        "visibility": {"is_visible": True},
    }

    detail = build_phase1_object_detail(found, scene_objects=[found])
    media = detail.get("media") or []
    assert media
    assert "Neptune_Full.jpg" in str(media[0].get("url") or "")

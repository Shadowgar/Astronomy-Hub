from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def _request_json(path):
    resp = client.get(path, headers={"User-Agent": "pytest"})
    return resp.status_code, resp.json()


def test_scope_listing_returns_all_scope_mappings_with_optional_metadata():
    status, payload = _request_json("/api/v1/scopes")

    assert status == 200
    assert isinstance(payload, dict)
    scopes = payload.get("scopes")
    assert isinstance(scopes, list)

    by_scope = {entry.get("scope"): entry for entry in scopes if isinstance(entry, dict)}
    assert set(by_scope.keys()) == {"sky", "solar_system", "earth"}
    assert by_scope["sky"].get("engines") == ["above_me", "deep_sky"]
    assert by_scope["solar_system"].get("engines") == ["planets", "moon"]
    assert by_scope["earth"].get("engines") == ["satellites", "flights"]
    assert by_scope["earth"].get("optional_engines") == ["flights"]


def test_valid_single_scope_lookup_returns_correct_engine_mapping():
    status, payload = _request_json("/api/v1/scopes?scope=sky")

    assert status == 200
    assert payload.get("scope") == "sky"
    assert payload.get("engines") == ["above_me", "deep_sky"]
    assert payload.get("optional_engines") == []


def test_invalid_scope_returns_json_400_with_stable_error_code():
    status, payload = _request_json("/api/v1/scopes?scope=invalid_scope")

    assert status == 400
    assert isinstance(payload, dict)
    err = payload.get("error")
    assert isinstance(err, dict)
    assert err.get("code") == "invalid_scope"
    details = err.get("details") or []
    assert isinstance(details, list)
    assert details and details[0].get("allowed_scopes") == ["sky", "solar_system", "earth"]


def test_engine_only_request_is_rejected_to_preserve_scope_first_pipeline():
    status, payload = _request_json("/api/v1/scopes?engine=above_me")

    assert status == 400
    err = payload.get("error")
    assert isinstance(err, dict)
    assert err.get("code") == "missing_scope"


def test_valid_engine_selection_inside_scope_returns_engine_metadata():
    status, payload = _request_json("/api/v1/scopes?scope=earth&engine=flights")

    assert status == 200
    assert payload.get("engine") == "flights"
    assert payload.get("scope") == "earth"
    assert payload.get("optional") is True


def test_invalid_engine_slug_returns_json_400_with_stable_error_code():
    status, payload = _request_json("/api/v1/scopes?scope=sky&engine=not_real")

    assert status == 400
    err = payload.get("error")
    assert isinstance(err, dict)
    assert err.get("code") == "invalid_engine"


def test_engine_outside_selected_scope_returns_json_400_with_stable_error_code():
    status, payload = _request_json("/api/v1/scopes?scope=sky&engine=moon")

    assert status == 400
    err = payload.get("error")
    assert isinstance(err, dict)
    assert err.get("code") == "engine_out_of_scope"


def test_registry_consistency_across_all_canonical_engines():
    expected = {
        "above_me": ("sky", False),
        "deep_sky": ("sky", False),
        "planets": ("solar_system", False),
        "moon": ("solar_system", False),
        "satellites": ("earth", False),
        "flights": ("earth", True),
    }

    for engine_slug, (scope_slug, is_optional) in expected.items():
        status, payload = _request_json(f"/api/v1/scopes?scope={scope_slug}&engine={engine_slug}")
        assert status == 200
        assert payload.get("engine") == engine_slug
        assert payload.get("scope") == scope_slug
        assert payload.get("optional") is is_optional


def test_valid_filter_selection_returns_engine_and_filter_metadata():
    status, payload = _request_json("/api/v1/scopes?scope=sky&engine=deep_sky&filter=naked_eye")

    assert status == 200
    assert payload.get("engine") == "deep_sky"
    assert payload.get("scope") == "sky"
    assert payload.get("filter") == "naked_eye"
    assert payload.get("default_filter") == "visible_now"
    assert payload.get("filter_source") == "requested"
    assert payload.get("allowed_filters") == ["visible_now", "bright_only", "naked_eye"]


def test_omitted_filter_returns_default_filter_metadata():
    status, payload = _request_json("/api/v1/scopes?scope=solar_system&engine=moon")

    assert status == 200
    assert payload.get("engine") == "moon"
    assert payload.get("scope") == "solar_system"
    assert payload.get("filter") == "visible_now"
    assert payload.get("default_filter") == "visible_now"
    assert payload.get("filter_source") == "default"
    assert payload.get("allowed_filters") == ["visible_now", "high_altitude"]


def test_invalid_filter_slug_returns_json_400_with_stable_error_code():
    status, payload = _request_json("/api/v1/scopes?scope=sky&engine=above_me&filter=not_real")

    assert status == 400
    err = payload.get("error")
    assert isinstance(err, dict)
    assert err.get("code") == "invalid_filter"


def test_disallowed_filter_for_engine_returns_json_400_with_stable_error_code():
    status, payload = _request_json("/api/v1/scopes?scope=solar_system&engine=moon&filter=bright_only")

    assert status == 400
    err = payload.get("error")
    assert isinstance(err, dict)
    assert err.get("code") == "invalid_filter"
    details = err.get("details") or []
    assert isinstance(details, list)
    assert details and details[0].get("allowed_filters") == ["visible_now", "high_altitude"]


def test_filter_without_engine_is_rejected_with_missing_engine_error():
    status1, payload1 = _request_json("/api/v1/scopes?filter=visible_now")
    status2, payload2 = _request_json("/api/v1/scopes?scope=sky&filter=visible_now")

    assert status1 == 400
    assert status2 == 400
    assert payload1.get("error", {}).get("code") == "missing_engine"
    assert payload2.get("error", {}).get("code") == "missing_engine"

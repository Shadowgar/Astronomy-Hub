from backend.app.services import live_providers


def test_provider_fetchers_use_provider_specific_ttls(monkeypatch):
    cache_sets: list[tuple[str, int]] = []

    monkeypatch.setattr(live_providers, "_cache_get", lambda key: None)

    def _cache_set(key, payload, ttl_seconds):
        cache_sets.append((key, int(ttl_seconds)))

    monkeypatch.setattr(live_providers, "_cache_set", _cache_set)

    def _http_get_json(url, *, params=None, timeout_s=5.0):
        if "open-meteo.com" in url:
            return {
                "current": {
                    "cloud_cover": 10,
                    "visibility": 12000,
                    "temperature_2m": 8.0,
                    "weather_code": 1,
                    "time": "2026-03-31T12:00:00Z",
                }
            }
        if "opensky-network.org" in url:
            return {
                "states": [
                    [
                        "abc123",
                        "TEST123",
                        None,
                        None,
                        None,
                        -75.0,
                        40.0,
                        1000.0,
                        False,
                        None,
                        None,
                        None,
                        None,
                        1200.0,
                    ]
                ]
            }
        if "celestrak.org" in url:
            return [{"OBJECT_NAME": "ISS", "NORAD_CAT_ID": "25544"}]
        if "horizons.api" in url:
            return {"result": "$$SOE\n2026-Mar-31 00:00 A 180.0 45.0\n$$EOE"}
        if "services.swpc.noaa.gov" in url:
            return [["time_tag", "kp_index"], ["2026-03-31 00:00", 4.0]]
        raise AssertionError(f"Unexpected URL in test: {url}")

    monkeypatch.setattr(live_providers, "_http_get_json", _http_get_json)

    live_providers.fetch_open_meteo_conditions(40.0, -75.0)
    live_providers.fetch_opensky_nearby(40.0, -75.0, radius_km=500.0, limit=2)
    live_providers.fetch_celestrak_active(limit=5)
    live_providers.fetch_jpl_ephemeris(40.0, -75.0, elevation_ft=100.0)
    live_providers.fetch_swpc_alerts(limit=1)

    ttl_by_key_prefix = {key.split(":", 1)[0]: ttl for key, ttl in cache_sets}
    assert ttl_by_key_prefix["open_meteo"] == live_providers.PROVIDER_CACHE_TTL_SECONDS["open_meteo"]
    assert ttl_by_key_prefix["opensky"] == live_providers.PROVIDER_CACHE_TTL_SECONDS["opensky"]
    assert ttl_by_key_prefix["celestrak"] == live_providers.PROVIDER_CACHE_TTL_SECONDS["celestrak"]
    assert ttl_by_key_prefix["jpl"] == live_providers.PROVIDER_CACHE_TTL_SECONDS["jpl_ephemeris"]
    assert ttl_by_key_prefix["swpc"] == live_providers.PROVIDER_CACHE_TTL_SECONDS["noaa_swpc"]


def test_celestrak_falls_back_to_satnogs_when_unavailable(monkeypatch):
    monkeypatch.setenv("SPACE_TRACK_IDENTITY", "")
    monkeypatch.setenv("SPACE_TRACK_USERNAME", "")
    monkeypatch.setenv("SPACE_TRACK_PASSWORD", "")
    monkeypatch.setattr(live_providers, "_cache_get", lambda key: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda key, payload, ttl_seconds: None)

    def _http_get_json(url, *, params=None, timeout_s=5.0):
        if "celestrak.org" in url:
            raise RuntimeError("celestrak unavailable")
        if "db.satnogs.org" in url:
            return [{"norad_cat_id": 25544, "name": "ISS", "status": "alive"}]
        raise AssertionError(f"Unexpected URL in test: {url}")

    monkeypatch.setattr(live_providers, "_http_get_json", _http_get_json)

    payload = live_providers.fetch_celestrak_active(limit=5)
    assert payload
    assert payload[0]["source"] == "satnogs"
    assert payload[0]["id"] == "25544"


def test_celestrak_falls_back_to_tle_api_when_satnogs_empty(monkeypatch):
    monkeypatch.setenv("SPACE_TRACK_IDENTITY", "")
    monkeypatch.setenv("SPACE_TRACK_USERNAME", "")
    monkeypatch.setenv("SPACE_TRACK_PASSWORD", "")
    monkeypatch.setattr(live_providers, "_cache_get", lambda key: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda key, payload, ttl_seconds: None)

    def _http_get_json(url, *, params=None, timeout_s=5.0):
        if "celestrak.org" in url:
            raise RuntimeError("celestrak unavailable")
        if "db.satnogs.org" in url:
            return []
        if "tle.ivanstanojevic.me" in url:
            return {"member": [{"satelliteId": 25544, "name": "ISS (ZARYA)"}]}
        raise AssertionError(f"Unexpected URL in test: {url}")

    monkeypatch.setattr(live_providers, "_http_get_json", _http_get_json)

    payload = live_providers.fetch_celestrak_active(limit=5)
    assert payload
    assert payload[0]["source"] == "tle_api"
    assert payload[0]["id"] == "25544"


def test_celestrak_uses_g7vrd_location_fallback(monkeypatch):
    monkeypatch.setenv("SPACE_TRACK_IDENTITY", "")
    monkeypatch.setenv("SPACE_TRACK_USERNAME", "")
    monkeypatch.setenv("SPACE_TRACK_PASSWORD", "")
    monkeypatch.setenv("N2YO_API_KEY", "")
    monkeypatch.setattr(live_providers, "_cache_get", lambda key: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda key, payload, ttl_seconds: None)

    def _http_get_json(url, *, params=None, timeout_s=5.0):
        if "celestrak.org" in url:
            raise RuntimeError("celestrak unavailable")
        if "db.satnogs.org" in url:
            return []
        if "tle.ivanstanojevic.me" in url:
            return {"member": []}
        if "api.g7vrd.co.uk" in url and "/25544/" in url:
            return {
                "satellite_name": "ISS",
                "passes": [{"start": "2026-03-31T15:42:02.578Z", "max_elevation": 24.0}],
            }
        if "api.g7vrd.co.uk" in url and "/20580/" in url:
            return {
                "satellite_name": "HST",
                "passes": [{"start": "2026-03-31T16:12:02.578Z", "max_elevation": 18.0}],
            }
        if "api.g7vrd.co.uk" in url:
            return {"satellite_name": "NONE", "passes": []}
        raise AssertionError(f"Unexpected URL in test: {url}")

    monkeypatch.setattr(live_providers, "_http_get_json", _http_get_json)

    payload = live_providers.fetch_celestrak_active(limit=5, lat=40.0, lon=-75.0)
    assert payload
    assert payload[0]["source"] == "g7vrd"
    ids = {entry["id"] for entry in payload}
    assert "25544" in ids

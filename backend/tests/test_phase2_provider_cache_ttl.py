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

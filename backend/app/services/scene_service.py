def build_above_me_scene_payload() -> dict:
    """Build the Above Me scene payload with the existing static contract."""
    objects = [
        {
            "id": "sat-123",
            "name": "TestSat 1",
            "type": "satellite",
            "engine": "satellite",
            "summary": "A test satellite visible now.",
            "position": {"azimuth": 120.5, "elevation": 45.0},
            "visibility": {"is_visible": True},
        },
        {
            "id": "mars",
            "name": "Mars",
            "type": "planet",
            "engine": "solar_system",
            "summary": "Bright planet visible in the west.",
            "position": {"azimuth": 270.0, "elevation": 15.0},
            "visibility": {"is_visible": True},
        },
        {
            "id": "m13",
            "name": "M13",
            "type": "deep_sky",
            "engine": "deep_sky",
            "summary": "Globular cluster in Hercules.",
        },
    ]

    return {
        "scope": "above_me",
        "engine": "main",
        "filter": "visible",
        "timestamp": "2026-03-26T20:00:00Z",
        "objects": objects,
    }


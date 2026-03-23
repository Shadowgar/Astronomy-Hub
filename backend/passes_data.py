"""
Static mock data for /api/passes endpoint.

Follows the pass object contract in docs/DATA_CONTRACTS.md.
Do NOT add or rename fields.
"""

MOCK_PASSES = [
    {
        "object_name": "ISS",
        "start_time": "2026-03-22T23:12:00+00:00",
        "max_elevation_deg": 61,
        "start_direction": "NW",
        "end_direction": "SE",
        "visibility": "high"
    },
    {
        "object_name": "Starlink-1234",
        "start_time": "2026-03-23T00:45:00+00:00",
        "max_elevation_deg": 32,
        "start_direction": "W",
        "end_direction": "E",
        "visibility": "medium"
    }
]

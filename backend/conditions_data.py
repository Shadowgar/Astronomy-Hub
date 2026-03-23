"""
Static mock data for /api/conditions endpoint.

This file strictly follows the "Conditions Contract" from docs/DATA_CONTRACTS.md
and contains only the fields specified there.
"""
from datetime import datetime, timezone

def iso_now():
    return datetime.now(timezone.utc).isoformat()

# Mock data matching the Conditions Contract exactly. Do NOT add or rename fields.
MOCK_CONDITIONS = {
    "location_label": "Oil City, PA",
    "cloud_cover_pct": 22,
    "moon_phase": "Waxing Crescent",
    "darkness_window": {
        "start": "2026-03-22T19:12:00+00:00",
        "end": "2026-03-23T05:04:00+00:00"
    },
    "observing_score": "good",
    "summary": "Clear skies with light clouds; good transparency.",
    "last_updated": iso_now()
}

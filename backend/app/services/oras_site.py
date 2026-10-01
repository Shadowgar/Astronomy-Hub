"""Read the shared canonical Observe site, also copied narrowly into the backend image."""

import json
from pathlib import Path

ORAS_SITE = json.loads(
    (
        Path(__file__).resolve().parents[3] / "frontend/src/config/orasSite.json"
    ).read_text()
)

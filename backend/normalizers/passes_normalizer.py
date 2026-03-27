"""Passes normalizer for Phase 1 (Satellite engine slice).

This module implements a minimal normalization strategy: filter the
incoming passes list to only include entries considered "visible" and
return a cleaned list. This is intentionally small and defensive.
"""
from typing import Any, Dict, List

try:
    from normalizers.base import NormalizationError
except Exception:
    from backend.normalizers.base import NormalizationError


def normalize(payload: Any) -> List[Dict[str, Any]]:
    if not isinstance(payload, list):
        raise NormalizationError("passes normalizer expects a list payload")

    visible_values = {'high', 'medium', 'visible'}
    out = []
    for p in payload:
        if not isinstance(p, dict):
            continue
        vis = (p.get('visibility') or '').lower()
        if vis not in visible_values:
            continue
        # Keep only known fields to avoid leaking provider data
        cleaned = {
            'object_name': p.get('object_name'),
            'start_time': p.get('start_time'),
            'max_elevation_deg': p.get('max_elevation_deg'),
            'start_direction': p.get('start_direction'),
            'end_direction': p.get('end_direction'),
            'visibility': p.get('visibility'),
        }
        out.append(cleaned)

    return out

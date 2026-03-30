"""Targets normalizer for Phase 1.

Normalize the `targets` payload into a list of `SceneObjectSummary`-shaped
dicts. Keep mapping minimal and defensive: only allow Phase 1 types and
validate each item with the authoritative contract model.
"""
from typing import Any, Dict, List

try:
    from normalizers.base import NormalizationError
except Exception:
    from backend.normalizers.base import NormalizationError

try:
    from backend.app.contracts.phase1 import SceneObjectSummary
except Exception:
    from backend.app.contracts.phase1 import SceneObjectSummary


def _slugify(name: str) -> str:
    try:
        s = str(name).strip().lower()
        return s.replace(' ', '-').replace('/', '-').replace("'", '')
    except Exception:
        return str(name)


def normalize(payload: Any) -> List[Dict[str, Any]]:
    """Normalize a list of target dicts into SceneObjectSummary dicts.

    Raises NormalizationError on unrecoverable problems.
    """
    if not isinstance(payload, list):
        raise NormalizationError("targets normalizer expects a list payload")

    out = []
    for t in payload:
        if not isinstance(t, dict):
            # skip non-dict entries
            continue
        name = t.get('name') or t.get('object_name') or 'unknown'
        category = t.get('category')
        # Only allow Phase 1 types
        if category not in ('planet', 'deep_sky', 'satellite'):
            continue

        candidate = {
            'id': _slugify(name),
            'name': name,
            'type': category,
            'engine': t.get('engine') or 'mock',
            'summary': t.get('reason') or t.get('summary') or '',
            'position': None,
            'visibility': None,
            'time_relevance': 'currently_visible',
            'reason_for_inclusion': t.get('reason') or t.get('summary') or '',
            'detail_route': f"/object/{_slugify(name)}",
        }

        try:
            validated = SceneObjectSummary.parse_obj(candidate)
            out.append(validated.dict())
        except Exception:
            # skip items that fail validation rather than failing whole payload
            continue

    return out

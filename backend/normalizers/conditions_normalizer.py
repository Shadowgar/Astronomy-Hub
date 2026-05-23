"""Conditions normalizer.

Provide a minimal `normalize(payload)` implementation that produces a
plain `dict` matching the `backend.schemas.conditions.Conditions` model.

Rules enforced here:
- Only map fields that exist in the authoritative contract.
- Validate the normalized result with the Pydantic model before
  returning a plain dict.
- Raise `NormalizationError` when required fields cannot be produced.

This module intentionally contains no runtime wiring or registration.
"""

from typing import Any, Dict

# Import compatibility: prefer local package imports when running as a
# script (where `sys.path[0]` may be `backend/` and packages are
# available as `normalizers`/`schemas`), otherwise fall back to
# package-prefixed imports.
try:
    from normalizers.base import NormalizationError
except Exception:
    from backend.normalizers.base import NormalizationError

try:
    from schemas.conditions import Conditions
except Exception:
    from backend.schemas.conditions import Conditions


def normalize(payload: Any) -> Dict[str, Any]:
    """Normalize a raw `payload` into a contract-shaped dict.

    Args:
        payload: Raw input from a provider. Expected to be a `dict`-like
            object that may already follow the contract or require
            minimal field mapping.

    Returns:
        A plain `dict` that conforms to `Conditions`.

    Raises:
        NormalizationError: If the payload cannot be transformed into the
            required contract shape.
    """

    # Expecting a mapping; keep logic intentionally small and explicit.
    if not isinstance(payload, dict):
        raise NormalizationError("Conditions normalizer expects a dict payload")

    # Only extract fields that are explicitly in the Conditions contract.
    try:
        candidate = {
            "location_label": payload["location_label"],
            "cloud_cover_pct": payload["cloud_cover_pct"],
            "moon_phase": payload["moon_phase"],
            "darkness_window": payload["darkness_window"],
            "observing_score": payload["observing_score"],
            "summary": payload["summary"],
            "last_updated": payload["last_updated"],
        }
    except KeyError as e:
        raise NormalizationError(f"missing required field for Conditions: {e}")

    # Validate with the authoritative Pydantic model.
    try:
        model = Conditions.parse_obj(candidate)
    except Exception as e:  # keep exception narrow in callers; wrap for clarity
        raise NormalizationError(f"Conditions validation failed: {e}")

    # Return a plain dict (not a Pydantic object).
    return model.dict()


def normalize_to_contract(payload: Any) -> Dict[str, Any]:
    """Backward-compatible alias used by legacy tests/callers."""
    return normalize(payload)

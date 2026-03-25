"""Tiny discovery registry for normalizers (Package 2 Step 3).

This module provides a minimal, in-memory registry for domain normalizers.
It intentionally avoids any runtime wiring or framework integration — it is
purely a discovery scaffold for later binding.
"""

from typing import Callable, Dict

# Import the conditions normalizer using a local-first import pattern so
# this module can be imported both when `backend/` is on sys.path (package
# mode) and when running scripts with CWD set to the repo root (script
# mode where `sys.path[0]` may be `backend/`).
try:
    # script execution mode: `backend/` may be the package root
    from conditions_normalizer import normalize as _conditions_normalize
    class _CondModule:
        normalize = staticmethod(_conditions_normalize)
    conditions_normalizer = _CondModule
except Exception:
    # package execution mode
    from backend.normalizers import conditions_normalizer

_REGISTRY: Dict[str, Callable] = {}


def register(domain_name: str, normalizer_callable: Callable) -> None:
    """Register a normalizer callable for `domain_name`.

    Overwrites any previous registration for the same domain.
    """

    _REGISTRY[domain_name] = normalizer_callable


def get(domain_name: str) -> Callable:
    """Return the registered normalizer callable for `domain_name`.

    Raises a KeyError if no normalizer is registered for the domain.
    """

    try:
        return _REGISTRY[domain_name]
    except KeyError:
        raise KeyError(f"no normalizer registered for domain: {domain_name}")


# Register the existing Conditions normalizer so it is discoverable.
register("conditions", conditions_normalizer.normalize)

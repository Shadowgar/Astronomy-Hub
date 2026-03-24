"""
Static mock data for /api/targets endpoint.

Follows the target object contract in docs/DATA_CONTRACTS.md.
Do NOT add or rename fields.
"""

MOCK_TARGETS = [
    {
        "name": "Jupiter",
        "category": "planet",
        "direction": "SE",
        "elevation_band": "mid",
        "best_time": "10:30 PM",
        "difficulty": "beginner",
        "reason": "Bright and clearly visible tonight"
    },
    {
        "name": "M13",
        "category": "deep_sky",
        "direction": "S",
        "elevation_band": "high",
        "best_time": "11:15 PM",
        "difficulty": "intermediate",
        "reason": "High in the sky and well-placed for long exposures"
    }
]


def get_targets(with_images: bool = True):
    """Return a list of targets, optionally enriched with `imageUrl`.

    This function keeps the original `MOCK_TARGETS` intact and returns
    shallow copies. When `with_images` is True the resolver service is
    consulted; failures are silent and simply omit `imageUrl`.
    """
    from copy import deepcopy

    targets = deepcopy(MOCK_TARGETS)
    if not with_images:
        return targets

    # Lazy import of the resolver to avoid import-time network activity.
    try:
        from backend.services.imageResolver import get_object_image
    except Exception:
        try:
            # fallback when running as a script where package imports differ
            import sys, os
            repo_root = os.path.dirname(os.path.dirname(__file__))
            if repo_root not in sys.path:
                sys.path.insert(0, repo_root)
            from backend.services.imageResolver import get_object_image
        except Exception:
            get_object_image = None

    if get_object_image is None:
        return targets

    for t in targets:
        try:
            res = get_object_image(t.get('name', ''))
            if res and isinstance(res, dict) and res.get('image_url'):
                t['imageUrl'] = res.get('image_url')
        except Exception:
            # be resilient: do not propagate resolver errors to caller
            continue

    return targets

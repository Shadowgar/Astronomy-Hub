"""Routes package for FastAPI app.

This module intentionally keeps package exports minimal; route modules
are imported by the FastAPI entrypoint to register routers.
"""

__all__ = [
    "health",
    "conditions",
    "scene",
    "scopes",
    "objects",
    "targets",
    "passes",
    "alerts",
    "location",
]

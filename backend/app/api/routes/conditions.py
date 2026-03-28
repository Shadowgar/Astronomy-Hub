"""BE2.1 shim for canonical route path.

Preserves existing behavior by re-exporting the current router.
"""

from backend.app.routes.conditions import router

__all__ = ["router"]


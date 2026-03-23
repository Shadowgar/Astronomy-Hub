"""Simple in-process cache with optional TTL.

Usage:
    from backend.cache.simple_cache import SimpleCache
    c = SimpleCache()
    c.set('k', 1, ttl=1)  # ttl seconds
    v = c.get('k')

This is intentionally minimal: an in-memory dict guarded by a Lock.
Expired entries are removed on access.
"""
from __future__ import annotations

import time
import threading
from typing import Any, Optional, Tuple


class SimpleCache:
    """A tiny thread-safe in-process cache supporting get/set with TTL.

    - `set(key, value, ttl=None)` stores a value. If `ttl` is provided (seconds),
      the entry will expire after `ttl` seconds.
    - `get(key)` returns the stored value or `None` if missing/expired.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        # map key -> (value, expires_at_or_None)
        self._store: dict[str, Tuple[Any, Optional[float]]] = {}

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        """Set `key` to `value`. If `ttl` (seconds) is given, the entry expires after that many seconds."""
        expires: Optional[float]
        if ttl is None:
            expires = None
        else:
            try:
                tl = float(ttl)
            except Exception:
                tl = 0.0
            expires = time.time() + tl if tl > 0 else time.time()

        with self._lock:
            self._store[key] = (value, expires)

    def get(self, key: str) -> Any:
        """Return the value for `key`, or `None` if missing or expired."""
        with self._lock:
            item = self._store.get(key)
            if item is None:
                return None
            value, expires = item
            if expires is not None and time.time() >= expires:
                # expired: remove and return None
                try:
                    del self._store[key]
                except KeyError:
                    pass
                return None
            return value

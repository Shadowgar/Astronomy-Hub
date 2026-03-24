"""Resolve a representative image for an astronomical target using the
NASA Images API with an in-process cache.

API:
  get_object_image(target_name: str) -> dict | None

Behavior:
  - check in-process cache first
  - if missing, query NASA Image API with a short timeout and extract the
    first https image URL from the response
  - cache results for 24h
  - return {'image_url': url, 'source': 'nasa'} or None on failure
"""
from __future__ import annotations

import json
import time
import threading
import urllib.parse
import urllib.request
from typing import Optional


# Minimal local cache instance (simple dict + lock) to avoid importing the
# backend.cache.SimpleCache here; TTL semantics implemented simply.
_cache_lock = threading.Lock()
_cache: dict[str, tuple[Optional[dict], float]] = {}
_CACHE_TTL = 24 * 3600  # 24 hours


def _cache_get(key: str) -> Optional[dict]:
    with _cache_lock:
        item = _cache.get(key)
        if not item:
            return None
        value, expires = item
        if time.time() >= expires:
            try:
                del _cache[key]
            except KeyError:
                pass
            return None
        return value


def _cache_set(key: str, value: Optional[dict], ttl: Optional[int] = None) -> None:
    if ttl is None:
        ttl = _CACHE_TTL
    with _cache_lock:
        _cache[key] = (value, time.time() + float(ttl))


def _safe_json_loads(b: bytes) -> Optional[dict]:
    try:
        return json.loads(b.decode('utf-8'))
    except Exception:
        return None


def get_object_image(target_name: str) -> Optional[dict]:
    """Return a dict with image_url and source, or None on failure.

    Deterministic: returns first valid https link from NASA API search results.
    Fast: short network timeout and in-process caching.
    """
    if not target_name:
        return None

    key = f"nasa_img:{target_name.strip().lower()}"
    cached = _cache_get(key)
    if cached is not None:
        return cached

    # Build NASA Image API search URL
    q = urllib.parse.quote_plus(target_name.strip())
    url = f"https://images-api.nasa.gov/search?q={q}&media_type=image"

    try:
        # short timeout to avoid blocking assembly
        with urllib.request.urlopen(url, timeout=4) as resp:
            body = resp.read()
    except Exception:
        _cache_set(key, None)
        return None

    data = _safe_json_loads(body)
    if not data:
        _cache_set(key, None)
        return None

    # Navigate to collection.items[*].links[*].href
    try:
        coll = data.get('collection', {})
        items = coll.get('items', []) if isinstance(coll, dict) else []
        for item in items:
            # prefer links array entries
            links = item.get('links') or []
            if not isinstance(links, list):
                continue
            for link in links:
                href = link.get('href') if isinstance(link, dict) else None
                if not href or not isinstance(href, str):
                    continue
                if href.startswith('https://') or href.startswith('http://'):
                    # deterministic: take first valid URL
                    result = {'image_url': href, 'source': 'nasa'}
                    _cache_set(key, result)
                    return result
    except Exception:
        # fall through to cache miss behavior
        pass

    # no valid image found
    _cache_set(key, None)
    return None

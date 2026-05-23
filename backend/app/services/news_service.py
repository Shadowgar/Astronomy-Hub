from __future__ import annotations

from datetime import datetime, timedelta, timezone
import threading
import time
from typing import Any

import httpx

from backend.app.services._legacy_scene_logic import parse_location_override


_CACHE_LOCK = threading.Lock()
_CACHE: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_LAST_GOOD_LOCK = threading.Lock()
_LAST_GOOD_NEWS: list[dict[str, Any]] = []

_DEFAULT_LIMIT = 5
_MAX_LIMIT = 10
_TTL_SECONDS = 900


def _cache_get(cache_key: str) -> list[dict[str, Any]] | None:
    now = time.time()
    with _CACHE_LOCK:
        item = _CACHE.get(cache_key)
        if not item:
            return None
        expires_at, payload = item
        if expires_at <= now:
            _CACHE.pop(cache_key, None)
            return None
        return payload


def _cache_set(cache_key: str, payload: list[dict[str, Any]]) -> None:
    with _CACHE_LOCK:
        _CACHE[cache_key] = (time.time() + _TTL_SECONDS, payload)


def _set_last_good(payload: list[dict[str, Any]]) -> None:
    with _LAST_GOOD_LOCK:
        _LAST_GOOD_NEWS.clear()
        _LAST_GOOD_NEWS.extend(payload)


def _get_last_good() -> list[dict[str, Any]]:
    with _LAST_GOOD_LOCK:
        return [dict(item) for item in _LAST_GOOD_NEWS]


def _fetch_spaceflight_news(limit: int) -> list[dict[str, Any]]:
    # Spaceflight News API v4: broad authoritative space-news aggregator.
    with httpx.Client(timeout=6.0, headers={"User-Agent": "astronomy-hub/news-service"}) as client:
        response = client.get(
            "https://api.spaceflightnewsapi.net/v4/articles/",
            params={"limit": max(1, min(limit * 2, 25)), "ordering": "-published_at"},
        )
        response.raise_for_status()
        payload = response.json()

    results = payload.get("results") if isinstance(payload, dict) else None
    if not isinstance(results, list):
        return []
    return [item for item in results if isinstance(item, dict)]


_ENGINE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "satellites": ("satellite", "starlink", "iss", "launch", "rocket", "payload"),
    "solar_system": ("mars", "jupiter", "saturn", "venus", "mercury", "neptune", "planet", "moon", "asteroid", "comet"),
    "sun": ("solar", "sunspot", "flare", "cme", "geomagnetic"),
    "deep_sky": ("galaxy", "nebula", "cluster", "exoplanet", "jwst", "hubble"),
    "events": ("meteor", "shower", "eclipse", "conjunction", "aurora"),
    "flights": ("aircraft", "aviation", "flight"),
}


def _extract_related_engines(title: str, summary: str) -> list[str]:
    text = f"{title} {summary}".lower()
    matched: list[str] = []
    for engine, keywords in _ENGINE_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            matched.append(engine)
    if not matched:
        matched.append("news")
    return matched[:3]


def _to_iso(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return datetime.now(timezone.utc).isoformat()
    # Preserve as provided when parse fails.
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        return parsed.astimezone(timezone.utc).isoformat()
    except Exception:
        return text


def _compute_recency_score(published_at: str) -> float:
    try:
        published = datetime.fromisoformat(published_at.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return 0.45
    age = datetime.now(timezone.utc) - published
    if age <= timedelta(hours=6):
        return 0.95
    if age <= timedelta(hours=24):
        return 0.85
    if age <= timedelta(days=3):
        return 0.7
    if age <= timedelta(days=7):
        return 0.55
    return 0.4


def _why_it_matters(scope: str | None, engine: str | None, related_engines: list[str]) -> str:
    active_engine = (engine or "").strip().lower()
    active_scope = (scope or "").strip().lower()
    if active_engine and active_engine in related_engines:
        return f"Directly relevant to active {active_engine.replace('_', ' ')} context."
    if active_scope == "above_me" and any(e in related_engines for e in ("satellites", "solar_system", "deep_sky", "events", "sun")):
        return "Relevant to objects/events that can influence your Above Me context."
    if "events" in related_engines:
        return "Time-sensitive event context for planning current observing decisions."
    return "Space-relevant update for current command-center awareness."


def _normalize_article(
    item: dict[str, Any],
    scope: str | None,
    engine: str | None,
    lat: float | None,
    lon: float | None,
) -> dict[str, Any] | None:
    title = str(item.get("title") or "").strip()
    summary = str(item.get("summary") or "").strip()
    url = str(item.get("url") or "").strip()
    if not title or not url:
        return None

    related_engines = _extract_related_engines(title, summary)
    published_at = _to_iso(item.get("published_at"))
    recency_score = _compute_recency_score(published_at)
    active_engine = (engine or "").strip().lower()
    engine_boost = 0.1 if active_engine and active_engine in related_engines else 0.0

    region_score = 0.5
    if lat is not None and lon is not None and "launch" in f"{title} {summary}".lower():
        # Mild geographic weighting baseline for launch/location-sensitive stories.
        region_score = 0.65

    above_me_score = 0.7 if any(e in related_engines for e in ("satellites", "solar_system", "deep_sky", "events", "sun")) else 0.35
    overall = max(0.0, min(1.0, recency_score + engine_boost))

    source_name = str(item.get("news_site") or "Unknown").strip() or "Unknown"
    article_id = str(item.get("id") or url).strip()
    image_url = str(item.get("image_url") or "").strip() or None

    return {
        "id": f"news:{article_id}",
        "title": title,
        "summary": summary or "Space update.",
        "source": {"name": source_name, "type": "publisher"},
        "published_at": published_at,
        "url": url,
        "image_url": image_url,
        "topics": related_engines,
        "related_engines": related_engines,
        "related_objects": [],
        "relevance": {
            "overall": round(overall, 3),
            "region_score": round(region_score, 3),
            "above_me_score": round(above_me_score, 3),
        },
        "why_it_matters": _why_it_matters(scope, engine, related_engines),
        "trace": {
            "provider": "spaceflight_news_api",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        },
    }


def get_news_payload(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
    scope: str | None = None,
    engine: str | None = None,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    parsed_location = None
    if lat is not None or lon is not None or elevation_ft is not None:
        parsed_location = parse_location_override(lat, lon, elevation_ft)

    latitude = float(parsed_location["latitude"]) if isinstance(parsed_location, dict) else None
    longitude = float(parsed_location["longitude"]) if isinstance(parsed_location, dict) else None
    resolved_limit = max(1, min(int(limit or _DEFAULT_LIMIT), _MAX_LIMIT))
    scope_key = (scope or "above_me").strip().lower() or "above_me"
    engine_key = (engine or "").strip().lower()
    location_key = (
        f"{round(latitude, 3)}:{round(longitude, 3)}"
        if latitude is not None and longitude is not None
        else "default"
    )
    cache_key = f"news:v1:{scope_key}:{engine_key}:{location_key}:{resolved_limit}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    articles = _fetch_spaceflight_news(resolved_limit)
    normalized: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for article in articles:
        normalized_item = _normalize_article(article, scope_key, engine_key, latitude, longitude)
        if not isinstance(normalized_item, dict):
            continue
        url = str(normalized_item.get("url") or "").strip().lower()
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)
        normalized.append(normalized_item)
        if len(normalized) >= resolved_limit:
            break

    normalized.sort(
        key=lambda item: (
            -float(((item.get("relevance") or {}).get("overall") or 0.0)),
            str(item.get("published_at") or ""),
            str(item.get("id") or ""),
        ),
        reverse=False,
    )
    normalized = list(reversed(normalized))[:resolved_limit]

    if normalized:
        _cache_set(cache_key, normalized)
        _set_last_good(normalized)
        return normalized

    fallback = _get_last_good()
    if fallback:
        degraded = [dict(item) for item in fallback[:resolved_limit]]
        for item in degraded:
            trace = item.get("trace")
            if isinstance(trace, dict):
                trace = dict(trace)
                trace["degraded"] = True
                item["trace"] = trace
            item["why_it_matters"] = "Live news feed unavailable; showing last known verified space updates."
        _cache_set(cache_key, degraded)
        return degraded

    return []

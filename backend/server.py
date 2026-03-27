"""
Minimal HTTP server exposing GET /api/conditions with static mock data.

Usage: python3 backend/server.py

Notes:
- No frameworks used.
- Only the exact endpoint `/api/conditions` is implemented.
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import time
import uuid
import os
from copy import deepcopy
from urllib.parse import urlparse, parse_qs

from logging_config import get_logger

from conditions_data import MOCK_CONDITIONS
from targets_data import MOCK_TARGETS
from passes_data import MOCK_PASSES
from alerts_data import MOCK_ALERTS

# Normalizer imports: prefer local-module import when running the script
# (sys.path[0] may be backend/) but fall back to package-style imports.
try:
    from normalizers import registry
    from normalizers.base import NormalizationError
except Exception:
    from backend.normalizers import registry
    from backend.normalizers.base import NormalizationError

# Response envelope import: prefer `schemas.response_envelope` when
# running as a script, otherwise use package-prefixed import.
try:
    from schemas.response_envelope import ResponseEnvelope
except Exception:
    from backend.schemas.response_envelope import ResponseEnvelope

logger = get_logger("backend.server")

# Constants
SUGGESTION_COORD_MALFORMED = 'suggestion coordinates malformed'
PHASE2_SCOPES = ("sky", "solar_system", "earth")
PHASE2_FILTERS = (
    "visible_now",
    "bright_only",
    "high_altitude",
    "short_window",
    "naked_eye",
)
PHASE2_ENGINE_REGISTRY = {
    "above_me": {
        "scope": "sky",
        "optional": False,
        "allowed_filters": ["visible_now", "high_altitude", "short_window"],
        "default_filter": "visible_now",
    },
    "deep_sky": {
        "scope": "sky",
        "optional": False,
        "allowed_filters": ["visible_now", "bright_only", "naked_eye"],
        "default_filter": "visible_now",
    },
    "planets": {
        "scope": "solar_system",
        "optional": False,
        "allowed_filters": ["visible_now", "bright_only", "high_altitude"],
        "default_filter": "visible_now",
    },
    "moon": {
        "scope": "solar_system",
        "optional": False,
        "allowed_filters": ["visible_now", "high_altitude"],
        "default_filter": "visible_now",
    },
    "satellites": {
        "scope": "earth",
        "optional": False,
        "allowed_filters": ["visible_now", "high_altitude", "short_window"],
        "default_filter": "visible_now",
    },
    "flights": {
        "scope": "earth",
        "optional": True,
        "allowed_filters": ["visible_now", "high_altitude", "short_window"],
        "default_filter": "visible_now",
    },
}

# Lazy cache reference; initialize on first use to be compatible with both
# `python3 backend/server.py` and package-based execution.
_simple_cache = None
_phase2_object_lookup_cache = {}
_PHASE2_OBJECT_LOOKUP_TTL_SECONDS = 5


def _ensure_cache():
    global _simple_cache
    if _simple_cache is not None:
        return
    try:
        from backend.cache.simple_cache import SimpleCache
    except Exception:
        # When running as a script, sys.path[0] may be the backend/ dir.
        # Prepend the repository root to sys.path so package imports resolve.
        import sys
        repo_root = os.path.dirname(os.path.dirname(__file__))
        if repo_root not in sys.path:
            sys.path.insert(0, repo_root)
        from backend.cache.simple_cache import SimpleCache

    _simple_cache = SimpleCache()


def _validate_suggestions(matches):
    """Validate suggestion coordinate values.

    Returns an error dict when a problem is found, otherwise None.
    """
    for idx, s in enumerate(matches):
        lat = s.get('latitude')
        lon = s.get('longitude')
        # If neither coordinate present, skip validation for this suggestion
        if lat is None and lon is None:
            continue
        # Both must be present if either is present
        if lat is None or lon is None:
            return {'error': SUGGESTION_COORD_MALFORMED, 'index': idx, 'suggestion': s}
        try:
            latf = float(lat)
            lonf = float(lon)
        except Exception:
            return {'error': SUGGESTION_COORD_MALFORMED, 'index': idx, 'suggestion': s}
        if not (-90.0 <= latf <= 90.0) or not (-180.0 <= lonf <= 180.0):
            return {'error': 'suggestion coordinates out of range', 'index': idx, 'suggestion': s}
    return None


def _slugify(name: str) -> str:
    # minimal slug helper for ids
    try:
        s = str(name).strip().lower()
        return s.replace(' ', '-').replace('/', '-').replace("'", '')
    except Exception:
        return str(uuid.uuid4())


def _ensure_object_id(obj):
    if not isinstance(obj, dict):
        return None

    existing = obj.get("id")
    if isinstance(existing, str) and existing.strip():
        return existing.strip()

    name = obj.get("name")
    if isinstance(name, str) and name.strip():
        return _slugify(name)

    return None


def _build_phase2_scope_maps():
    scope_to_engines = {scope: [] for scope in PHASE2_SCOPES}
    optional_engines = {scope: [] for scope in PHASE2_SCOPES}
    for engine_slug, meta in PHASE2_ENGINE_REGISTRY.items():
        scope_slug = meta.get("scope")
        if scope_slug not in scope_to_engines:
            continue
        scope_to_engines[scope_slug].append(engine_slug)
        if bool(meta.get("optional")):
            optional_engines[scope_slug].append(engine_slug)
    return scope_to_engines, optional_engines


PHASE2_SCOPE_TO_ENGINES, PHASE2_OPTIONAL_ENGINES = _build_phase2_scope_maps()


def _build_phase2_scope_entry(scope_slug: str):
    return {
        "scope": scope_slug,
        "engines": list(PHASE2_SCOPE_TO_ENGINES.get(scope_slug, [])),
        "optional_engines": list(PHASE2_OPTIONAL_ENGINES.get(scope_slug, [])),
    }


def _build_phase2_engine_entry(engine_slug: str, selected_filter=None, filter_source=None):
    meta = PHASE2_ENGINE_REGISTRY.get(engine_slug, {})
    return {
        "engine": engine_slug,
        "scope": meta.get("scope"),
        "optional": bool(meta.get("optional")),
        "allowed_filters": list(meta.get("allowed_filters") or []),
        "default_filter": meta.get("default_filter"),
        "filter": selected_filter,
        "filter_source": filter_source,
    }


def _get_normalized_targets():
    """Return Phase 1 target summaries normalized to SceneObjectSummary shape."""
    try:
        try:
            from backend.targets_data import get_targets
        except Exception:
            import sys
            repo_root = os.path.dirname(os.path.dirname(__file__))
            if repo_root not in sys.path:
                sys.path.insert(0, repo_root)
            from backend.targets_data import get_targets
        raw_targets = get_targets(with_images=False)
    except Exception:
        raw_targets = []

    normalized = None
    try:
        try:
            norm_callable = registry.get("targets")
        except KeyError:
            norm_callable = None

        if norm_callable is not None:
            normalized = norm_callable(raw_targets)
    except Exception:
        normalized = None

    if isinstance(normalized, list):
        return normalized

    # Fallback mapping to contract-like summaries if normalizer is unavailable.
    out = []
    for t in raw_targets:
        if not isinstance(t, dict):
            continue
        category = t.get('category')
        if category not in ('planet', 'deep_sky', 'satellite'):
            continue
        out.append({
            'id': _slugify(t.get('name') or 'unknown'),
            'name': t.get('name') or 'unknown',
            'type': category,
            'engine': 'mock',
            'summary': t.get('reason') or t.get('summary') or '',
            'position': None,
            'visibility': None,
            'relevance_score': None,
        })
    return out


def _build_satellite_engine_slice():
    """Phase 1 Satellite slice: visible passes only."""
    try:
        try:
            norm_callable = registry.get("passes")
        except KeyError:
            norm_callable = None
        cleaned = norm_callable(MOCK_PASSES) if norm_callable is not None else MOCK_PASSES
    except Exception:
        cleaned = MOCK_PASSES

    out = []
    for p in cleaned:
        if not isinstance(p, dict):
            continue
        name = p.get('object_name')
        if not name:
            continue
        try:
            max_el = float(p.get('max_elevation_deg') or 0.0)
        except Exception:
            max_el = 0.0
        out.append({
            'id': _slugify(name),
            'name': name,
            'type': 'satellite',
            'engine': 'satellite',
            'summary': f"Visible pass from {p.get('start_direction') or '?'} to {p.get('end_direction') or '?'} at {p.get('start_time') or 'unknown time'}",
            'position': {'elevation': max_el},
            'visibility': {
                'is_visible': True,
                'visibility_window_start': p.get('start_time'),
                'visibility_window_end': None,
            },
            'relevance_score': max(0.0, min(1.0, max_el / 90.0)),
        })
    return out


def _build_solar_system_engine_slice():
    """Phase 1 Solar System slice: visible planets only."""
    out = []
    for t in _get_normalized_targets():
        if t.get('type') != 'planet':
            continue
        candidate = dict(t)
        candidate['engine'] = 'solar_system'
        if candidate.get('relevance_score') is None:
            candidate['relevance_score'] = 0.8
        out.append(candidate)
    return out


def _build_deep_sky_engine_slice():
    """Phase 1 Deep Sky slice: visible tonight only."""
    out = []
    for t in _get_normalized_targets():
        if t.get('type') != 'deep_sky':
            continue
        candidate = dict(t)
        candidate['engine'] = 'deep_sky'
        if candidate.get('relevance_score') is None:
            candidate['relevance_score'] = 0.6
        out.append(candidate)
    return out


def _build_earth_engine_slice(parsed_location=None):
    """Phase 1 Earth slice: observing conditions only."""
    resp = deepcopy(MOCK_CONDITIONS)
    if parsed_location is None:
        resp['location_label'] = 'ORAS Observatory'
    else:
        resp['location_label'] = 'Custom Location'

    try:
        norm = registry.get("conditions")
        normalized = norm(resp)
        if isinstance(normalized, dict):
            resp = normalized
    except Exception:
        # Conditions endpoint still serves payload even if normalization fails.
        pass

    return resp


def _is_above_horizon(obj):
    """Best-effort horizon filter for Phase 1 scene assembly."""
    vis = obj.get('visibility')
    if isinstance(vis, dict) and vis.get('is_visible') is False:
        return False
    pos = obj.get('position')
    if not isinstance(pos, dict):
        return True
    elev = pos.get('elevation')
    if elev is None:
        return True
    try:
        return float(elev) > 0.0
    except Exception:
        return True


def _rank_scene_objects(objects):
    def _rank_key(o):
        score = o.get('relevance_score') or 0.0
        type_order = {'satellite': 0, 'planet': 1, 'deep_sky': 2}
        tord = type_order.get(o.get('type'), 99)
        return (-float(score), tord, o.get('name') or '')

    try:
        return sorted(objects, key=_rank_key)
    except Exception:
        return objects


def _phase2_timestamp():
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _build_phase2_observing_context(parsed_location=None):
    conditions = _build_earth_engine_slice(parsed_location)
    return {
        "location_label": conditions.get("location_label"),
        "observing_score": conditions.get("observing_score"),
        "moon_phase": conditions.get("moon_phase"),
        "summary": conditions.get("summary"),
    }


def _to_phase2_scene_objects(raw_objects, engine_slug):
    scene_objects = []
    for obj in raw_objects:
        if not isinstance(obj, dict):
            continue
        object_id = _ensure_object_id(obj)
        if not object_id:
            continue
        reason = obj.get("reason") or obj.get("summary") or f"Selected by {engine_slug} engine"
        scene_objects.append(
            {
                "id": object_id,
                "name": obj.get("name"),
                "type": obj.get("type"),
                "engine": engine_slug,
                "summary": obj.get("summary") or "",
                "reason": reason,
                "position": obj.get("position"),
                "visibility": obj.get("visibility"),
            }
        )
    return scene_objects


def _build_phase2_scene_group(title, reason, objects):
    return {
        "title": title,
        "reason": reason,
        "objects": objects,
    }


def _build_phase2_deep_sky_scene(filter_slug, parsed_location=None):
    objects = _to_phase2_scene_objects(_build_deep_sky_engine_slice(), "deep_sky")
    scene_summary = "Deep-sky targets that are currently practical to observe."
    if filter_slug == "naked_eye":
        scene_summary = "Deep-sky targets surfaced for easier visual observing context."
    groups = [
        _build_phase2_scene_group(
            "Deep Sky Targets",
            "Targets grouped for current deep-sky observing opportunities.",
            objects,
        )
    ]
    return {
        "scope": "sky",
        "engine": "deep_sky",
        "filter": filter_slug,
        "timestamp": _phase2_timestamp(),
        "title": "Deep Sky Scene",
        "summary": scene_summary,
        "groups": groups,
        "observing_context": _build_phase2_observing_context(parsed_location),
    }


def _build_phase2_planets_scene(filter_slug, parsed_location=None):
    objects = _to_phase2_scene_objects(_build_solar_system_engine_slice(), "planets")
    groups = [
        _build_phase2_scene_group(
            "Planets Visible",
            "Planet targets grouped for immediate observing decisions.",
            objects,
        )
    ]
    return {
        "scope": "solar_system",
        "engine": "planets",
        "filter": filter_slug,
        "timestamp": _phase2_timestamp(),
        "title": "Planets Scene",
        "summary": "Planets that are currently available in the observing window.",
        "groups": groups,
        "observing_context": _build_phase2_observing_context(parsed_location),
    }


def _build_phase2_moon_scene(filter_slug, parsed_location=None):
    conditions = _build_earth_engine_slice(parsed_location)
    moon_phase = conditions.get("moon_phase") or "Unknown"
    moon_summary = f"Moon phase tonight: {moon_phase}"
    moon_object = {
        "id": "moon",
        "name": "Moon",
        "type": "planet",
        "engine": "moon",
        "summary": moon_summary,
        "reason": "Moon is always relevant for observing quality and lunar viewing.",
        "position": None,
        "visibility": {"is_visible": True},
    }
    groups = [
        _build_phase2_scene_group(
            "Moon Conditions",
            "Moon phase and observing impact grouped for quick planning.",
            [moon_object],
        )
    ]
    return {
        "scope": "solar_system",
        "engine": "moon",
        "filter": filter_slug,
        "timestamp": _phase2_timestamp(),
        "title": "Moon Scene",
        "summary": "Current lunar context for observing decisions.",
        "groups": groups,
        "observing_context": _build_phase2_observing_context(parsed_location),
    }


def _build_phase2_satellites_scene(filter_slug, parsed_location=None):
    objects = _to_phase2_scene_objects(_build_satellite_engine_slice(), "satellites")
    high_priority = []
    secondary = []
    for obj in objects:
        if (obj.get("summary") or "").lower().find("visible pass") >= 0:
            high_priority.append(obj)
        else:
            secondary.append(obj)
    groups = []
    if high_priority:
        groups.append(
            _build_phase2_scene_group(
                "Upcoming Passes",
                "Passes surfaced as immediate opportunities.",
                high_priority,
            )
        )
    if secondary:
        groups.append(
            _build_phase2_scene_group(
                "Additional Passes",
                "Secondary passes that may still be observable.",
                secondary,
            )
        )
    if not groups:
        groups = [
            _build_phase2_scene_group(
                "Satellite Passes",
                "No pass data available, but the scene structure remains consistent.",
                [],
            )
        ]
    return {
        "scope": "earth",
        "engine": "satellites",
        "filter": filter_slug,
        "timestamp": _phase2_timestamp(),
        "title": "Satellites Scene",
        "summary": "Near-term satellite pass opportunities.",
        "groups": groups,
        "observing_context": _build_phase2_observing_context(parsed_location),
    }


def _build_phase2_above_me_scene(filter_slug, parsed_location=None):
    phase1_state = _build_phase1_scene_state(parsed_location)
    phase1_scene = phase1_state.get("scene") or {}
    phase1_objects = phase1_scene.get("objects") or []
    objects = _to_phase2_scene_objects(phase1_objects, "above_me")

    groups = [
        _build_phase2_scene_group(
            "Above Me Now",
            "Validated Phase 1 scene objects grouped for Phase 2 pipeline compatibility.",
            objects,
        )
    ]

    return {
        "scope": "sky",
        "engine": "above_me",
        "filter": filter_slug,
        "timestamp": phase1_scene.get("timestamp") or _phase2_timestamp(),
        "title": "Above Me Scene",
        "summary": "Current observing surface aligned with the Phase 2 engine pipeline.",
        "groups": groups,
        "observing_context": _build_phase2_observing_context(parsed_location),
    }


def _build_phase2_scene(scope_slug, engine_slug, filter_slug, parsed_location=None):
    engine_meta = PHASE2_ENGINE_REGISTRY.get(engine_slug)
    if engine_meta is None:
        raise ValueError("invalid_engine")
    if engine_meta.get("scope") != scope_slug:
        raise ValueError("engine_out_of_scope")
    allowed_filters = list(engine_meta.get("allowed_filters") or [])
    if filter_slug not in PHASE2_FILTERS or filter_slug not in allowed_filters:
        raise ValueError("invalid_filter")

    builders = {
        "above_me": _build_phase2_above_me_scene,
        "deep_sky": _build_phase2_deep_sky_scene,
        "planets": _build_phase2_planets_scene,
        "moon": _build_phase2_moon_scene,
        "satellites": _build_phase2_satellites_scene,
    }
    builder = builders.get(engine_slug)
    if builder is None:
        raise ValueError("scene_builder_not_available")
    return builder(filter_slug=filter_slug, parsed_location=parsed_location)


def _iter_phase2_grouped_objects(scene):
    groups = scene.get("groups") if isinstance(scene, dict) else None
    if not isinstance(groups, list):
        return
    for group in groups:
        if not isinstance(group, dict):
            continue
        objects = group.get("objects")
        if not isinstance(objects, list):
            continue
        for obj in objects:
            if isinstance(obj, dict):
                yield obj


def _build_phase2_object_lookup(parsed_location=None):
    required_engines = ("above_me", "deep_sky", "planets", "moon", "satellites")
    lookup = {}

    for engine_slug in required_engines:
        engine_meta = PHASE2_ENGINE_REGISTRY.get(engine_slug) or {}
        scope_slug = engine_meta.get("scope")
        default_filter = engine_meta.get("default_filter")
        if not scope_slug or not default_filter:
            continue

        try:
            scene = _build_phase2_scene(
                scope_slug,
                engine_slug,
                default_filter,
                parsed_location=parsed_location,
            )
        except Exception:
            logger.exception(f"phase2.object.lookup.scene.failed engine={engine_slug}")
            continue

        for scene_obj in _iter_phase2_grouped_objects(scene):
            object_id = _ensure_object_id(scene_obj)
            if not object_id:
                continue
            normalized = dict(scene_obj)
            normalized["id"] = object_id
            lookup.setdefault(object_id, normalized)

    return lookup


def _phase2_object_lookup_cache_key(parsed_location=None):
    if not isinstance(parsed_location, dict):
        return "oras"

    return (
        parsed_location.get("latitude"),
        parsed_location.get("longitude"),
        parsed_location.get("elevation_ft"),
    )


def _get_phase2_object_lookup(parsed_location=None):
    cache_key = _phase2_object_lookup_cache_key(parsed_location)
    now = time.time()
    cached = _phase2_object_lookup_cache.get(cache_key)
    if isinstance(cached, dict) and cached.get("expires_at", 0) > now:
        return cached.get("lookup") or {}

    lookup = _build_phase2_object_lookup(parsed_location=parsed_location)
    _phase2_object_lookup_cache[cache_key] = {
        "lookup": lookup,
        "expires_at": now + _PHASE2_OBJECT_LOOKUP_TTL_SECONDS,
    }
    return lookup


def _build_phase1_scene_state(parsed_location=None):
    """Assemble the unified backend-owned Phase 1 scene state."""
    from datetime import datetime

    # Merge limited Phase 1 engine slices.
    satellite_objects = _build_satellite_engine_slice()
    planet_objects = _build_solar_system_engine_slice()
    deep_sky_objects = _build_deep_sky_engine_slice()

    objects = [o for o in (satellite_objects + planet_objects + deep_sky_objects) if o.get('type') in ('satellite', 'planet', 'deep_sky')]
    objects = [o for o in objects if _is_above_horizon(o)]
    objects = _rank_scene_objects(objects)
    objects = objects[:10]

    scene = {
        'scope': 'above_me',
        'engine': 'main',
        'filter': 'visible',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'objects': objects,
    }

    # Validate against authoritative SceneContract when possible.
    try:
        from backend.app.contracts.phase1 import SceneContract
        SceneContract.parse_obj(scene)
    except Exception:
        logger.exception("scene.validation.warn")

    # Derive supporting panel state from the same backend-owned scene source.
    conditions = _build_earth_engine_slice(parsed_location)
    top_target = next((o for o in objects if o.get('type') in ('planet', 'deep_sky')), None)
    next_pass = next((o for o in objects if o.get('type') == 'satellite'), None)

    briefing = {
        'observing_score': conditions.get('observing_score'),
        'top_target_id': top_target.get('id') if top_target else None,
        'top_target_name': top_target.get('name') if top_target else None,
        'next_event': next_pass.get('name') if next_pass else None,
        'conditions_summary': conditions.get('summary'),
    }

    def _elevation_band(elevation):
        try:
            val = float(elevation)
        except Exception:
            val = None
        if val is None:
            return 'mid'
        if val >= 50:
            return 'high'
        if val >= 20:
            return 'mid'
        return 'low'

    supporting_targets = []
    supporting_passes = []
    for o in objects:
        if o.get('type') in ('planet', 'deep_sky'):
            pos = o.get('position') if isinstance(o.get('position'), dict) else {}
            supporting_targets.append({
                'id': o.get('id'),
                'name': o.get('name'),
                'type': o.get('type'),
                'category': o.get('type'),
                'engine': o.get('engine'),
                'direction': 'SE',
                'elevation_band': _elevation_band(pos.get('elevation')),
                'best_time': 'Tonight',
                'difficulty': 'beginner' if o.get('type') == 'planet' else 'intermediate',
                'reason': o.get('summary') or '',
                'summary': o.get('summary') or '',
            })
        elif o.get('type') == 'satellite':
            pos = o.get('position') if isinstance(o.get('position'), dict) else {}
            vis = o.get('visibility') if isinstance(o.get('visibility'), dict) else {}
            supporting_passes.append({
                'object_name': o.get('name'),
                'start_time': vis.get('visibility_window_start'),
                'max_elevation_deg': pos.get('elevation'),
                'start_direction': 'W',
                'end_direction': 'E',
                'visibility': 'high' if (o.get('relevance_score') or 0) >= 0.66 else 'medium',
            })

    supporting_alerts = deepcopy(MOCK_ALERTS)
    events = supporting_alerts[:3]

    return {
        'scene': scene,
        'briefing': briefing,
        'events': events,
        'supporting': {
            'targets': supporting_targets,
            'passes': supporting_passes,
            'alerts': supporting_alerts,
            'conditions': conditions,
        },
    }


def _build_scene_from_targets(parsed_location=None):
    """Compatibility wrapper returning only the scene contract."""
    return _build_phase1_scene_state(parsed_location).get('scene', {
        'scope': 'above_me',
        'engine': 'main',
        'filter': 'visible',
        'timestamp': '',
        'objects': [],
    })


def _fallback_media_for_type(obj_type):
    """Deterministic fallback media to keep detail payloads usable."""
    if obj_type == 'satellite':
        return {'type': 'image', 'url': 'https://images-assets.nasa.gov/image/iss071e099123/iss071e099123~small.jpg', 'source': 'NASA'}
    if obj_type == 'planet':
        return {'type': 'image', 'url': 'https://images-assets.nasa.gov/image/PIA03149/PIA03149~small.jpg', 'source': 'NASA'}
    return {'type': 'image', 'url': 'https://images-assets.nasa.gov/image/heic0710a/heic0710a~small.jpg', 'source': 'NASA'}


def _build_phase1_object_detail(found, scene_objects=None):
    """Build canonical Phase 1 object detail payload."""
    scene_objects = scene_objects or []
    summary = found.get('summary') or ''
    detail = {
        'id': found.get('id'),
        'name': found.get('name'),
        'type': found.get('type'),
        'engine': found.get('engine'),
        'summary': summary,
        'description': f"{summary} This matters now because it is currently visible in your Above Me scene.".strip(),
        'position': found.get('position'),
        'visibility': found.get('visibility'),
        'media': [],
        'related_objects': [],
    }

    if not isinstance(detail.get('visibility'), dict):
        detail['visibility'] = {'is_visible': True}

    # Attach related observing-now news when available.
    related_news = []
    for alert in MOCK_ALERTS:
        if not isinstance(alert, dict):
            continue
        related_news.append({
            'id': _slugify(alert.get('title') or 'alert'),
            'type': 'news',
            'title': alert.get('title'),
            'summary': alert.get('summary'),
            'relevance': alert.get('relevance'),
        })
    detail['related_objects'] = related_news

    # Try resolver first; fall back to deterministic image per object type.
    try:
        try:
            from backend.services.imageResolver import get_object_image
        except Exception:
            from services.imageResolver import get_object_image

        img = get_object_image(found.get('name') or '')
        if img and isinstance(img, dict) and img.get('image_url'):
            detail['media'] = [{'type': 'image', 'url': img.get('image_url'), 'source': img.get('source')}]
        else:
            nm = (found.get('name') or '').strip()
            if nm and (len(nm) <= 4 and nm[0].lower() == 'm' and nm[1:].strip().isdigit()):
                alt = f"Messier {nm[1:].strip()}"
                alt_img = get_object_image(alt)
                if alt_img and isinstance(alt_img, dict) and alt_img.get('image_url'):
                    detail['media'] = [{'type': 'image', 'url': alt_img.get('image_url'), 'source': alt_img.get('source')}]
    except Exception:
        pass

    if not detail.get('media'):
        detail['media'] = [_fallback_media_for_type(found.get('type'))]

    return detail


class SimpleHandler(BaseHTTPRequestHandler):
    def _send_json(self, obj, status=200, extra_headers=None):
        payload = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        if extra_headers:
            for k, v in extra_headers.items():
                try:
                    self.send_header(str(k), str(v))
                except Exception:
                    # headers are best-effort; do not fail the request on header issues
                    logger.exception(f"failed to set header {k}")
        self.end_headers()
        self.wfile.write(payload)

    def _build_envelope(self, status_str, data=None, meta=None, error=None):
        """Build and validate a ResponseEnvelope, returning a plain dict.

        Raises Exception when the envelope cannot be validated.
        """
        env = {
            "status": status_str,
            "data": data if data is not None else None,
            "meta": meta if meta is not None else {},
            "error": error if error is not None else None,
        }
        # Validate with authoritative model
        validated = ResponseEnvelope.parse_obj(env)
        return validated.dict()

    def do_GET(self):
        start = time.time()
        request_id = str(uuid.uuid4())
        parsed = urlparse(self.path)
        # shallow query params
        q = {k: v if len(v) > 1 else v[0] for k, v in parse_qs(parsed.query).items()}
        logger.info(f"req={request_id} START {self.command} {parsed.path} q={q}")
        status = 200
        try:
            # Parse optional location override params for all API endpoints.
            # Expected params: lat, lon, elevation_ft (optional)
            def parse_location_params(qdict):
                lat_s = qdict.get('lat')
                lon_s = qdict.get('lon')
                elev_s = qdict.get('elevation_ft')
                # If neither lat nor lon provided, treat as no override (use ORAS)
                if lat_s is None and lon_s is None and elev_s is None:
                    return None

                # Both lat and lon must be present for a valid override
                if lat_s is None or lon_s is None:
                    raise ValueError('Both lat and lon are required for a location override')

                try:
                    lat = float(lat_s)
                except Exception:
                    raise ValueError('lat must be a number')
                try:
                    lon = float(lon_s)
                except Exception:
                    raise ValueError('lon must be a number')

                if not (-90.0 <= lat <= 90.0):
                    raise ValueError('lat must be between -90 and 90')
                if not (-180.0 <= lon <= 180.0):
                    raise ValueError('lon must be between -180 and 180')

                elev = None
                if elev_s is not None and elev_s != '':
                    try:
                        elev = float(elev_s)
                    except Exception:
                        raise ValueError('elevation_ft must be numeric')

                return { 'latitude': lat, 'longitude': lon, 'elevation_ft': elev }

            try:
                parsed_location = parse_location_params(q)
            except ValueError as ve:
                # Invalid parameters: return 400 JSON error for API paths
                if parsed.path.startswith('/api/'):
                    self._send_json({'error': {'code': 'invalid_parameters', 'message': str(ve)}}, status=400)
                    status = 400
                    return
                else:
                    raise

            if parsed.path == "/api/scopes":
                scope_query = q.get("scope")
                engine_query = q.get("engine")
                filter_query = q.get("filter")
                has_scope = scope_query is not None and str(scope_query).strip() != ""
                has_engine = engine_query is not None and str(engine_query).strip() != ""
                has_filter = filter_query is not None and str(filter_query).strip() != ""

                if not has_scope and has_filter and not has_engine:
                    self._send_json(
                        {
                            "error": {
                                "code": "missing_engine",
                                "message": "engine is required when filter is provided",
                            }
                        },
                        status=400,
                    )
                    status = 400
                elif not has_scope and has_engine:
                    self._send_json(
                        {
                            "error": {
                                "code": "missing_scope",
                                "message": "scope is required when engine is provided",
                                "details": [{"allowed_scopes": list(PHASE2_SCOPES)}],
                            }
                        },
                        status=400,
                    )
                    status = 400
                elif not has_scope:
                    payload = {
                        "scopes": [_build_phase2_scope_entry(s) for s in PHASE2_SCOPES]
                    }
                    self._send_json(payload)
                    status = 200
                else:
                    scope_slug = str(scope_query).strip()
                    if scope_slug not in PHASE2_SCOPE_TO_ENGINES:
                        self._send_json(
                            {
                                "error": {
                                    "code": "invalid_scope",
                                    "message": f"invalid scope: {scope_slug}",
                                    "details": [
                                        {
                                            "scope": scope_slug,
                                            "allowed_scopes": list(PHASE2_SCOPES),
                                        }
                                    ],
                                }
                            },
                            status=400,
                        )
                        status = 400
                    elif has_engine:
                        engine_slug = str(engine_query).strip()
                        engine_meta = PHASE2_ENGINE_REGISTRY.get(engine_slug)
                        if engine_meta is None:
                            self._send_json(
                                {
                                    "error": {
                                        "code": "invalid_engine",
                                        "message": f"invalid engine: {engine_slug}",
                                        "details": [
                                            {
                                                "engine": engine_slug,
                                                "allowed_engines": list(PHASE2_ENGINE_REGISTRY.keys()),
                                            }
                                        ],
                                    }
                                },
                                status=400,
                            )
                            status = 400
                        elif engine_meta.get("scope") != scope_slug:
                            self._send_json(
                                {
                                    "error": {
                                        "code": "engine_out_of_scope",
                                        "message": f"engine {engine_slug} is not allowed in scope {scope_slug}",
                                        "details": [
                                            {
                                                "scope": scope_slug,
                                                "engine": engine_slug,
                                                "allowed_engines": list(PHASE2_SCOPE_TO_ENGINES.get(scope_slug, [])),
                                            }
                                        ],
                                    }
                                },
                                status=400,
                            )
                            status = 400
                        else:
                            allowed_filters = list(engine_meta.get("allowed_filters") or [])
                            default_filter = engine_meta.get("default_filter")
                            if has_filter:
                                selected_filter = str(filter_query).strip()
                                if selected_filter not in PHASE2_FILTERS or selected_filter not in allowed_filters:
                                    self._send_json(
                                        {
                                            "error": {
                                                "code": "invalid_filter",
                                                "message": f"invalid filter for engine {engine_slug}: {selected_filter}",
                                                "details": [
                                                    {
                                                        "scope": scope_slug,
                                                        "engine": engine_slug,
                                                        "filter": selected_filter,
                                                        "allowed_filters": allowed_filters,
                                                    }
                                                ],
                                            }
                                        },
                                        status=400,
                                    )
                                    status = 400
                                    return
                                filter_source = "requested"
                            else:
                                selected_filter = default_filter
                                filter_source = "default"
                            self._send_json(
                                _build_phase2_engine_entry(
                                    engine_slug,
                                    selected_filter=selected_filter,
                                    filter_source=filter_source,
                                )
                            )
                            status = 200
                    else:
                        if has_filter:
                            self._send_json(
                                {
                                    "error": {
                                        "code": "missing_engine",
                                        "message": "engine is required when filter is provided",
                                    }
                                },
                                status=400,
                            )
                            status = 400
                        else:
                            self._send_json(_build_phase2_scope_entry(scope_slug))
                            status = 200
            elif parsed.path == "/api/conditions":
                # Per-module isolation guard: ensure failures in assembling
                # the conditions payload don't take down other endpoints.
                try:
                    simulate_normalizer_fail = str(os.environ.get("SIMULATE_NORMALIZER_FAIL", "")).strip().lower()
                    simulate_conditions_fail = simulate_normalizer_fail in ("conditions", "all", "1", "true", "yes")

                    # Use short TTL in-process cache for conditions responses only.
                    try:
                        _ensure_cache()
                    except Exception:
                        logger.exception(f"req={request_id} cache.init.fail")

                    if parsed_location is None:
                        cache_key = "conditions:oras"
                    else:
                        # include numeric coords to distinguish custom locations
                        lat = parsed_location.get('latitude')
                        lon = parsed_location.get('longitude')
                        elev = parsed_location.get('elevation_ft')
                        cache_key = f"conditions:custom:{lat}:{lon}:{elev}"

                    # When degraded-mode simulation is enabled, bypass cache so
                    # we exercise the normalization/error path deterministically.
                    cached_resp = None if simulate_conditions_fail else (_simple_cache.get(cache_key) if _simple_cache is not None else None)
                    if cached_resp is not None:
                        # Return cached payload wrapped in the same envelope shape as misses.
                        from copy import deepcopy
                        resp = deepcopy(cached_resp)
                        meta = {
                            'cached': True,
                            'cached_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                        }
                        envelope = self._build_envelope("ok", data=resp, meta=meta, error=None)
                        logger.info(f"req={request_id} cache.hit key={cache_key}")
                        self._send_json(envelope)
                        status = 200
                    else:
                        # Build fresh response and populate cache after normalization
                        from copy import deepcopy
                        resp = deepcopy(MOCK_CONDITIONS)
                        if parsed_location is None:
                            resp['location_label'] = 'ORAS Observatory'
                        else:
                            resp['location_label'] = 'Custom Location'


                        # Use the Package 2 registry to discover the Conditions
                        # normalizer and apply it. Treat missing registration or
                        # normalization errors as module assembly failures.
                        try:
                            norm = registry.get("conditions")
                        except KeyError:
                            logger.exception(f"req={request_id} module.conditions.registry.miss")
                            err_env = self._build_envelope(
                                "error",
                                data=None,
                                meta={},
                                error={
                                    'code': 'module_error',
                                    'message': 'no normalizer registered for conditions',
                                    'details': [ { 'module': 'conditions' } ]
                                }
                            )
                            self._send_json(err_env, status=500)
                            status = 500
                            return

                        try:
                            if simulate_conditions_fail:
                                raise RuntimeError("simulated normalizer failure for conditions")
                            normalized = norm(resp)
                            if isinstance(normalized, dict):
                                resp = normalized
                                logger.info(f"req={request_id} normalize=ok")
                            else:
                                logger.info(f"req={request_id} normalize=skip type={type(normalized)}")
                        except (NormalizationError, KeyError, TypeError) as e:
                            logger.exception(f"req={request_id} normalize.fail")
                            err_env = self._build_envelope(
                                "error",
                                data=None,
                                meta={},
                                error={
                                    'code': 'normalization_error',
                                    'message': str(e),
                                }
                            )
                            self._send_json(err_env, status=500)
                            status = 500
                            return
                        except Exception:
                            logger.exception(f"req={request_id} module.conditions.assembly.fail")
                            err_env = self._build_envelope(
                                "error",
                                data=None,
                                meta={},
                                error={
                                    'code': 'module_error',
                                    'message': 'failed to assemble conditions payload',
                                    'details': [ { 'module': 'conditions' } ]
                                }
                            )
                            self._send_json(err_env, status=500)
                            status = 500
                            return

                        # Cache the response (without meta) for a short TTL
                        try:
                            cache_payload = deepcopy(resp)
                            if 'meta' in cache_payload:
                                cache_payload.pop('meta', None)
                            if _simple_cache is not None:
                                _simple_cache.set(cache_key, cache_payload, ttl=5)
                        except Exception:
                            logger.exception(f"req={request_id} cache.set.fail key={cache_key}")

                        # Return the fresh response wrapped in the ResponseEnvelope
                        meta = {
                            'cached': False,
                            'cached_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                        }
                        try:
                            envelope = self._build_envelope("ok", data=resp, meta=meta, error=None)
                        except Exception:
                            logger.exception(f"req={request_id} envelope.validation.fail")
                            err_env = self._build_envelope(
                                "error",
                                data=None,
                                meta={},
                                error={
                                    'code': 'envelope_validation_failed',
                                    'message': 'response envelope validation failed'
                                }
                            )
                            self._send_json(err_env, status=500)
                            status = 500
                            return

                        self._send_json(envelope)
                        status = 200
                except Exception:
                    # Module-level assembly failure: return a standard error contract
                    logger.exception(f"req={request_id} module.conditions.unhandled")
                    err_payload = {
                        'error': {
                            'code': 'module_error',
                            'message': 'internal error assembling module',
                            'details': [ { 'module': 'conditions' } ]
                        }
                    }
                    self._send_json(err_payload, status=500)
                    status = 500
            elif parsed.path == "/api/scene/above-me":
                # Minimal Phase 1 scene assembly from mock targets
                try:
                    scene_state = _build_phase1_scene_state(parsed_location)
                    scene = scene_state.get('scene') or _build_scene_from_targets(parsed_location)
                    # Wrap in ResponseEnvelope
                    try:
                        envelope = self._build_envelope("ok", data=scene, meta={}, error=None)
                    except Exception:
                        logger.exception(f"req={request_id} scene.envelope.validation.fail")
                        err_env = self._build_envelope(
                            "error",
                            data=None,
                            meta={},
                            error={'code': 'envelope_validation_failed', 'message': 'scene response invalid'}
                        )
                        self._send_json(err_env, status=500)
                        status = 500
                        return

                    self._send_json(envelope)
                    status = 200
                except Exception:
                    logger.exception(f"req={request_id} scene.assembly.fail")
                    self._send_json({'error': {'code': 'module_error', 'message': 'failed to assemble scene'}} , status=500)
                    status = 500

            elif parsed.path.startswith("/api/object/"):
                # Authoritative object detail resolver over the aggregated Phase 2 scene surface.
                try:
                    obj_id = parsed.path[len("/api/object/"):].strip()
                    if not obj_id:
                        self._send_json({'error': {'code': 'invalid_request', 'message': 'missing object id'}}, status=400)
                        status = 400
                        return

                    object_lookup = _get_phase2_object_lookup(parsed_location=parsed_location)
                    found = object_lookup.get(obj_id)

                    if not found:
                        self._send_json({'error': {'code': 'not_found', 'message': 'object not found'}}, status=404)
                        status = 404
                        return

                    detail = _build_phase1_object_detail(found, scene_objects=list(object_lookup.values()))
                    try:
                        env = self._build_envelope('ok', data=detail, meta={}, error=None)
                    except Exception:
                        logger.exception(f"req={request_id} object.envelope.validation.fail")
                        err_env = self._build_envelope('error', data=None, meta={}, error={'code': 'envelope_validation_failed', 'message': 'object response invalid'})
                        self._send_json(err_env, status=500)
                        status = 500
                        return

                    self._send_json(env)
                    status = 200
                except Exception:
                    logger.exception(f"req={request_id} object.detail.fail")
                    self._send_json({'error': {'code': 'module_error', 'message': 'failed to assemble object detail'}}, status=500)
                    status = 500

            elif parsed.path == "/api/targets":
                try:
                    scene_state = _build_phase1_scene_state(parsed_location)
                    targets_payload = scene_state.get('supporting', {}).get('targets', [])
                    self._send_json(targets_payload)
                    status = 200
                except Exception:
                    logger.exception(f"req={request_id} targets.assembly.fail")
                    self._send_json({'error': {'code': 'module_error', 'message': 'failed to assemble targets'}}, status=500)
                    status = 500
            elif parsed.path == "/api/location/search":
                # Minimal mock search: require `q` param of length >= 3
                q_param = q.get('q', '') if q else ''
                if q_param is None:
                    q_param = ''
                q_trim = str(q_param).strip()
                if len(q_trim) < 3:
                    # follow the same error contract pattern used elsewhere
                    self._send_json({'error': {'code': 'invalid_request', 'message': 'q must be at least 3 characters', 'details': [ { 'field': 'q', 'reason': 'too_short' } ] }}, status=400)
                    status = 400
                else:
                    # load suggestions from backend/location_suggestions.json and filter
                    try:
                        base = os.path.dirname(__file__)
                        sugg_path = os.path.join(base, 'location_suggestions.json')
                        with open(sugg_path, 'r', encoding='utf-8') as fh:
                            suggestions = json.load(fh)

                        # cache key based on trimmed query
                        cache_key = f"location_search:{q_trim}"
                        # ensure cache is initialized in current execution mode
                        try:
                            _ensure_cache()
                        except Exception:
                            logger.exception(f"req={request_id} cache.init.fail")
                        cached = _simple_cache.get(cache_key) if _simple_cache is not None else None
                        if cached is not None:
                            logger.info(f"req={request_id} cache.hit key={cache_key}")
                            # Return cached payload but signal non-invasively via headers
                            headers = {
                                'X-Cache-Hit': 'true',
                                'X-Cache-At': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                            }
                            self._send_json(cached, extra_headers=headers)
                            status = 200
                            return

                        ql = q_trim.lower()
                        matches = [s for s in suggestions if ql in (s.get('name') or '').lower()]
                        # Validate coordinates on matched suggestions and return 400 on error
                        v_err = _validate_suggestions(matches)
                        if v_err:
                            err_payload = {
                                'error': {
                                    'code': 'invalid_suggestion',
                                    'message': v_err.get('error', SUGGESTION_COORD_MALFORMED),
                                    'details': [ { 'index': v_err.get('index'), 'suggestion': v_err.get('suggestion') } ]
                                }
                            }
                            self._send_json(err_payload, status=400)
                            status = 400
                            return

                        # successful response: cache it briefly and return (signal via headers)
                        try:
                            if _simple_cache is not None:
                                _simple_cache.set(cache_key, matches, ttl=5)
                        except Exception:
                            logger.exception(f"req={request_id} cache.set.fail key={cache_key}")

                        headers = {
                            'X-Cache-Hit': 'false',
                            'X-Cache-At': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                        }
                        self._send_json(matches, extra_headers=headers)
                        status = 200
                    except Exception:
                        logger.exception(f"req={request_id} location.search.load.fail")
                        self._send_json({'error': {'code': 'load_failed', 'message': 'failed to load suggestions'}}, status=500)
                        status = 500
            elif parsed.path == "/api/passes":
                try:
                    scene_state = _build_phase1_scene_state(parsed_location)
                    passes_payload = scene_state.get('supporting', {}).get('passes', [])
                    self._send_json(passes_payload)
                    status = 200
                except Exception:
                    logger.exception(f"req={request_id} passes.assembly.fail")
                    self._send_json({'error': {'code': 'module_error', 'message': 'failed to assemble passes'}}, status=500)
                    status = 500
            elif parsed.path == "/api/alerts":
                try:
                    scene_state = _build_phase1_scene_state(parsed_location)
                    alerts_payload = scene_state.get('supporting', {}).get('alerts', [])
                    self._send_json(alerts_payload)
                    status = 200
                except Exception:
                    logger.exception(f"req={request_id} alerts.assembly.fail")
                    self._send_json({'error': {'code': 'module_error', 'message': 'failed to assemble alerts'}}, status=500)
                    status = 500
            else:
                # Only known API paths allowed in Phase 1
                self.send_error(404, "Not Found")
                status = 404
        except Exception:
            # Unhandled exception
            logger.exception(f"req={request_id} ERROR unhandled exception")
            self.send_error(500, "Internal Server Error")
            status = 500
        finally:
            duration_ms = int((time.time() - start) * 1000)
            logger.info(f"req={request_id} END status={status} duration_ms={duration_ms}")

    def log_message(self, format, *args):
        # Route BaseHTTPRequestHandler logs through logger
        logger.info("%s - %s" % (self.address_string(), format % args))


def run(host="127.0.0.1", port=8000):
    server = HTTPServer((host, port), SimpleHandler)
    logger.info(f"Starting server on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down server")
        server.server_close()


if __name__ == "__main__":
    # Allow overriding the bind port via the PORT env var for local testing.
    # Allow overriding the bind host/port via the HOST and PORT env vars for
    # Docker and local testing. HOST must be a plain host (e.g. 0.0.0.0), not
    # a URL.
    host = os.environ.get('HOST', '127.0.0.1')
    try:
        port = int(os.environ.get('PORT', '8000'))
    except Exception:
        port = 8000
    run(host=host, port=port)

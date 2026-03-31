PHASE2_SCOPES = (
    "above_me",
    "earth",
    "sun",
    "satellites",
    "flights",
    "solar_system",
    "deep_sky",
)
PHASE2_FILTERS = (
    "visible_now",
    "bright_only",
    "high_altitude",
    "short_window",
    "naked_eye",
)
PHASE2_ENGINE_REGISTRY = {
    "above_me": {
        "scope": "above_me",
        "optional": False,
        "allowed_filters": ["visible_now", "high_altitude", "short_window"],
        "default_filter": "visible_now",
    },
    "deep_sky": {
        "scope": "deep_sky",
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
        "scope": "sun",
        "optional": False,
        "allowed_filters": ["visible_now", "high_altitude"],
        "default_filter": "visible_now",
    },
    "satellites": {
        "scope": "satellites",
        "optional": False,
        "allowed_filters": ["visible_now", "high_altitude", "short_window"],
        "default_filter": "visible_now",
    },
    "flights": {
        "scope": "flights",
        "optional": True,
        "allowed_filters": ["visible_now", "high_altitude", "short_window"],
        "default_filter": "visible_now",
    },
}


def _build_phase2_scope_maps():
    scope_to_engines = {scope: [] for scope in PHASE2_SCOPES}
    optional_engines = {scope: [] for scope in PHASE2_SCOPES}
    # Composite scope keeps grouped Earth context while preserving explicit Satellites/Flights scopes.
    scope_to_engines["earth"] = ["satellites", "flights"]
    optional_engines["earth"] = ["flights"]
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


def _build_phase2_engine_entry(
    engine_slug: str, selected_filter: str | None = None, filter_source: str | None = None
):
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


def build_scopes_response(
    scope_query: str | None, engine_query: str | None, filter_query: str | None
) -> tuple[int, dict]:
    """Build the GET /scopes response preserving legacy decision logic."""
    has_scope = scope_query is not None and str(scope_query).strip() != ""
    has_engine = engine_query is not None and str(engine_query).strip() != ""
    has_filter = filter_query is not None and str(filter_query).strip() != ""

    if not has_scope and has_filter and not has_engine:
        return (
            400,
            {
                "error": {
                    "code": "missing_engine",
                    "message": "engine is required when filter is provided",
                }
            },
        )

    if not has_scope and has_engine:
        return (
            400,
            {
                "error": {
                    "code": "missing_scope",
                    "message": "scope is required when engine is provided",
                    "details": [{"allowed_scopes": list(PHASE2_SCOPES)}],
                }
            },
        )

    if not has_scope:
        return (200, {"scopes": [_build_phase2_scope_entry(s) for s in PHASE2_SCOPES]})

    scope_slug = str(scope_query).strip()
    if scope_slug not in PHASE2_SCOPE_TO_ENGINES:
        return (
            400,
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
        )

    if has_engine:
        engine_slug = str(engine_query).strip()
        engine_meta = PHASE2_ENGINE_REGISTRY.get(engine_slug)
        if engine_meta is None:
            return (
                400,
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
            )

        allowed_engines_for_scope = list(PHASE2_SCOPE_TO_ENGINES.get(scope_slug, []))
        if engine_slug not in allowed_engines_for_scope:
            return (
                400,
                {
                    "error": {
                        "code": "engine_out_of_scope",
                        "message": f"engine {engine_slug} is not allowed in scope {scope_slug}",
                        "details": [
                            {
                                "scope": scope_slug,
                                "engine": engine_slug,
                                "allowed_engines": allowed_engines_for_scope,
                            }
                        ],
                    }
                },
            )

        allowed_filters = list(engine_meta.get("allowed_filters") or [])
        default_filter = engine_meta.get("default_filter")
        if has_filter:
            selected_filter = str(filter_query).strip()
            if selected_filter not in PHASE2_FILTERS or selected_filter not in allowed_filters:
                return (
                    400,
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
                )
            filter_source = "requested"
        else:
            selected_filter = default_filter
            filter_source = "default"

        return (
            200,
            _build_phase2_engine_entry(
                engine_slug, selected_filter=selected_filter, filter_source=filter_source
            ),
        )

    if has_filter:
        return (
            400,
            {
                "error": {
                    "code": "missing_engine",
                    "message": "engine is required when filter is provided",
                }
            },
        )

    return (200, _build_phase2_scope_entry(scope_slug))

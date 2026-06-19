from __future__ import annotations

import re
from pathlib import Path

from sqlalchemy import func, inspect, select

from backend.app.db.models import CatalogSource, GaiaDr2Source
from backend.app.db.session import get_engine, session_scope
from backend.app.services.openngc_dso_catalog_service import (
    find_openngc_record_by_messier_id,
    is_openngc_identity,
    lookup_openngc_dso,
    search_openngc_dso,
)
from backend.app.services.solar_system_catalog_service import (
    build_solar_system_object_payload,
    is_solar_system_identity,
)
from backend.app.services.satellite_tle_catalog_service import (
    is_satellite_tle_identity,
    lookup_satellite_tle,
)
from backend.app.services.sky_star_catalog import BRIGHT_STAR_SCENE_OBJECTS, build_tier2_mid_star_scene_objects
from backend.app.services.sky_object_enrichment import enrich_messier_payload

GAIA_DR2_QUERY_RE = re.compile(r"^\s*(gaia\s*dr2|gaiadr2)\s+([0-9]+)\s*$", re.IGNORECASE)
REPO_ROOT = Path(__file__).resolve().parents[3]
RUNTIME_SKYDATA_ROOT = REPO_ROOT / "frontend/public/oras-sky-engine/skydata"

LOCAL_MESSIER_SEARCH_OBJECTS = [
    {
        "catalog": "M31",
        "name": "Andromeda Galaxy",
        "ra_hours": 0.712,
        "dec_deg": 41.269,
        "magnitude": 3.4,
        "object_type": "galaxy",
        "aliases": ["Andromeda", "NGC 224"],
    },
    {
        "catalog": "M42",
        "name": "Orion Nebula",
        "ra_hours": 5.588,
        "dec_deg": -5.391,
        "magnitude": 4.0,
        "object_type": "nebula",
        "aliases": ["NGC 1976"],
    },
    {
        "catalog": "M13",
        "name": "Hercules Cluster",
        "ra_hours": 16.698,
        "dec_deg": 36.467,
        "magnitude": 5.8,
        "object_type": "globular_cluster",
        "aliases": ["NGC 6205", "Great Globular Cluster in Hercules"],
    },
    {
        "catalog": "M8",
        "name": "Lagoon Nebula",
        "ra_hours": 18.060,
        "dec_deg": -24.380,
        "magnitude": 6.0,
        "object_type": "nebula",
        "aliases": ["NGC 6523"],
    },
    {
        "catalog": "M17",
        "name": "Omega Nebula",
        "ra_hours": 18.346,
        "dec_deg": -16.171,
        "magnitude": 6.0,
        "object_type": "nebula",
        "aliases": ["NGC 6618", "Swan Nebula"],
    },
    {
        "catalog": "M20",
        "name": "Trifid Nebula",
        "ra_hours": 18.038,
        "dec_deg": -23.023,
        "magnitude": 6.3,
        "object_type": "nebula",
        "aliases": ["NGC 6514"],
    },
    {
        "catalog": "M22",
        "name": "Sagittarius Cluster",
        "ra_hours": 18.607,
        "dec_deg": -23.904,
        "magnitude": 5.1,
        "object_type": "globular_cluster",
        "aliases": ["NGC 6656"],
    },
    {
        "catalog": "M27",
        "name": "Dumbbell Nebula",
        "ra_hours": 19.993,
        "dec_deg": 22.721,
        "magnitude": 7.5,
        "object_type": "planetary_nebula",
        "aliases": ["NGC 6853"],
    },
    {
        "catalog": "M45",
        "name": "Pleiades",
        "ra_hours": 3.792,
        "dec_deg": 24.117,
        "magnitude": 1.6,
        "object_type": "open_cluster",
        "aliases": ["Seven Sisters"],
    },
    {
        "catalog": "M57",
        "name": "Ring Nebula",
        "ra_hours": 18.893,
        "dec_deg": 33.028,
        "magnitude": 8.8,
        "object_type": "planetary_nebula",
        "aliases": ["NGC 6720"],
    },
    {
        "catalog": "M81",
        "name": "Bode's Galaxy",
        "ra_hours": 9.926,
        "dec_deg": 69.065,
        "magnitude": 6.9,
        "object_type": "galaxy",
        "aliases": ["NGC 3031"],
    },
    {
        "catalog": "M82",
        "name": "Cigar Galaxy",
        "ra_hours": 9.936,
        "dec_deg": 69.679,
        "magnitude": 8.4,
        "object_type": "galaxy",
        "aliases": ["NGC 3034"],
    },
    {
        "catalog": "M92",
        "name": "Hercules Cluster (M92)",
        "ra_hours": 17.285,
        "dec_deg": 43.136,
        "magnitude": 6.4,
        "object_type": "globular_cluster",
        "aliases": ["NGC 6341"],
    },
]


def parse_gaia_dr2_query(query: str | None) -> int | None:
    if not query:
        return None
    match = GAIA_DR2_QUERY_RE.match(query)
    if not match:
        return None
    return int(match.group(2))


def parse_gaia_dr2_source_id(source_id: str) -> int:
    normalized = str(source_id).strip()
    if not normalized.isdigit():
        raise ValueError("invalid Gaia DR2 source_id")
    return int(normalized)


def build_catalog_status_payload(database_url: str | None = None) -> dict:
    engine = get_engine(database_url)
    inspector = inspect(engine)

    if not inspector.has_table("gaia_dr2_sources"):
        return {
            "status": "ok",
            "data": {
                "gaia_dr2": {
                    "status": "missing",
                    "row_count": 0,
                    "last_import_at": None,
                    "source_summary": None,
                },
                "surveys": {"existing_runtime_bundle": _runtime_bundle_state("surveys/milkyway/properties")},
                "satellites": {
                    "existing_runtime_bundle": _runtime_bundle_state("tle_satellite.jsonl.gz"),
                },
            },
            "meta": {"database_ready": False},
        }

    with session_scope(database_url) as session:
        row_count = int(session.scalar(select(func.count()).select_from(GaiaDr2Source)) or 0)
        last_import_at = session.scalar(select(func.max(GaiaDr2Source.imported_at)))
        latest_source = session.scalar(
            select(CatalogSource)
            .where(CatalogSource.source_family == "gaia_dr2")
            .order_by(CatalogSource.imported_at.desc().nullslast(), CatalogSource.created_at.desc())
            .limit(1)
        )

    gaia_status = "missing" if row_count == 0 else "partial"
    source_summary = None
    if latest_source is not None:
        source_summary = {
            "source_key": latest_source.source_key,
            "display_name": latest_source.display_name,
            "version": latest_source.version,
            "imported_at": _isoformat(latest_source.imported_at),
            "license_note": latest_source.license_note,
        }

    return {
        "status": "ok",
        "data": {
            "gaia_dr2": {
                "status": gaia_status,
                "row_count": row_count,
                "last_import_at": _isoformat(last_import_at),
                "source_summary": source_summary,
            },
            "surveys": {"existing_runtime_bundle": _runtime_bundle_state("surveys/milkyway/properties")},
            "satellites": {"existing_runtime_bundle": _runtime_bundle_state("tle_satellite.jsonl.gz")},
        },
        "meta": {"database_ready": True},
    }


def build_gaia_lookup_payload(source_id: str, database_url: str | None = None) -> dict:
    parsed_source_id = parse_gaia_dr2_source_id(source_id)
    return {
        "status": "ok",
        "data": lookup_gaia_dr2_source(parsed_source_id, database_url),
        "meta": {},
    }


def build_exact_object_lookup_payload(
    catalog: str,
    source_id: str,
    model: str,
    database_url: str | None = None,
    lat: str | float | None = None,
    lng: str | float | None = None,
    time: str | None = None,
    elev: str | float | None = None,
) -> dict:
    return {
        "status": "ok",
        "data": lookup_exact_object(
            catalog,
            source_id,
            model,
            database_url,
            lat=lat,
            lng=lng,
            time=time,
            elev=elev,
        ),
        "meta": {},
    }


def lookup_gaia_dr2_source(source_id: int, database_url: str | None = None) -> dict:
    engine = get_engine(database_url)
    inspector = inspect(engine)
    if not inspector.has_table("gaia_dr2_sources"):
        return _not_indexed_payload(source_id)

    with session_scope(database_url) as session:
        result = session.execute(
            select(GaiaDr2Source, CatalogSource)
            .outerjoin(CatalogSource, CatalogSource.id == GaiaDr2Source.catalog_source_id)
            .where(GaiaDr2Source.source_id == source_id)
        ).first()

    if result is None:
        return _not_indexed_payload(source_id)

    gaia_source, catalog_source = result
    provenance = {
        "source_key": catalog_source.source_key if catalog_source is not None else None,
        "display_name": catalog_source.display_name if catalog_source is not None else None,
    }
    return {
        "catalog": "Gaia DR2",
        "source_id": str(gaia_source.source_id),
        "display_name": f"Gaia DR2 {gaia_source.source_id}",
        "model": "star",
        "names": [f"Gaia DR2 {gaia_source.source_id}", f"GAIA {gaia_source.source_id}"],
        "types": ["*"],
        "ra": gaia_source.ra,
        "dec": gaia_source.dec,
        "phot_g_mean_mag": gaia_source.phot_g_mean_mag,
        "bp_rp": gaia_source.bp_rp,
        "parallax": gaia_source.parallax,
        "pmra": gaia_source.pmra,
        "pmdec": gaia_source.pmdec,
        "indexed": True,
        "status": "indexed",
        "provenance": provenance,
    }


def build_sky_search_payload(query: str, database_url: str | None = None) -> dict:
    gaia_source_id = parse_gaia_dr2_query(query)
    if gaia_source_id is not None:
        result = lookup_gaia_dr2_source(gaia_source_id, database_url)
        return {
            "status": "ok",
            "data": {
                "query": query,
                "recognized_query": True,
                "results": [result],
            },
            "meta": {"match_type": "gaia_dr2_source_id"},
        }

    if _is_compact_caldwell_query(query):
        openngc_results = search_openngc_dso(query)
        if openngc_results:
            return {
                "status": "ok",
                "data": {
                    "query": query,
                    "recognized_query": False,
                    "results": openngc_results,
                },
                "meta": {"match_type": "openngc_named_object"},
            }

    local_results = _lookup_local_named_objects(query)
    if local_results:
        return {
            "status": "ok",
            "data": {
                "query": query,
                "recognized_query": False,
                "results": local_results,
            },
            "meta": {"match_type": "local_named_object"},
        }

    openngc_results = search_openngc_dso(query)
    if openngc_results:
        return {
            "status": "ok",
            "data": {
                "query": query,
                "recognized_query": False,
                "results": openngc_results,
            },
            "meta": {"match_type": "openngc_named_object"},
        }

    return {
        "status": "ok",
        "data": {
            "query": query,
            "recognized_query": False,
            "results": [],
        },
        "meta": {},
    }


def lookup_exact_object(
    catalog: str,
    source_id: str,
    model: str,
    database_url: str | None = None,
    lat: str | float | None = None,
    lng: str | float | None = None,
    time: str | None = None,
    elev: str | float | None = None,
) -> dict:
    normalized_catalog = str(catalog or "").strip().lower()
    normalized_source_id = str(source_id or "").strip()
    normalized_model = str(model or "").strip().lower()

    if not normalized_catalog or not normalized_source_id or not normalized_model:
        raise ValueError("catalog, source_id, and model are required")

    if is_solar_system_identity(catalog):
        return build_solar_system_object_payload(
            source_id=normalized_source_id,
            model=normalized_model,
            lat=lat,
            lng=lng,
            time=time,
            elev=elev,
        )

    if is_satellite_tle_identity(catalog, normalized_model):
        return lookup_satellite_tle(
            normalized_source_id,
            time=time,
            lat=lat,
            lng=lng,
            elev=elev,
        )

    if is_openngc_identity(catalog, normalized_model):
        return lookup_openngc_dso(normalized_source_id, catalog=catalog)

    if normalized_catalog == "gaia dr2":
        result = lookup_gaia_dr2_source(parse_gaia_dr2_source_id(normalized_source_id), database_url)
        result["model"] = normalized_model or "star"
        return result

    if normalized_catalog == "hipparcos tier 2 (local)":
        result = _lookup_hipparcos_tier2_by_identity(normalized_source_id, normalized_model)
        if result:
            return result

    local_result = _lookup_local_named_object_by_identity(
        normalized_catalog,
        normalized_source_id,
        normalized_model,
    )
    if local_result:
        return local_result

    raise ValueError("object not found")


def _not_indexed_payload(source_id: int) -> dict:
    return {
        "catalog": "Gaia DR2",
        "source_id": str(source_id),
        "display_name": f"Gaia DR2 {source_id}",
        "model": "star",
        "names": [f"Gaia DR2 {source_id}", f"GAIA {source_id}"],
        "types": ["*"],
        "indexed": False,
        "status": "not_indexed",
        "message": "Gaia DR2 source is not present in the local ORAS catalog yet.",
        "provenance": {"source_key": None},
    }


def _runtime_bundle_state(relative_path: str) -> str:
    return "present" if (RUNTIME_SKYDATA_ROOT / relative_path).exists() else "unknown"


def _isoformat(value) -> str | None:
    if value is None:
        return None
    return value.isoformat()


def _normalize_search_text(value: str | None) -> str:
    if not isinstance(value, str):
        return ""
    normalized = re.sub(r"[^a-z0-9]+", "", value.lower())
    return normalized


def _is_compact_caldwell_query(value: str | None) -> bool:
    return re.fullmatch(r"\s*c\s*0*[1-9][0-9]*\s*", str(value or ""), flags=re.IGNORECASE) is not None


def _messier_otype(object_type: str | None) -> str:
    mapping = {
        "galaxy": "G",
        "nebula": "BNe",
        "globular_cluster": "GlC",
        "open_cluster": "OpC",
        "planetary_nebula": "PN",
    }
    return mapping.get(str(object_type or "").strip().lower(), "G")


def _build_local_search_candidates() -> list[dict]:
    candidates: list[dict] = []

    for star in BRIGHT_STAR_SCENE_OBJECTS:
        name = str(star.get("name") or "").strip()
        if not name:
            continue
        ra_hours = star.get("right_ascension")
        ra_degrees = float(ra_hours) * 15.0 if isinstance(ra_hours, (int, float)) else None
        aliases = [str(alias).strip() for alias in star.get("aliases", []) if str(alias).strip()]
        aliases.extend([f"NAME {name}", name])
        canonical_names: list[str] = []
        for alias in aliases:
            if alias and alias not in canonical_names:
                canonical_names.append(alias)
        candidates.append(
            {
                "result": {
                    "catalog": "Bright Star Catalog (local)",
                    "source_id": star.get("id"),
                    "display_name": name,
                    "model": "star",
                    "names": canonical_names,
                    "types": ["*"],
                    "ra": ra_degrees,
                    "dec": star.get("declination"),
                    "phot_g_mean_mag": star.get("magnitude"),
                    "indexed": True,
                    "status": "indexed",
                    "message": "Resolved from local bright-star index.",
                    "provenance": {"source_key": "bright_star_catalog"},
                },
                "aliases": aliases,
            }
        )

    for obj in LOCAL_MESSIER_SEARCH_OBJECTS:
        catalog = str(obj.get("catalog") or "").strip()
        name = str(obj.get("name") or "").strip()
        if not catalog or not name:
            continue
        aliases: list[str] = []
        aliases.extend(str(alias).strip() for alias in obj.get("aliases", []) if str(alias).strip())
        aliases.append(name)
        aliases.append(catalog)
        if catalog.startswith("M"):
            aliases.extend([f"Messier {catalog[1:]}", f"M {catalog[1:]}".strip()])
        canonical_names = []
        for alias in aliases:
            if alias and alias not in canonical_names:
                canonical_names.append(alias)
        if display_name := f"{catalog} {name}":
            if display_name not in canonical_names:
                canonical_names.append(display_name)
        candidates.append(
            {
                "result": {
                    "catalog": "Messier (local)",
                    "source_id": catalog,
                    "display_name": f"{catalog} {name}",
                    "model": "dso",
                    "names": canonical_names,
                    "types": [_messier_otype(str(obj.get("object_type") or ""))],
                    "ra": float(obj["ra_hours"]) * 15.0,
                    "dec": obj["dec_deg"],
                    "phot_g_mean_mag": obj["magnitude"],
                    "magnitude": obj["magnitude"],
                    "object_type": obj.get("object_type"),
                    "indexed": True,
                    "status": "indexed",
                    "message": "Resolved from local Messier index.",
                    "provenance": {"source_key": "messier_local_seed"},
                },
                "aliases": aliases,
            }
        )

    for candidate in candidates:
        result = candidate["result"]
        if str(result.get("catalog") or "").strip().lower() != "messier (local)":
            continue
        record = find_openngc_record_by_messier_id(str(result.get("source_id") or ""))
        enriched = enrich_messier_payload(result, record)
        candidate["result"] = enriched
        if enriched.get("aliases"):
            candidate["aliases"] = list(dict.fromkeys([*candidate["aliases"], *enriched["aliases"]]))

    return candidates


def _lookup_local_named_object_by_identity(catalog: str, source_id: str, model: str) -> dict | None:
    normalized_source_id = source_id.strip().lower()

    for candidate in _build_local_search_candidates():
        result = candidate["result"]
        result_catalog = str(result.get("catalog") or "").strip().lower()
        result_source_id = str(result.get("source_id") or "").strip().lower()
        result_model = str(result.get("model") or "").strip().lower()

        if (
            result_catalog == catalog
            and result_source_id == normalized_source_id
            and result_model == model
        ):
            return dict(result)

    return None


def _lookup_hipparcos_tier2_by_identity(source_id: str, model: str) -> dict | None:
    if model != "star":
        return None

    normalized_source_id = source_id.strip().lower()
    for star in build_tier2_mid_star_scene_objects():
        star_id = str(star.get("id") or "").strip()
        if star_id.lower() != normalized_source_id:
            continue

        try:
            ra_degrees = float(star["right_ascension"]) * 15.0
            dec_degrees = float(star["declination"])
            magnitude = float(star["magnitude"])
        except Exception:
            return None

        display_name = str(star.get("name") or star_id).strip() or star_id
        names = [display_name, star_id]
        return {
            "catalog": "Hipparcos Tier 2 (local)",
            "source_id": star_id,
            "display_name": display_name,
            "model": "star",
            "names": [name for index, name in enumerate(names) if name and names.index(name) == index],
            "types": ["*"],
            "ra": ra_degrees,
            "dec": dec_degrees,
            "phot_g_mean_mag": magnitude,
            "bp_rp": star.get("color_index"),
            "indexed": True,
            "status": "indexed",
            "message": "Resolved from local Hipparcos Tier 2 index.",
            "provenance": {"source_key": "hipparcos_tier2_local"},
        }

    return None


def _lookup_local_named_objects(query: str, limit: int = 10) -> list[dict]:
    normalized_query = _normalize_search_text(query)
    if not normalized_query:
        return []

    scored: list[tuple[int, dict]] = []
    for candidate in _build_local_search_candidates():
        aliases = candidate["aliases"]
        normalized_aliases = [_normalize_search_text(alias) for alias in aliases]

        best_score = 0
        for alias in normalized_aliases:
            if not alias:
                continue
            if alias == normalized_query:
                best_score = max(best_score, 3)
            elif alias.startswith(normalized_query):
                best_score = max(best_score, 2)
            elif normalized_query in alias:
                best_score = max(best_score, 1)

        if best_score > 0:
            scored.append((best_score, candidate["result"]))

    scored.sort(key=lambda item: (-item[0], str(item[1].get("display_name") or "")))

    unique_results: list[dict] = []
    seen_display_names: set[str] = set()
    for _, result in scored:
        display_name = str(result.get("display_name") or "")
        if display_name in seen_display_names:
            continue
        seen_display_names.add(display_name)
        unique_results.append(result)
        if len(unique_results) >= limit:
            break

    return unique_results

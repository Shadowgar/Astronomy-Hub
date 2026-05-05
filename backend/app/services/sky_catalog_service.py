from __future__ import annotations

import re
from pathlib import Path

from sqlalchemy import func, inspect, select

from backend.app.db.models import CatalogSource, GaiaDr2Source
from backend.app.db.session import get_engine, session_scope

GAIA_DR2_QUERY_RE = re.compile(r"^\s*(gaia\s*dr2|gaiadr2)\s+([0-9]+)\s*$", re.IGNORECASE)
REPO_ROOT = Path(__file__).resolve().parents[3]
RUNTIME_SKYDATA_ROOT = REPO_ROOT / "frontend/public/oras-sky-engine/skydata"


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
        "source_id": gaia_source.source_id,
        "display_name": f"Gaia DR2 {gaia_source.source_id}",
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

    return {
        "status": "ok",
        "data": {
            "query": query,
            "recognized_query": False,
            "results": [],
        },
        "meta": {},
    }


def _not_indexed_payload(source_id: int) -> dict:
    return {
        "catalog": "Gaia DR2",
        "source_id": source_id,
        "display_name": f"Gaia DR2 {source_id}",
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
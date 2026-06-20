from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import gzip
import json
from pathlib import Path
import re
from typing import Any

from backend.app.services.sky_engine_links import build_sky_engine_object_url
from backend.app.services.sky_object_enrichment import caldwell_aliases, enrich_openngc_payload


OPENNGC_LICENSE_NOTE = "OpenNGC by Mattia Verga, CC-BY-SA-4.0"
OPENNGC_MODEL = "dso"
OPENNGC_CATALOGS = {"openngc (local)", "ngc (openngc)", "ic (openngc)"}
REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OPENNGC_CATALOG_PATH = REPO_ROOT / "backend/app/data/sky/openngc_dso_catalog.json.gz"


@dataclass(frozen=True)
class OpenNgcCatalog:
    records_by_source_id: dict[str, dict[str, Any]]
    records_by_messier_id: dict[str, dict[str, Any]]
    search_candidates: list[dict[str, Any]]
    count: int
    skipped_count: int
    type_counts: dict[str, int]
    license_note: str


@lru_cache(maxsize=1)
def load_openngc_catalog(path: str | Path | None = None) -> OpenNgcCatalog:
    catalog_path = Path(path) if path is not None else DEFAULT_OPENNGC_CATALOG_PATH
    payload = _read_json(catalog_path)
    records = payload.get("records") if isinstance(payload.get("records"), list) else []
    records_by_source_id: dict[str, dict[str, Any]] = {}
    records_by_messier_id: dict[str, dict[str, Any]] = {}
    type_counts: dict[str, int] = {}
    search_candidates: list[dict[str, Any]] = []

    for raw in records:
        if not isinstance(raw, dict):
            continue
        source_id = str(raw.get("source_id") or "").strip()
        if not source_id:
            continue
        record = dict(raw)
        records_by_source_id[source_id.upper()] = record
        messier_id = str(record.get("messier_id") or "").strip().upper().replace(" ", "")
        if messier_id:
            records_by_messier_id[messier_id] = record
        object_type = str(record.get("object_type") or "dso")
        type_counts[object_type] = type_counts.get(object_type, 0) + 1
        search_aliases = _search_aliases(record)
        search_candidates.append(
            {
                "result": _to_search_payload(record),
                "aliases": search_aliases,
                "normalized_aliases": [_normalize_search_text(alias) for alias in search_aliases],
            }
        )

    source = payload.get("source") if isinstance(payload.get("source"), dict) else {}
    return OpenNgcCatalog(
        records_by_source_id=records_by_source_id,
        records_by_messier_id=records_by_messier_id,
        search_candidates=search_candidates,
        count=len(records_by_source_id),
        skipped_count=int(payload.get("skipped_count") or 0),
        type_counts=dict(sorted(type_counts.items())),
        license_note=str(source.get("license_note") or OPENNGC_LICENSE_NOTE),
    )


def is_openngc_identity(catalog: str | None, model: str | None = None) -> bool:
    if str(catalog or "").strip().lower() not in OPENNGC_CATALOGS:
        return False
    if model is None:
        return True
    return str(model or "").strip().lower() == OPENNGC_MODEL


def lookup_openngc_dso(source_id: str, *, catalog: str | None = None) -> dict[str, Any]:
    normalized_source_id = _normalize_source_id(source_id)
    if not normalized_source_id:
        raise ValueError("invalid OpenNGC source_id")

    loaded = load_openngc_catalog()
    record = loaded.records_by_source_id.get(normalized_source_id)
    if not record:
        raise ValueError("object not found")

    requested_catalog = str(catalog or record["catalog"]).strip()
    if requested_catalog.lower() == "openngc (local)":
        requested_catalog = record["catalog"]
    if requested_catalog.lower() != str(record["catalog"]).lower():
        raise ValueError("object not found")

    return _to_exact_payload(record, catalog=requested_catalog)


def search_openngc_dso(query: str, *, limit: int = 10) -> list[dict[str, Any]]:
    normalized_query = _normalize_search_text(query)
    if not normalized_query:
        return []

    scored: list[tuple[int, dict[str, Any]]] = []
    for candidate in load_openngc_catalog().search_candidates:
        best_score = 0
        for normalized_alias in candidate["normalized_aliases"]:
            if not normalized_alias:
                continue
            if normalized_alias == normalized_query:
                best_score = max(best_score, 3)
            elif normalized_alias.startswith(normalized_query):
                best_score = max(best_score, 2)
            elif len(normalized_query) >= 3 and normalized_query in normalized_alias:
                best_score = max(best_score, 1)
        if best_score > 0:
            scored.append((best_score, candidate["result"]))

    scored.sort(key=lambda item: (-item[0], _magnitude_sort(item[1]), str(item[1].get("display_name") or "")))
    results: list[dict[str, Any]] = []
    seen: set[str] = set()
    for _, result in scored:
        key = f"{result['catalog']}:{result['source_id']}"
        if key in seen:
            continue
        seen.add(key)
        results.append(dict(result))
        if len(results) >= limit:
            break
    return results


def find_openngc_record_by_messier_id(messier_id: str | None) -> dict[str, Any] | None:
    normalized_messier_id = str(messier_id or "").strip().upper().replace(" ", "")
    if not normalized_messier_id:
        return None

    record = load_openngc_catalog().records_by_messier_id.get(normalized_messier_id)
    return dict(record) if record is not None else None


def build_openngc_above_me_seed_records(*, limit: int = 600) -> list[dict[str, Any]]:
    records = list(load_openngc_catalog().records_by_source_id.values())
    records = [
        record
        for record in records
        if record.get("magnitude") is not None
        and str(record.get("object_type") or "") != "dso"
    ]
    records.sort(key=lambda record: (_magnitude_sort(record), _interest_sort(record), str(record.get("display_name") or "")))
    return records[: max(1, limit)]


def _to_exact_payload(record: dict[str, Any], *, catalog: str) -> dict[str, Any]:
    payload = _to_search_payload(record)
    payload["catalog"] = catalog
    payload["message"] = "Resolved from normalized OpenNGC local catalog."
    payload["sky_engine_url"] = build_sky_engine_object_url(
        catalog=payload["catalog"],
        source_id=payload["source_id"],
        model=payload["model"],
        ra=payload["ra"],
        dec=payload["dec"],
        name=payload["display_name"],
        fov=_default_fov(str(payload.get("object_type") or "")),
    )
    return enrich_openngc_payload(payload, record)


def _to_search_payload(record: dict[str, Any]) -> dict[str, Any]:
    magnitude = record.get("magnitude")
    aliases = list(record.get("aliases") or [])
    aliases.extend(caldwell_aliases(record))
    payload = {
        "catalog": record["catalog"],
        "source_id": str(record["source_id"]),
        "display_name": record["display_name"],
        "model": OPENNGC_MODEL,
        "names": list(record.get("names") or []),
        "types": list(record.get("types") or ["dso"]),
        "ra": float(record["ra"]),
        "dec": float(record["dec"]),
        "phot_g_mean_mag": magnitude,
        "magnitude": magnitude,
        "object_type": record.get("object_type"),
        "raw_type": record.get("raw_type"),
        "constellation": record.get("constellation"),
        "angular_size": record.get("angular_size"),
        "messier_id": record.get("messier_id"),
        "identifiers": list(record.get("identifiers") or []),
        "aliases": list(dict.fromkeys(alias for alias in aliases if alias)),
        "common_names": list(record.get("common_names") or []),
        "indexed": True,
        "status": "indexed",
        "provenance": dict(record.get("provenance") or {"source_key": "openngc_local"}),
    }
    return payload


def _search_aliases(record: dict[str, Any]) -> list[str]:
    aliases = list(record.get("aliases") or [])
    aliases.extend(caldwell_aliases(record))
    aliases.extend(record.get("names") or [])
    aliases.append(record.get("display_name"))
    aliases.append(_spaced_catalog_id(str(record.get("source_id") or "")))
    return [alias for alias in aliases if str(alias or "").strip()]


def _read_json(path: Path) -> dict[str, Any]:
    if path.suffix == ".gz":
        with gzip.open(path, "rt", encoding="utf-8") as handle:
            return json.load(handle)
    return json.loads(path.read_text(encoding="utf-8"))


def _normalize_source_id(value: str | None) -> str:
    text = str(value or "").strip().upper()
    text = re.sub(r"^(NGC|IC)\s+(\d+)(.*)$", lambda m: f"{m.group(1)}{int(m.group(2)):04d}{m.group(3)}", text)
    text = re.sub(r"\s+", " ", text)
    return text


def _normalize_search_text(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def _spaced_catalog_id(source_id: str) -> str:
    match = re.match(r"^(NGC|IC)(\d+)(.*)$", source_id)
    if not match:
        return source_id
    suffix = match.group(3).strip()
    spaced = f"{match.group(1)} {int(match.group(2))}"
    return f"{spaced} {suffix}" if suffix else spaced


def _magnitude_sort(record: dict[str, Any]) -> float:
    value = record.get("magnitude") or record.get("phot_g_mean_mag")
    return float(value) if value is not None else 99.0


def _interest_sort(record: dict[str, Any]) -> int:
    if record.get("messier_id"):
        return 0
    if record.get("common_names"):
        return 1
    return 2


def _default_fov(object_type: str) -> float:
    if object_type == "galaxy":
        return 3.25
    if object_type in {"nebula", "planetary_nebula", "supernova_remnant", "dark_nebula"}:
        return 2.5
    if object_type in {"open_cluster", "globular_cluster"}:
        return 3.0
    return 2.5

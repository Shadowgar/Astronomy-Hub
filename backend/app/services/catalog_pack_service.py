from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import hashlib
import json
import math
import os
from pathlib import Path
import re
from typing import Any

from backend.app.services.sky_engine_links import build_sky_engine_object_url


REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_CATALOG_PACKS_DIR = REPO_ROOT / "data/runtime-packs/catalog-packs"


@dataclass(frozen=True)
class CatalogPackIndex:
    mounted: bool
    release_version: str | None
    generated_at: str | None
    object_count: int
    records_by_identity: dict[tuple[str, str, str], dict[str, Any]]
    search_candidates: tuple[dict[str, Any], ...]
    search_alias_index: dict[str, tuple[dict[str, Any], ...]]
    pack_statuses: tuple[dict[str, Any], ...]


def load_catalog_pack_index(path: str | Path | None = None) -> CatalogPackIndex:
    root = Path(path) if path is not None else Path(
        os.getenv("ORAS_CATALOG_PACKS_DIR", str(DEFAULT_CATALOG_PACKS_DIR))
    )
    manifest_path = root / "manifest.json"
    if not manifest_path.is_file():
        return CatalogPackIndex(False, None, None, 0, {}, (), {}, ())
    return _load_catalog_pack_index_cached(str(root.resolve()), _catalog_pack_fingerprint(root, manifest_path))


def build_catalog_pack_status_payload(path: str | Path | None = None) -> dict[str, Any]:
    index = load_catalog_pack_index(path)
    return {
        "status": "ok",
        "data": {
            "mounted": index.mounted,
            "release_version": index.release_version,
            "generated_at": index.generated_at,
            "object_count": index.object_count,
            "packs": [dict(pack) for pack in index.pack_statuses],
        },
        "meta": {},
    }


def search_catalog_packs(
    query: str,
    *,
    limit: int = 10,
    path: str | Path | None = None,
) -> list[dict[str, Any]]:
    normalized_query = _normalize_search_text(query)
    if not normalized_query or limit < 1:
        return []

    index = load_catalog_pack_index(path)
    scored: list[tuple[int, dict[str, Any]]] = []
    seen: set[tuple[str, str, str]] = set()

    def add_matches(records: tuple[dict[str, Any], ...], score: int) -> None:
        for record in records:
            identity = _identity_key(record["catalog"], record["source_id"], record["model"])
            if identity in seen:
                continue
            seen.add(identity)
            scored.append((score, record))

    add_matches(index.search_alias_index.get(normalized_query, ()), 4)
    if len(scored) < limit:
        for alias, records in index.search_alias_index.items():
            if alias != normalized_query and alias.startswith(normalized_query):
                add_matches(records, 3)
                if len(scored) >= limit * 4:
                    break
    if len(scored) < limit and len(normalized_query) >= 3:
        for alias, records in index.search_alias_index.items():
            if normalized_query in alias and not alias.startswith(normalized_query):
                add_matches(records, 2)
                if len(scored) >= limit * 4:
                    break

    scored.sort(
        key=lambda item: (
            -item[0],
            _magnitude_sort(item[1]),
            str(item[1].get("display_name") or ""),
        )
    )
    return [_to_api_payload(record) for _, record in scored[:limit]]


def lookup_catalog_pack_object(
    catalog: str,
    source_id: str,
    model: str,
    *,
    path: str | Path | None = None,
) -> dict[str, Any]:
    identity = _identity_key(catalog, source_id, model)
    record = load_catalog_pack_index(path).records_by_identity.get(identity)
    if record is None:
        raise ValueError("object not found")
    return _to_api_payload(record, exact=True)


@lru_cache(maxsize=8)
def _load_catalog_pack_index_cached(
    root_value: str,
    fingerprint: tuple[tuple[str, int, int], ...],
) -> CatalogPackIndex:
    del fingerprint
    root = Path(root_value)
    manifest_path = root / "manifest.json"
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return CatalogPackIndex(
            True,
            None,
            None,
            0,
            {},
            (),
            {},
            ({"pack_id": "manifest", "status": "failed", "error": str(error)},),
        )

    records_by_identity: dict[tuple[str, str, str], dict[str, Any]] = {}
    search_candidates: list[dict[str, Any]] = []
    search_alias_index: dict[str, list[dict[str, Any]]] = {}
    pack_statuses: list[dict[str, Any]] = []
    for pack in manifest.get("packs") or []:
        status, records = _load_pack(root, pack)
        pack_statuses.append(status)
        if status["status"] != "loaded":
            continue
        pack_identities = [
            _identity_key(record["catalog"], record["source_id"], record["model"])
            for record in records
        ]
        if len(set(pack_identities)) != len(pack_identities) or any(
            identity in records_by_identity for identity in pack_identities
        ):
            status["status"] = "failed"
            status["error"] = "duplicate catalog identity"
            status["loaded_object_count"] = 0
            continue
        for record in records:
            identity = _identity_key(record["catalog"], record["source_id"], record["model"])
            records_by_identity[identity] = record
            search_candidates.append(
                {
                    "record": record,
                    "normalized_aliases": tuple(
                        _normalize_search_text(alias) for alias in _record_aliases(record)
                    ),
                }
            )
            for alias in _record_aliases(record):
                normalized_alias = _normalize_search_text(alias)
                if normalized_alias:
                    search_alias_index.setdefault(normalized_alias, []).append(record)

    return CatalogPackIndex(
        mounted=True,
        release_version=str(manifest.get("release_version") or "") or None,
        generated_at=str(manifest.get("generated_at") or "") or None,
        object_count=len(records_by_identity),
        records_by_identity=records_by_identity,
        search_candidates=tuple(search_candidates),
        search_alias_index={alias: tuple(records) for alias, records in search_alias_index.items()},
        pack_statuses=tuple(pack_statuses),
    )


def _load_pack(root: Path, raw_pack: Any) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    if not isinstance(raw_pack, dict):
        return {"pack_id": "unknown", "status": "failed", "error": "invalid pack entry"}, []
    pack_id = str(raw_pack.get("pack_id") or "unknown")
    status = {
        "pack_id": pack_id,
        "label": raw_pack.get("label"),
        "category": raw_pack.get("category"),
        "version": raw_pack.get("version"),
        "generated_at": raw_pack.get("generated_at"),
        "declared_object_count": raw_pack.get("object_count"),
        "loaded_object_count": 0,
        "sources": raw_pack.get("sources") if isinstance(raw_pack.get("sources"), list) else [],
        "status": "loaded",
        "error": None,
    }
    try:
        records: list[dict[str, Any]] = []
        for chunk in raw_pack.get("chunks") or []:
            records.extend(_load_chunk(root, raw_pack, chunk))
        if len(records) != raw_pack.get("object_count"):
            raise ValueError("object count mismatch")
        status["loaded_object_count"] = len(records)
        return status, records
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
        status["status"] = "failed"
        status["error"] = str(error)
        status["loaded_object_count"] = 0
        return status, []


def _load_chunk(root: Path, pack: dict[str, Any], chunk: Any) -> list[dict[str, Any]]:
    if not isinstance(chunk, dict):
        raise ValueError("invalid chunk entry")
    relative_path = Path(str(chunk.get("path") or ""))
    if relative_path.is_absolute() or ".." in relative_path.parts:
        raise ValueError("unsafe chunk path")
    root_path = root.resolve()
    chunk_path = (root / relative_path).resolve()
    if not chunk_path.is_relative_to(root_path):
        raise ValueError("unsafe chunk path")
    payload = chunk_path.read_bytes()
    if hashlib.sha256(payload).hexdigest() != chunk.get("sha256"):
        suffix = " and byte size mismatch" if len(payload) != chunk.get("byte_size") else ""
        raise ValueError(f"checksum mismatch{suffix}")
    if len(payload) != chunk.get("byte_size"):
        raise ValueError("byte size mismatch")

    records = [json.loads(line) for line in payload.decode("utf-8").splitlines() if line.strip()]
    if len(records) != chunk.get("object_count"):
        raise ValueError("chunk object count mismatch")
    return [
        _validate_runtime_record(
            record,
            pack_id=str(pack["pack_id"]),
            pack_version=str(pack["version"]),
            pack_sources=pack.get("sources") or [],
        )
        for record in records
    ]


def _validate_runtime_record(
    raw_record: Any,
    *,
    pack_id: str,
    pack_version: str,
    pack_sources: list[dict[str, Any]],
) -> dict[str, Any]:
    if not isinstance(raw_record, dict):
        raise ValueError("catalog record must be an object")
    required = ("catalog", "source_id", "model", "display_name", "category")
    if any(not isinstance(raw_record.get(field), str) or not raw_record[field].strip() for field in required):
        raise ValueError("catalog record identity fields must be non-empty strings")
    if not isinstance(raw_record.get("source_attribution"), list) or not raw_record["source_attribution"]:
        raise ValueError("catalog record source_attribution is required")
    ra = _finite_coordinate(raw_record.get("ra"), "ra")
    dec = _finite_coordinate(raw_record.get("dec"), "dec")
    if not 0 <= ra < 360 or not -90 <= dec <= 90:
        raise ValueError("catalog record coordinates are out of range")
    record = dict(raw_record)
    record.update(
        {
            "source_id": str(raw_record["source_id"]),
            "ra": ra,
            "dec": dec,
            "pack_id": pack_id,
            "pack_version": pack_version,
            "pack_sources": [dict(source) for source in pack_sources if isinstance(source, dict)],
        }
    )
    return record


def _to_api_payload(record: dict[str, Any], *, exact: bool = False) -> dict[str, Any]:
    payload = dict(record)
    payload.update(
        {
            "names": _unique_strings(
                [record.get("display_name"), *(record.get("names") or []), *(record.get("aliases") or [])]
            ),
            "types": list(record.get("types") or [_default_type(record)]),
            "indexed": True,
            "status": "indexed",
            "provenance": {
                "source_key": "oras_catalog_pack",
                "pack_id": record["pack_id"],
                "pack_version": record["pack_version"],
            },
        }
    )
    if record.get("magnitude") is not None:
        payload.setdefault("phot_g_mean_mag", record["magnitude"])
    if exact:
        payload["message"] = f"Resolved from mounted ORAS catalog pack {record['pack_id']}."
    payload["sky_engine_url"] = build_sky_engine_object_url(
        catalog=payload["catalog"],
        source_id=payload["source_id"],
        model=payload["model"],
        ra=payload["ra"],
        dec=payload["dec"],
        name=payload["display_name"],
        fov=2.5,
    )
    return payload


def _record_aliases(record: dict[str, Any]) -> list[str]:
    return _unique_strings(
        [
            record.get("display_name"),
            record.get("source_id"),
            f"{record.get('catalog')} {record.get('source_id')}",
            *(record.get("names") or []),
            *(record.get("aliases") or []),
            *(record.get("common_names") or []),
            *(record.get("catalog_ids") or []),
        ]
    )


def _identity_key(catalog: str, source_id: str, model: str) -> tuple[str, str, str]:
    return (
        str(catalog or "").strip().casefold(),
        str(source_id or "").strip().casefold(),
        str(model or "").strip().casefold(),
    )


def _normalize_search_text(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").casefold())


def _unique_strings(values: list[Any]) -> list[str]:
    result: list[str] = []
    for value in values:
        text = str(value or "").strip()
        if text and text not in result:
            result.append(text)
    return result


def _finite_coordinate(value: Any, field: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"catalog record {field} must be finite") from error
    if not math.isfinite(number):
        raise ValueError(f"catalog record {field} must be finite")
    return number


def _magnitude_sort(record: dict[str, Any]) -> float:
    value = record.get("magnitude")
    try:
        return float(value) if value is not None else 99.0
    except (TypeError, ValueError):
        return 99.0


def _default_type(record: dict[str, Any]) -> str:
    return "*" if str(record.get("model") or "").casefold() == "star" else "G"


def _catalog_pack_fingerprint(root: Path, manifest_path: Path) -> tuple[tuple[str, int, int], ...]:
    entries: list[tuple[str, int, int]] = []
    try:
        manifest_stat = manifest_path.stat()
        entries.append(("manifest.json", manifest_stat.st_mtime_ns, manifest_stat.st_size))
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return tuple(entries)

    for pack in manifest.get("packs") or []:
        if not isinstance(pack, dict):
            continue
        for chunk in pack.get("chunks") or []:
            if not isinstance(chunk, dict):
                continue
            relative_path = Path(str(chunk.get("path") or ""))
            if relative_path.is_absolute() or ".." in relative_path.parts:
                entries.append((relative_path.as_posix(), -1, -1))
                continue
            try:
                chunk_path = (root / relative_path).resolve()
                if not chunk_path.is_relative_to(root.resolve()):
                    entries.append((relative_path.as_posix(), -1, -1))
                    continue
                stat = chunk_path.stat()
                entries.append((relative_path.as_posix(), stat.st_mtime_ns, stat.st_size))
            except OSError:
                entries.append((relative_path.as_posix(), -1, -1))
    return tuple(entries)

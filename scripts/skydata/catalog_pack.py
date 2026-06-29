from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
from typing import Any, Iterable, Sequence


PACK_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
REQUIRED_TEXT_FIELDS = ("catalog", "model", "display_name", "category")
STRING_LIST_FIELDS = ("names", "aliases", "common_names", "types", "catalog_ids")
OPTIONAL_FIELDS = (
    "object_type",
    "magnitude",
    "magnitude_band",
    "color_index",
    "spectral_type",
    "parallax",
    "distance_pc",
    "proper_motion_ra",
    "proper_motion_dec",
    "radial_velocity_km_s",
    "temperature_k",
    "mass_solar",
    "radius_solar",
    "variability",
    "angular_size",
    "double_star",
    "period_seconds",
    "redshift",
    "flux",
    "candidate_status",
    "description",
    "render_hint",
)


@dataclass(frozen=True)
class CatalogPackSpec:
    pack_id: str
    label: str
    category: str
    version: str
    sources: tuple[dict[str, Any], ...]
    overlay_limit: int = 0
    load_mode: str = "browser-index"


def build_catalog_release(
    output_root: str | Path,
    *,
    release_version: str,
    packs: Sequence[tuple[CatalogPackSpec, Iterable[dict[str, Any]]]],
    generated_at: str | None = None,
    chunk_size: int = 2_000,
) -> dict[str, Any]:
    root = Path(output_root)
    if chunk_size < 1:
        raise ValueError("chunk_size must be positive")
    release_version = _required_text(release_version, "release_version")
    generated_at = generated_at or _utc_now()
    _validate_generated_at(generated_at)
    root.mkdir(parents=True, exist_ok=True)

    manifest_packs: list[dict[str, Any]] = []
    release_identities: set[tuple[str, str, str]] = set()
    pack_ids: set[str] = set()

    for spec, records in packs:
        if spec.pack_id in pack_ids:
            raise ValueError(f"duplicate pack_id: {spec.pack_id}")
        pack_ids.add(spec.pack_id)
        normalized = _normalize_pack(spec, records, release_identities)
        manifest_packs.append(
            _write_pack(root, spec, normalized, generated_at=generated_at, chunk_size=chunk_size)
        )

    manifest = {
        "schema_version": 1,
        "release_version": release_version,
        "generated_at": generated_at,
        "pack_count": len(manifest_packs),
        "object_count": sum(pack["object_count"] for pack in manifest_packs),
        "packs": manifest_packs,
    }
    _write_json(root / "manifest.json", manifest)
    return manifest


def validate_catalog_release(output_root: str | Path) -> list[str]:
    root = Path(output_root)
    manifest_path = root / "manifest.json"
    if not manifest_path.is_file():
        return ["manifest.json is missing"]

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"manifest.json is invalid: {error}"]

    errors: list[str] = []
    if manifest.get("schema_version") != 1:
        errors.append("unsupported manifest schema_version")
    packs = manifest.get("packs")
    if not isinstance(packs, list):
        return [*errors, "manifest packs must be a list"]

    manifest_total = 0
    seen_identities: set[tuple[str, str, str]] = set()
    for pack in packs:
        if not isinstance(pack, dict):
            errors.append("pack manifest entry must be an object")
            continue
        pack_id = str(pack.get("pack_id") or "unknown")
        chunks = pack.get("chunks")
        if not isinstance(chunks, list):
            errors.append(f"{pack_id}: chunks must be a list")
            continue
        pack_total = 0
        for chunk in chunks:
            chunk_errors, chunk_count = _validate_chunk(
                root,
                pack_id,
                str(pack.get("category") or ""),
                chunk,
                seen_identities,
            )
            errors.extend(chunk_errors)
            pack_total += chunk_count
        manifest_total += pack_total
        if pack_total != pack.get("object_count"):
            errors.append(f"{pack_id}: object count mismatch")
        if pack.get("browser_index_count") != pack.get("object_count"):
            errors.append(f"{pack_id}: browser index count mismatch")

    if manifest_total != manifest.get("object_count"):
        errors.append("release object count mismatch")
    if len(packs) != manifest.get("pack_count"):
        errors.append("release pack count mismatch")
    return errors


def _normalize_pack(
    spec: CatalogPackSpec,
    records: Iterable[dict[str, Any]],
    release_identities: set[tuple[str, str, str]],
) -> list[dict[str, Any]]:
    _validate_spec(spec)
    normalized: list[dict[str, Any]] = []
    for raw_record in records:
        record = _normalize_record(raw_record, expected_category=spec.category)
        identity = (record["catalog"], record["source_id"], record["model"])
        if identity in release_identities:
            raise ValueError(f"duplicate catalog identity: {identity}")
        release_identities.add(identity)
        normalized.append(record)
    normalized.sort(key=lambda record: (record["catalog"], record["source_id"], record["model"]))
    return normalized


def _normalize_record(raw_record: Any, *, expected_category: str) -> dict[str, Any]:
    if not isinstance(raw_record, dict):
        raise ValueError("catalog record must be an object")
    if not isinstance(raw_record.get("source_id"), str):
        raise ValueError("source_id must be a string")

    record: dict[str, Any] = {
        field: _required_text(raw_record.get(field), f"{field} is required")
        for field in REQUIRED_TEXT_FIELDS
    }
    record["source_id"] = _required_text(raw_record["source_id"], "source_id is required")
    if record["category"] != expected_category:
        raise ValueError(f"record category must be {expected_category}")

    record["ra"] = _finite_number(raw_record.get("ra"), "finite ra is required")
    record["dec"] = _finite_number(raw_record.get("dec"), "finite dec is required")
    if not 0 <= record["ra"] < 360:
        raise ValueError("ra must be between 0 and 360 degrees")
    if not -90 <= record["dec"] <= 90:
        raise ValueError("dec must be between -90 and 90 degrees")

    attribution = raw_record.get("source_attribution")
    if not isinstance(attribution, list) or not attribution:
        raise ValueError("source_attribution must contain at least one source")
    record["source_attribution"] = [_normalize_source(source) for source in attribution]

    for field in STRING_LIST_FIELDS:
        values = raw_record.get(field)
        if values is not None:
            record[field] = _unique_strings(values, field)
    for field in OPTIONAL_FIELDS:
        value = raw_record.get(field)
        if value is not None:
            record[field] = value

    # Reject NaN/Infinity and non-serializable values before writing chunks.
    json.dumps(record, allow_nan=False)
    return record


def _normalize_source(raw_source: Any) -> dict[str, Any]:
    if not isinstance(raw_source, dict):
        raise ValueError("source_attribution entries must be objects")
    source = {
        "name": _required_text(raw_source.get("name"), "source attribution name is required"),
        "source_key": _required_text(raw_source.get("source_key"), "source attribution key is required"),
        "license_note": _required_text(raw_source.get("license_note"), "source license_note is required"),
    }
    for field in ("source_url", "version"):
        value = str(raw_source.get(field) or "").strip()
        if value:
            source[field] = value
    return source


def _write_pack(
    root: Path,
    spec: CatalogPackSpec,
    records: list[dict[str, Any]],
    *,
    generated_at: str,
    chunk_size: int,
) -> dict[str, Any]:
    pack_root = root / "packs" / spec.pack_id
    pack_root.mkdir(parents=True, exist_ok=True)
    for stale_chunk in pack_root.glob("chunk-*.jsonl"):
        stale_chunk.unlink()

    chunks: list[dict[str, Any]] = []
    for offset in range(0, len(records), chunk_size):
        chunk_records = records[offset:offset + chunk_size]
        chunk_name = f"chunk-{len(chunks):05d}.jsonl"
        relative_path = Path("packs") / spec.pack_id / chunk_name
        chunk_path = root / relative_path
        payload = "".join(
            json.dumps(record, ensure_ascii=True, sort_keys=True, allow_nan=False) + "\n"
            for record in chunk_records
        ).encode("utf-8")
        chunk_path.write_bytes(payload)
        chunks.append(
            {
                "path": relative_path.as_posix(),
                "object_count": len(chunk_records),
                "byte_size": len(payload),
                "sha256": hashlib.sha256(payload).hexdigest(),
            }
        )

    return {
        "pack_id": spec.pack_id,
        "label": spec.label,
        "category": spec.category,
        "version": spec.version,
        "generated_at": generated_at,
        "load_mode": spec.load_mode,
        "overlay_limit": spec.overlay_limit,
        "object_count": len(records),
        "browser_index_count": len(records),
        "sources": [dict(source) for source in spec.sources],
        "chunks": chunks,
    }


def _validate_chunk(
    root: Path,
    pack_id: str,
    category: str,
    chunk: Any,
    seen_identities: set[tuple[str, str, str]],
) -> tuple[list[str], int]:
    if not isinstance(chunk, dict):
        return [f"{pack_id}: chunk entry must be an object"], 0
    relative_path = Path(str(chunk.get("path") or ""))
    if relative_path.is_absolute() or ".." in relative_path.parts:
        return [f"{pack_id}: unsafe chunk path"], 0
    chunk_path = root / relative_path
    if not chunk_path.is_file():
        return [f"{pack_id}: missing chunk {relative_path.as_posix()}"], 0

    errors: list[str] = []
    try:
        payload = chunk_path.read_bytes()
    except OSError as error:
        return [f"{pack_id}: cannot read chunk {relative_path.as_posix()}: {error}"], 0

    if len(payload) != chunk.get("byte_size"):
        errors.append(f"{pack_id}: byte size mismatch for {relative_path.as_posix()}")
    if hashlib.sha256(payload).hexdigest() != chunk.get("sha256"):
        errors.append(f"{pack_id}: checksum mismatch for {relative_path.as_posix()}")

    count = 0
    try:
        lines = payload.decode("utf-8").splitlines()
    except UnicodeDecodeError as error:
        return [*errors, f"{pack_id}: chunk {relative_path.as_posix()} is not UTF-8: {error}"], 0

    for line_number, line in enumerate(lines, start=1):
        try:
            record = _normalize_record(json.loads(line), expected_category=category)
        except (ValueError, json.JSONDecodeError) as error:
            errors.append(f"{pack_id}: invalid record at line {line_number}: {error}")
            continue
        identity = (record["catalog"], record["source_id"], record["model"])
        if identity in seen_identities:
            errors.append(f"{pack_id}: duplicate catalog identity {identity}")
        seen_identities.add(identity)
        count += 1
    if count != chunk.get("object_count"):
        errors.append(f"{pack_id}: chunk object count mismatch for {relative_path.as_posix()}")
    return errors, count


def _validate_spec(spec: CatalogPackSpec) -> None:
    if not PACK_ID_RE.fullmatch(spec.pack_id):
        raise ValueError("pack_id must be lowercase kebab-case")
    _required_text(spec.label, "pack label is required")
    _required_text(spec.category, "pack category is required")
    _required_text(spec.version, "pack version is required")
    if spec.overlay_limit < 0:
        raise ValueError("overlay_limit cannot be negative")
    if not spec.sources:
        raise ValueError("pack sources are required")
    for source in spec.sources:
        _normalize_source(source)


def _required_text(value: Any, message: str) -> str:
    text = str(value or "").strip()
    if not text:
        raise ValueError(message)
    return text


def _finite_number(value: Any, message: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(message) from error
    if not math.isfinite(number):
        raise ValueError(message)
    return number


def _unique_strings(values: Any, field: str) -> list[str]:
    if not isinstance(values, list):
        raise ValueError(f"{field} must be a list")
    result: list[str] = []
    for value in values:
        text = str(value or "").strip()
        if text and text not in result:
            result.append(text)
    return result


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=True, sort_keys=True, allow_nan=False) + "\n",
        encoding="utf-8",
    )


def _validate_generated_at(value: str) -> None:
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError("generated_at must be an ISO-8601 timestamp") from error


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

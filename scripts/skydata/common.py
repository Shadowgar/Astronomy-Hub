#!/usr/bin/env python3

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_ROOT = REPO_ROOT / "data/sky-engine/oras-mirror"
RUNTIME_SKYDATA_ROOT = REPO_ROOT / "frontend/public/oras-sky-engine/skydata"
DEFAULT_LARGE_DOWNLOAD_THRESHOLD_BYTES = 100 * 1024 * 1024
DEFAULT_MAX_SOURCE_BYTES = 2 * 1024 * 1024 * 1024

ALLOWED_SOURCE_CLASSES = {
    "gaia_source_catalog",
    "gaia_star_tiles",
    "hips_surveys",
    "milkyway_survey",
    "sso_surveys",
    "dso_catalog",
    "satellite_gp",
    "tle_snapshot",
    "comet_elements",
    "minor_planets",
    "flight_data",
}


class ManifestError(ValueError):
    pass


class RuntimeProtectionError(PermissionError):
    pass


class SizeLimitError(ValueError):
    pass


class ChecksumMismatchError(ValueError):
    pass


@dataclass(frozen=True)
class SourceEntry:
    id: str
    source_class: str
    url: str
    relative_path: str
    enabled: bool
    expected_size_bytes: int | None
    expected_sha256: str | None
    max_bytes: int
    license_note: str
    mirrorability: str
    notes: str


def load_manifest(manifest_path: str | Path) -> dict[str, Any]:
    path = Path(manifest_path)
    with path.open("r", encoding="utf-8") as handle:
        raw_manifest = json.load(handle)
    return normalize_manifest(raw_manifest)


def normalize_manifest(raw_manifest: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(raw_manifest, dict):
        raise ManifestError("Manifest root must be a JSON object")

    manifest_version = raw_manifest.get("manifest_version")
    if manifest_version != 1:
        raise ManifestError("Only manifest_version=1 is supported")

    defaults_raw = raw_manifest.get("defaults", {})
    if not isinstance(defaults_raw, dict):
        raise ManifestError("Manifest defaults must be an object")

    output_root_value = defaults_raw.get("output_root", str(DEFAULT_OUTPUT_ROOT.relative_to(REPO_ROOT)))
    output_root = _resolve_repo_path(output_root_value)
    defaults = {
        "output_root": str(output_root),
        "large_download_threshold_bytes": _normalize_optional_int(
            defaults_raw.get("large_download_threshold_bytes"),
            "defaults.large_download_threshold_bytes",
            DEFAULT_LARGE_DOWNLOAD_THRESHOLD_BYTES,
        ),
        "max_source_bytes": _normalize_optional_int(
            defaults_raw.get("max_source_bytes"),
            "defaults.max_source_bytes",
            DEFAULT_MAX_SOURCE_BYTES,
        ),
    }

    sources_raw = raw_manifest.get("sources")
    if not isinstance(sources_raw, list) or not sources_raw:
        raise ManifestError("Manifest sources must be a non-empty array")

    source_ids: set[str] = set()
    sources: list[dict[str, Any]] = []
    for index, source_raw in enumerate(sources_raw):
        prefix = f"sources[{index}]"
        if not isinstance(source_raw, dict):
            raise ManifestError(f"{prefix} must be an object")

        source_id = _require_string(source_raw.get("id"), f"{prefix}.id")
        if source_id in source_ids:
            raise ManifestError(f"Duplicate source id: {source_id}")
        source_ids.add(source_id)

        source_class = _require_string(source_raw.get("source_class"), f"{prefix}.source_class")
        if source_class not in ALLOWED_SOURCE_CLASSES:
            raise ManifestError(f"Unsupported source_class: {source_class}")

        url = _require_string(source_raw.get("url"), f"{prefix}.url")
        relative_path = _require_string(source_raw.get("relative_path"), f"{prefix}.relative_path")
        enabled = bool(source_raw.get("enabled", False))
        expected_size_bytes = _normalize_optional_int(source_raw.get("expected_size_bytes"), f"{prefix}.expected_size_bytes")
        expected_sha256 = _normalize_optional_string(source_raw.get("expected_sha256"), f"{prefix}.expected_sha256")
        max_bytes = _normalize_optional_int(
            source_raw.get("max_bytes"),
            f"{prefix}.max_bytes",
            defaults["max_source_bytes"],
        )
        license_note = _normalize_optional_string(source_raw.get("license_note"), f"{prefix}.license_note") or "needs review"
        mirrorability = _normalize_optional_string(source_raw.get("mirrorability"), f"{prefix}.mirrorability") or "unknown"
        notes = _normalize_optional_string(source_raw.get("notes"), f"{prefix}.notes") or ""

        sources.append(
            {
                "id": source_id,
                "source_class": source_class,
                "url": url,
                "relative_path": relative_path,
                "enabled": enabled,
                "expected_size_bytes": expected_size_bytes,
                "expected_sha256": expected_sha256,
                "max_bytes": max_bytes,
                "license_note": license_note,
                "mirrorability": mirrorability,
                "notes": notes,
            }
        )

    name = raw_manifest.get("name") or "skydata-manifest"
    if not isinstance(name, str) or not name.strip():
        raise ManifestError("Manifest name must be a non-empty string")

    return {
        "manifest_version": 1,
        "name": name.strip(),
        "defaults": defaults,
        "sources": sources,
    }


def source_entries(manifest: dict[str, Any]) -> list[SourceEntry]:
    return [SourceEntry(**source) for source in manifest["sources"]]


def enabled_sources(manifest: dict[str, Any]) -> list[SourceEntry]:
    return [source for source in source_entries(manifest) if source.enabled]


def resolve_output_root(path_value: str | Path) -> Path:
    return _resolve_repo_path(path_value)


def resolve_destination(output_root: str | Path, relative_path: str) -> Path:
    root = resolve_output_root(output_root)
    destination = (root / relative_path).resolve()
    if not destination.is_relative_to(root):
        raise ManifestError(f"Destination escapes output root: {relative_path}")
    return destination


def is_runtime_path(path: str | Path) -> bool:
    return Path(path).resolve().is_relative_to(RUNTIME_SKYDATA_ROOT)


def sha256_file(path: str | Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(path: str | Path, payload: dict[str, Any]) -> Path:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")
    return output_path


def build_report_path(output_root: str | Path, manifest_name: str) -> Path:
    safe_name = "".join(char.lower() if char.isalnum() else "-" for char in manifest_name).strip("-")
    if not safe_name:
        safe_name = "skydata-manifest"
    return resolve_output_root(output_root) / "reports" / f"{safe_name}.download-report.json"


def _resolve_repo_path(path_value: str | Path) -> Path:
    path = Path(path_value)
    if not path.is_absolute():
        path = (REPO_ROOT / path).resolve()
    return path.resolve()


def _require_string(value: Any, field_name: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ManifestError(f"{field_name} must be a non-empty string")
    return value.strip()


def _normalize_optional_string(value: Any, field_name: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ManifestError(f"{field_name} must be a string or null")
    value = value.strip()
    return value or None


def _normalize_optional_int(value: Any, field_name: str, default: int | None = None) -> int | None:
    if value is None:
        return default
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ManifestError(f"{field_name} must be a non-negative integer or null")
    return value
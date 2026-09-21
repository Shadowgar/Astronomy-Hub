#!/usr/bin/env python3
"""Fail-closed compatibility checks for catalog and native star releases."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


CATALOG_TILE_ORDER_FIELD = "native_star_tile_order"
DENSE_TILE_ORDER_FIELD = "tile_order"


def require_tile_order(manifest: dict[str, Any], field: str, label: str) -> int:
    value = manifest.get(field)
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= 8:
        raise ValueError(f"{label} {field} must be an integer between 0 and 8")
    return value


def read_manifest(root: str | Path, label: str) -> dict[str, Any]:
    path = Path(root) / "manifest.json"
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"{label} manifest is unavailable or invalid: {path}: {error}") from error
    if not isinstance(manifest, dict):
        raise ValueError(f"{label} manifest must be an object: {path}")
    return manifest


def validate_catalog_build_order(catalog_root: str | Path, dense_tile_order: int) -> int:
    dense_order = require_tile_order(
        {DENSE_TILE_ORDER_FIELD: dense_tile_order},
        DENSE_TILE_ORDER_FIELD,
        "dense-star release",
    )
    catalog_order = require_tile_order(
        read_manifest(catalog_root, "catalog release"),
        CATALOG_TILE_ORDER_FIELD,
        "catalog release",
    )
    if catalog_order != dense_order:
        raise ValueError(
            "native star tile order mismatch: "
            f"catalog={catalog_order} dense={dense_order}"
        )
    return catalog_order


def validate_release_pair(
    catalog_root: str | Path,
    dense_root: str | Path,
) -> dict[str, int | str]:
    catalog_root = Path(catalog_root)
    catalog_order = require_tile_order(
        read_manifest(catalog_root, "catalog release"),
        CATALOG_TILE_ORDER_FIELD,
        "catalog release",
    )
    dense_manifest = read_manifest(dense_root, "dense-star release")
    dense_order = require_tile_order(
        dense_manifest,
        DENSE_TILE_ORDER_FIELD,
        "dense-star release",
    )
    if catalog_order != dense_order:
        raise ValueError(
            "native star tile order mismatch: "
            f"catalog={catalog_order} dense={dense_order}"
        )
    expected_digest = dense_manifest.get("source_manifest_sha256")
    if not isinstance(expected_digest, str) or len(expected_digest) != 64:
        raise ValueError(
            "dense-star release source_manifest_sha256 must be a SHA-256 digest"
        )
    catalog_digest = hashlib.sha256(
        (catalog_root / "manifest.json").read_bytes()
    ).hexdigest()
    if catalog_digest != expected_digest:
        raise ValueError(
            "catalog manifest digest mismatch: "
            f"catalog={catalog_digest} dense_source={expected_digest}"
        )
    profiles = dense_manifest.get("profiles")
    if not isinstance(profiles, dict) or not profiles:
        raise ValueError("dense-star release must define profiles")
    dense_root = Path(dense_root)
    for profile_id, profile in profiles.items():
        if not isinstance(profile, dict) or profile.get("tile_order") != dense_order:
            raise ValueError(f"dense-star profile tile order mismatch: {profile_id}")
        relative_path = Path(str(profile.get("path") or ""))
        if relative_path.is_absolute() or ".." in relative_path.parts:
            raise ValueError(f"dense-star profile path is unsafe: {profile_id}")
        profile_manifest = read_manifest(
            dense_root / relative_path,
            f"dense-star profile {profile_id}",
        )
        profile_order = require_tile_order(
            profile_manifest,
            DENSE_TILE_ORDER_FIELD,
            f"dense-star profile {profile_id}",
        )
        if profile_order != dense_order:
            raise ValueError(f"dense-star profile actual tile order mismatch: {profile_id}")
    return {
        "catalog_order": catalog_order,
        "dense_order": dense_order,
        "catalog_manifest_sha256": catalog_digest,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("catalog_root", type=Path)
    parser.add_argument("dense_root", type=Path)
    args = parser.parse_args()
    result = validate_release_pair(args.catalog_root, args.dense_root)
    print(
        "Validated native star tile order: "
        f"catalog={result['catalog_order']} dense={result['dense_order']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

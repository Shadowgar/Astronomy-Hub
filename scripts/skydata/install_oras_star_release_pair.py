#!/usr/bin/env python3
"""Atomically install a compatible catalog and dense-star release pair."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
import shutil
import sys
import tempfile


REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scripts.skydata.catalog_pack import validate_catalog_release
from scripts.skydata.promote_runtime_release import promote_release
from scripts.skydata.star_release_compatibility import validate_release_pair
from scripts.skydata.validate_oras_dense_star_tiles import validate_dense_star_tiles


CATALOG_DIR = "catalog-packs"
DENSE_DIR = "dense-star-tiles"


def _reject_symlinks(root: Path, label: str) -> None:
    if root.is_symlink() or any(path.is_symlink() for path in root.rglob("*")):
        raise ValueError(f"{label} release contains symlinks")


def _validate_pair(root: Path) -> None:
    catalog = root / CATALOG_DIR
    dense = root / DENSE_DIR
    catalog_errors = validate_catalog_release(catalog)
    if catalog_errors:
        raise ValueError("catalog release validation failed: " + "; ".join(catalog_errors))
    validate_dense_star_tiles(dense)
    validate_release_pair(catalog, dense)


def install_pair(catalog_source: Path, dense_source: Path, active: Path) -> Path | None:
    catalog_source = Path(catalog_source).resolve()
    dense_source = Path(dense_source).resolve()
    active = Path(active).absolute()
    if not catalog_source.is_dir() or not dense_source.is_dir():
        raise ValueError("catalog and dense-star source releases must be directories")
    if active.is_symlink():
        raise ValueError("refusing symlink pair target")
    for source in (catalog_source, dense_source):
        if active == source or active in source.parents or source in active.parents:
            raise ValueError("pair target and source releases must be disjoint")
    _reject_symlinks(catalog_source, "catalog")
    _reject_symlinks(dense_source, "dense-star")
    catalog_errors = validate_catalog_release(catalog_source)
    if catalog_errors:
        raise ValueError("catalog release validation failed: " + "; ".join(catalog_errors))
    validate_dense_star_tiles(dense_source)
    validate_release_pair(catalog_source, dense_source)

    active.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=f".{active.name}.staging-", dir=active.parent))
    promoted = False
    backup: Path | None = None
    try:
        shutil.copytree(catalog_source, staging / CATALOG_DIR)
        shutil.copytree(dense_source, staging / DENSE_DIR)
        _validate_pair(staging)
        backup = promote_release(staging, active)
        promoted = True
        try:
            _validate_pair(active)
        except Exception:
            if backup is not None and backup.is_dir():
                promote_release(backup, active)
            else:
                quarantine = active.with_name(
                    f"{active.name}.invalid-"
                    + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
                )
                active.rename(quarantine)
            raise
        return backup
    finally:
        if not promoted and staging.exists():
            shutil.rmtree(staging)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("catalog_source", type=Path)
    parser.add_argument("dense_source", type=Path)
    parser.add_argument("active_pair", type=Path)
    args = parser.parse_args()
    backup = install_pair(args.catalog_source, args.dense_source, args.active_pair)
    print(f"Installed compatible star release pair; rollback generation: {backup}")
    print(f"Catalog path: {args.active_pair / CATALOG_DIR}")
    print(f"Dense-star path: {args.active_pair / DENSE_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

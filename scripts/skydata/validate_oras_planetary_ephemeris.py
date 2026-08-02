#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import sys
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.skydata.build_oras_planetary_ephemeris import (
    COVERAGE_END,
    COVERAGE_START,
    DEFAULT_OUTPUT_DIR,
    DEFAULT_SOURCE_URL,
    EXPECTED_BYTE_SIZE,
    EXPECTED_SHA256,
    KERNEL_FILENAME,
    MANIFEST_FILENAME,
)


REQUIRED_FIELDS = {
    "schema_version",
    "release_version",
    "source_key",
    "source_url",
    "kernel_filename",
    "byte_size",
    "sha256",
    "coverage_start",
    "coverage_end",
}


def _parse_utc(value: Any, field: str) -> datetime:
    if not isinstance(value, str) or not value.endswith("Z"):
        raise ValueError(f"planetary ephemeris {field} must be UTC")
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"planetary ephemeris {field} is invalid") from exc


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_release(
    release_dir: Path,
    *,
    validate_kernel: bool = True,
    enforce_official_release: bool = True,
) -> dict[str, Any]:
    manifest_path = release_dir / MANIFEST_FILENAME
    kernel_path = release_dir / KERNEL_FILENAME
    if not manifest_path.is_file() or not kernel_path.is_file():
        raise ValueError("planetary ephemeris release requires manifest.json and de442s.bsp")
    if manifest_path.is_symlink() or kernel_path.is_symlink():
        raise ValueError("planetary ephemeris release files must not be symlinks")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    missing = REQUIRED_FIELDS.difference(manifest)
    if missing:
        raise ValueError(f"planetary ephemeris manifest is missing: {', '.join(sorted(missing))}")
    if manifest["schema_version"] != 1:
        raise ValueError("unsupported planetary ephemeris manifest schema")
    if manifest["source_key"] != "jpl_de442s_local":
        raise ValueError("unexpected planetary ephemeris source key")
    if manifest["source_url"] != DEFAULT_SOURCE_URL:
        raise ValueError("unexpected planetary ephemeris source URL")
    if manifest["kernel_filename"] != KERNEL_FILENAME:
        raise ValueError("unexpected planetary ephemeris kernel filename")

    byte_size = kernel_path.stat().st_size
    if byte_size != manifest["byte_size"]:
        raise ValueError("planetary ephemeris byte size mismatch")
    if _sha256(kernel_path) != manifest["sha256"]:
        raise ValueError("planetary ephemeris checksum mismatch")

    coverage_start = _parse_utc(manifest["coverage_start"], "coverage_start")
    coverage_end = _parse_utc(manifest["coverage_end"], "coverage_end")
    if coverage_start >= coverage_end:
        raise ValueError("planetary ephemeris coverage interval is invalid")
    if enforce_official_release and (
        manifest["byte_size"] != EXPECTED_BYTE_SIZE
        or manifest["sha256"] != EXPECTED_SHA256
        or manifest["coverage_start"] != COVERAGE_START
        or manifest["coverage_end"] != COVERAGE_END
    ):
        raise ValueError("planetary ephemeris does not match the pinned official DE442s release")

    if validate_kernel:
        from skyfield.api import load_file

        kernel = load_file(str(kernel_path))
        try:
            names = kernel.names()
            if 10 not in names or 399 not in names or 301 not in names:
                raise ValueError("planetary ephemeris kernel lacks Sun, Earth, or Moon targets")
        finally:
            kernel.close()
    return manifest


def _main() -> int:
    parser = argparse.ArgumentParser(description="Validate a mounted ORAS DE442s release")
    parser.add_argument("release_dir", type=Path, nargs="?", default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()
    manifest = validate_release(args.release_dir)
    print(json.dumps(manifest, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())

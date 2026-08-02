#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
from typing import Any
import urllib.request
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


DEFAULT_SOURCE_URL = (
    "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de442s.bsp"
)
DEFAULT_OUTPUT_DIR = Path("data/runtime-packs/planetary-ephemeris/release")
KERNEL_FILENAME = "de442s.bsp"
MANIFEST_FILENAME = "manifest.json"
EXPECTED_BYTE_SIZE = 32_701_440
EXPECTED_SHA256 = "54d97562a5b094d298b1b8eafa5a2e17e3e010ce85e1a366d07f003ad159323c"
COVERAGE_START = "1849-12-26T00:00:00Z"
COVERAGE_END = "2150-01-22T00:00:00Z"
DEFAULT_RELEASE_VERSION = "de442s-2025-02-06"


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _atomic_copy(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        dir=destination.parent,
        prefix=f".{destination.name}.",
        delete=False,
    ) as stream:
        temp_path = Path(stream.name)
        with source.open("rb") as source_stream:
            shutil.copyfileobj(source_stream, stream, length=1024 * 1024)
    os.chmod(temp_path, 0o644)
    os.replace(temp_path, destination)


def _atomic_write(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        dir=path.parent,
        prefix=f".{path.name}.",
        delete=False,
    ) as stream:
        stream.write(payload)
        temp_path = Path(stream.name)
    os.chmod(temp_path, 0o644)
    os.replace(temp_path, path)


def _download_source(source_url: str, destination: Path) -> None:
    parsed = urlparse(source_url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("planetary ephemeris source must use HTTP or HTTPS")
    request = urllib.request.Request(
        source_url,
        headers={"User-Agent": "Astronomy-Hub-ORAS-Ephemeris/1.0"},
    )
    destination.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(request, timeout=120) as response:  # noqa: S310
        with destination.open("wb") as stream:
            shutil.copyfileobj(response, stream, length=1024 * 1024)


def build_release_from_file(
    *,
    source_path: Path,
    output_dir: Path,
    release_version: str = DEFAULT_RELEASE_VERSION,
    expected_sha256: str = EXPECTED_SHA256,
    expected_byte_size: int = EXPECTED_BYTE_SIZE,
    coverage_start: str = COVERAGE_START,
    coverage_end: str = COVERAGE_END,
    source_url: str = DEFAULT_SOURCE_URL,
    validate_kernel: bool = True,
) -> dict[str, Any]:
    if not source_path.is_file() or source_path.is_symlink():
        raise ValueError("planetary ephemeris source must be a regular file")

    byte_size = source_path.stat().st_size
    sha256 = _sha256(source_path)
    if byte_size != expected_byte_size:
        raise ValueError(
            f"planetary ephemeris byte size mismatch: {byte_size} != {expected_byte_size}"
        )
    if sha256 != expected_sha256:
        raise ValueError("planetary ephemeris checksum mismatch")

    manifest = {
        "schema_version": 1,
        "release_version": release_version,
        "source_key": "jpl_de442s_local",
        "source_url": source_url,
        "kernel_filename": KERNEL_FILENAME,
        "byte_size": byte_size,
        "sha256": sha256,
        "coverage_start": coverage_start,
        "coverage_end": coverage_end,
        "ephemeris": "DE442s",
        "authority": "NASA/JPL Navigation and Ancillary Information Facility",
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    destination = output_dir / KERNEL_FILENAME
    if source_path.resolve() != destination.resolve():
        _atomic_copy(source_path, destination)

    # Publish the manifest last so readers never observe a new manifest with an
    # incomplete kernel.
    manifest_payload = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode(
        "utf-8"
    )
    _atomic_write(output_dir / MANIFEST_FILENAME, manifest_payload)

    from scripts.skydata.validate_oras_planetary_ephemeris import validate_release

    validate_release(
        output_dir,
        validate_kernel=validate_kernel,
        enforce_official_release=(
            expected_sha256 == EXPECTED_SHA256
            and expected_byte_size == EXPECTED_BYTE_SIZE
            and coverage_start == COVERAGE_START
            and coverage_end == COVERAGE_END
        ),
    )
    return manifest


def build_release(
    *,
    output_dir: Path = DEFAULT_OUTPUT_DIR,
    source_url: str = DEFAULT_SOURCE_URL,
    release_version: str = DEFAULT_RELEASE_VERSION,
) -> dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="oras-de442s-") as temp_dir:
        source_path = Path(temp_dir) / KERNEL_FILENAME
        _download_source(source_url, source_path)
        return build_release_from_file(
            source_path=source_path,
            output_dir=output_dir,
            release_version=release_version,
            source_url=source_url,
        )


def _main() -> int:
    parser = argparse.ArgumentParser(description="Build the mounted ORAS DE442s release")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--source-url", default=DEFAULT_SOURCE_URL)
    parser.add_argument("--release-version", default=DEFAULT_RELEASE_VERSION)
    parser.add_argument("--source-file", type=Path)
    args = parser.parse_args()

    if args.source_file:
        manifest = build_release_from_file(
            source_path=args.source_file,
            output_dir=args.output,
            release_version=args.release_version,
            source_url=args.source_url,
        )
    else:
        manifest = build_release(
            output_dir=args.output,
            source_url=args.source_url,
            release_version=args.release_version,
        )
    print(json.dumps(manifest, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())

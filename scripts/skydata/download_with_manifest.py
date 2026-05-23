#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen

from scripts.skydata.common import (
    ChecksumMismatchError,
    ManifestError,
    RuntimeProtectionError,
    SizeLimitError,
    build_report_path,
    enabled_sources,
    is_runtime_path,
    load_manifest,
    resolve_destination,
    resolve_output_root,
    sha256_file,
    write_json,
)

CHUNK_SIZE = 64 * 1024


def download_with_manifest(
    manifest_path: str | Path,
    output_root: str | Path | None = None,
    dry_run: bool = False,
    confirm_large_download: bool = False,
    allow_runtime_overwrite: bool = False,
    resume: bool = True,
) -> dict[str, Any]:
    manifest = load_manifest(manifest_path)
    active_sources = enabled_sources(manifest)
    resolved_output_root = resolve_output_root(output_root or manifest["defaults"]["output_root"])

    expected_total_bytes = sum(source.expected_size_bytes or 0 for source in active_sources)
    threshold = manifest["defaults"]["large_download_threshold_bytes"]
    if active_sources and expected_total_bytes > threshold and not confirm_large_download:
        raise ManifestError(
            "Download plan exceeds the large-download threshold. Re-run with --confirm-large-download."
        )

    records: list[dict[str, Any]] = []
    for source in active_sources:
        destination = resolve_destination(resolved_output_root, source.relative_path)
        if is_runtime_path(destination) and not allow_runtime_overwrite:
            raise RuntimeProtectionError(
                f"Refusing to write inside the live runtime tree without explicit override: {destination}"
            )

        if dry_run:
            records.append(
                {
                    "id": source.id,
                    "source_class": source.source_class,
                    "status": "planned",
                    "source_url": source.url,
                    "local_path": str(destination),
                    "expected_size_bytes": source.expected_size_bytes,
                    "license_note": source.license_note,
                    "mirrorability": source.mirrorability,
                    "sha256": None,
                    "downloaded_at": None,
                }
            )
            continue

        destination.parent.mkdir(parents=True, exist_ok=True)
        bytes_written = _download_source(source.url, destination, source.max_bytes, resume)
        if source.expected_size_bytes is not None and bytes_written != source.expected_size_bytes:
            raise ManifestError(
                f"Downloaded size mismatch for {source.id}: expected {source.expected_size_bytes}, got {bytes_written}"
            )

        digest = sha256_file(destination)
        if source.expected_sha256 and digest != source.expected_sha256:
            raise ChecksumMismatchError(
                f"SHA-256 mismatch for {source.id}: expected {source.expected_sha256}, got {digest}"
            )

        records.append(
            {
                "id": source.id,
                "source_class": source.source_class,
                "status": "downloaded",
                "source_url": source.url,
                "local_path": str(destination),
                "bytes": bytes_written,
                "license_note": source.license_note,
                "mirrorability": source.mirrorability,
                "sha256": digest,
                "downloaded_at": _utc_now(),
            }
        )

    report = {
        "manifest_name": manifest["name"],
        "manifest_path": str(Path(manifest_path).resolve()),
        "output_root": str(resolved_output_root),
        "dry_run": dry_run,
        "record_count": len(records),
        "records": records,
    }
    report_path = build_report_path(resolved_output_root, manifest["name"])
    write_json(report_path, report)
    report["report_path"] = str(report_path)
    return report


def _download_source(url: str, destination: Path, max_bytes: int, resume: bool) -> int:
    parsed = urlparse(url)
    if parsed.scheme == "file":
        source_path = Path(unquote(parsed.path))
        return _copy_local_file(source_path, destination, max_bytes, resume)
    if parsed.scheme in {"http", "https"}:
        return _download_http(url, destination, max_bytes, resume)
    raise ManifestError(f"Unsupported URL scheme for source: {url}")


def _copy_local_file(source_path: Path, destination: Path, max_bytes: int, resume: bool) -> int:
    if not source_path.exists():
        raise ManifestError(f"Local source file does not exist: {source_path}")

    existing_size = destination.stat().st_size if destination.exists() else 0
    source_size = source_path.stat().st_size
    if source_size > max_bytes:
        raise SizeLimitError(f"Source exceeds max_bytes limit: {source_path}")
    if existing_size >= source_size and resume:
        return source_size

    mode = "ab" if resume and destination.exists() else "wb"
    with source_path.open("rb") as source_handle:
        if mode == "ab":
            source_handle.seek(existing_size)
        else:
            existing_size = 0

        total_written = existing_size
        with destination.open(mode) as destination_handle:
            for chunk in iter(lambda: source_handle.read(CHUNK_SIZE), b""):
                total_written += len(chunk)
                if total_written > max_bytes:
                    destination_handle.close()
                    destination.unlink(missing_ok=True)
                    raise SizeLimitError(f"Download exceeded max_bytes limit: {destination}")
                destination_handle.write(chunk)
    return total_written


def _download_http(url: str, destination: Path, max_bytes: int, resume: bool) -> int:
    existing_size = destination.stat().st_size if destination.exists() else 0
    if existing_size > max_bytes:
        raise SizeLimitError(f"Existing partial file already exceeds max_bytes: {destination}")

    headers: dict[str, str] = {}
    if resume and existing_size:
        headers["Range"] = f"bytes={existing_size}-"

    request = Request(url, headers=headers)
    with urlopen(request) as response:
        status = getattr(response, "status", 200)
        append_mode = status == 206 and existing_size > 0
        if not append_mode and destination.exists() and existing_size:
            destination.unlink()
            existing_size = 0

        mode = "ab" if append_mode else "wb"
        total_written = existing_size
        with destination.open(mode) as destination_handle:
            for chunk in iter(lambda: response.read(CHUNK_SIZE), b""):
                total_written += len(chunk)
                if total_written > max_bytes:
                    destination_handle.close()
                    destination.unlink(missing_ok=True)
                    raise SizeLimitError(f"Download exceeded max_bytes limit: {destination}")
                destination_handle.write(chunk)
    return total_written


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download ORAS skydata sources from a manifest")
    parser.add_argument("manifest", help="Path to the manifest JSON file")
    parser.add_argument("--output-root", help="Optional override for the manifest output_root")
    parser.add_argument("--dry-run", action="store_true", help="Plan downloads without writing files")
    parser.add_argument(
        "--confirm-large-download",
        action="store_true",
        help="Allow plans that exceed the configured large-download threshold",
    )
    parser.add_argument(
        "--allow-runtime-overwrite",
        action="store_true",
        help="Allow writes inside frontend/public/oras-sky-engine/skydata",
    )
    parser.add_argument("--no-resume", action="store_true", help="Disable resume behavior")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = download_with_manifest(
        manifest_path=args.manifest,
        output_root=args.output_root,
        dry_run=args.dry_run,
        confirm_large_download=args.confirm_large_download,
        allow_runtime_overwrite=args.allow_runtime_overwrite,
        resume=not args.no_resume,
    )
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from pathlib import Path

from scripts.skydata.common import enabled_sources, load_manifest, resolve_destination, resolve_output_root, sha256_file


def verify_mirror(manifest_path: str | Path, output_root: str | Path | None = None) -> dict[str, object]:
    manifest = load_manifest(manifest_path)
    resolved_output_root = resolve_output_root(output_root or manifest["defaults"]["output_root"])

    records = []
    for source in enabled_sources(manifest):
        destination = resolve_destination(resolved_output_root, source.relative_path)
        exists = destination.exists()
        sha256 = sha256_file(destination) if exists else None
        size_bytes = destination.stat().st_size if exists else None
        checksum_ok = source.expected_sha256 is None or sha256 == source.expected_sha256
        size_ok = source.expected_size_bytes is None or size_bytes == source.expected_size_bytes
        records.append(
            {
                "id": source.id,
                "local_path": str(destination),
                "exists": exists,
                "size_bytes": size_bytes,
                "sha256": sha256,
                "checksum_ok": checksum_ok,
                "size_ok": size_ok,
            }
        )

    return {
        "manifest_name": manifest["name"],
        "output_root": str(resolved_output_root),
        "records": records,
        "all_ok": all(record["exists"] and record["checksum_ok"] and record["size_ok"] for record in records),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify files described by an ORAS skydata manifest")
    parser.add_argument("manifest", help="Path to the manifest JSON file")
    parser.add_argument("--output-root", help="Optional override for the manifest output_root")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = verify_mirror(args.manifest, args.output_root)
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0 if report["all_ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
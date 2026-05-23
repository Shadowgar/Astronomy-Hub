#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import math
import struct
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.skydata.common import REPO_ROOT, RUNTIME_SKYDATA_ROOT

DEFAULT_STARS_ROOT = RUNTIME_SKYDATA_ROOT / "stars"


def inspect_star_tiles(
    stars_root: str | Path = DEFAULT_STARS_ROOT,
    *,
    sample_limit: int = 2,
) -> dict[str, Any]:
    root = Path(stars_root).resolve()
    properties_path = root / "properties"
    if not properties_path.exists():
        raise FileNotFoundError(f"Missing star properties file: {properties_path}")

    properties = _parse_properties(properties_path)
    order_directories = sorted(
        (path for path in root.iterdir() if path.is_dir() and path.name.startswith("Norder")),
        key=lambda path: int(path.name.removeprefix("Norder")),
    )

    order_summaries: list[dict[str, Any]] = []
    total_tile_count = 0
    for order_dir in order_directories:
        tile_paths = sorted(order_dir.rglob("Npix*.eph"))
        total_tile_count += len(tile_paths)
        order_summaries.append(
            {
                "order": int(order_dir.name.removeprefix("Norder")),
                "tile_count": len(tile_paths),
                "dir_buckets": sorted({path.parent.name for path in tile_paths}),
                "sample_tiles": [
                    _inspect_tile(path, root) for path in tile_paths[: max(sample_limit, 0)]
                ],
            }
        )

    return {
        "stars_root": str(root),
        "properties_path": str(properties_path),
        "properties": properties,
        "norder_count": len(order_summaries),
        "total_tile_count": total_tile_count,
        "observed_path_pattern": "Norder*/Dir*/Npix*.eph",
        "orders": order_summaries,
        "repo_root": str(REPO_ROOT),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Inspect the live ORAS star tile bundle without modifying it"
    )
    parser.add_argument(
        "--stars-root",
        default=str(DEFAULT_STARS_ROOT),
        help="Path to a HiPS stars directory containing a properties file",
    )
    parser.add_argument(
        "--sample-limit",
        type=int,
        default=2,
        help="How many sample tiles to inspect per Norder directory",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = inspect_star_tiles(args.stars_root, sample_limit=args.sample_limit)
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


def _parse_properties(path: Path) -> dict[str, str]:
    properties: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        properties[key.strip()] = value.strip()
    return properties


def _inspect_tile(path: Path, root: Path) -> dict[str, Any]:
    data = path.read_bytes()
    if len(data) < 8:
        raise ValueError(f"Tile too small to parse: {path}")

    magic = data[:4].decode("ascii", errors="replace")
    file_version = struct.unpack_from("<I", data, 4)[0]
    chunks = _parse_chunks(data)
    primary_payload = next((chunk for chunk in chunks if chunk["type"] in {"STAR", "GAIA"}), None)

    return {
        "relative_path": str(path.relative_to(root)),
        "size_bytes": len(data),
        "magic": magic,
        "file_version": file_version,
        "chunks": [
            {
                "type": chunk["type"],
                "length": chunk["length"],
                "json": chunk.get("json"),
                "tile_header": chunk.get("tile_header"),
                "table_header": chunk.get("table_header"),
            }
            for chunk in chunks
        ],
        "primary_chunk_type": primary_payload["type"] if primary_payload else None,
    }


def _parse_chunks(data: bytes) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    offset = 8
    while offset + 12 <= len(data):
        chunk_type = data[offset : offset + 4].decode("ascii", errors="replace")
        chunk_length = struct.unpack_from("<I", data, offset + 4)[0]
        chunk_data_start = offset + 8
        chunk_data_end = chunk_data_start + chunk_length
        if chunk_data_end + 4 > len(data):
            break
        chunk_data = data[chunk_data_start:chunk_data_end]
        chunk: dict[str, Any] = {
            "type": chunk_type,
            "length": chunk_length,
        }
        if chunk_type == "JSON":
            chunk["json"] = json.loads(chunk_data.decode("utf-8"))
        elif chunk_type in {"STAR", "GAIA"}:
            chunk.update(_parse_primary_chunk(chunk_data))
        chunks.append(chunk)
        offset = chunk_data_end + 4
    return chunks


def _parse_primary_chunk(chunk_data: bytes) -> dict[str, Any]:
    if len(chunk_data) < 28:
        return {}
    tile_version = struct.unpack_from("<I", chunk_data, 0)[0]
    nuniq = struct.unpack_from("<Q", chunk_data, 4)[0]
    order = int(math.log2(nuniq / 4) / 2)
    pix = int(nuniq - 4 * (1 << (2 * order)))
    flags, row_size, column_count, row_count = struct.unpack_from("<IIII", chunk_data, 12)
    columns: list[dict[str, Any]] = []
    offset = 28
    for _ in range(column_count):
        if offset + 20 > len(chunk_data):
            break
        name = chunk_data[offset : offset + 4].split(b"\0", 1)[0].decode("ascii", errors="ignore")
        column_type = chunk_data[offset + 4 : offset + 8].split(b"\0", 1)[0].decode(
            "ascii", errors="ignore"
        )
        unit, start, size = struct.unpack_from("<III", chunk_data, offset + 8)
        columns.append(
            {
                "name": name,
                "type": column_type,
                "unit": unit,
                "start": start,
                "size": size,
            }
        )
        offset += 20
    return {
        "tile_header": {
            "tile_version": tile_version,
            "nuniq": nuniq,
            "order": order,
            "pix": pix,
        },
        "table_header": {
            "flags": flags,
            "row_size": row_size,
            "column_count": column_count,
            "row_count": row_count,
            "columns": columns,
        },
    }


if __name__ == "__main__":
    raise SystemExit(main())
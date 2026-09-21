#!/usr/bin/env python3
"""Validate an ORAS native SWE dense-star tile release."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import struct
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RELEASE_ROOT = REPO_ROOT / "data/runtime-packs/dense-star-tiles"
SAFE_TILE_RE = re.compile(r"^Norder([0-9]+)/Dir([0-9]+)/Npix([0-9]+)\.eph$")
CATALOG_MODE = "canonical_replacement"
NATIVE_CONTINUATION_KEY = "gaia"

# The owned ORAS STAR v3 release contract, independently specified here rather
# than imported from its writer. A four-byte identifier is not a C string.
STAR_ROW_SIZE = 340
STAR_COLUMNS = (
    (b"type", b"s\0\0\0", 0, 0, 4),
    (b"gaia", b"Q\0\0\0", 0, 4, 8),
    (b"hip\0", b"i\0\0\0", 0, 12, 4),
    (b"vmag", b"f\0\0\0", 3 << 16, 16, 4),
    (b"gmag", b"f\0\0\0", 3 << 16, 20, 4),
    (b"ra\0\0", b"f\0\0\0", 1 << 16, 24, 4),
    (b"de\0\0", b"f\0\0\0", 1 << 16, 28, 4),
    (b"plx\0", b"f\0\0\0", (1 << 16) | 7, 32, 4),
    (b"pra\0", b"f\0\0\0", 6 << 16, 36, 4),
    (b"pde\0", b"f\0\0\0", 6 << 16, 40, 4),
    (b"epoc", b"f\0\0\0", 7 << 16, 44, 4),
    (b"bv\0\0", b"f\0\0\0", 0, 48, 4),
    (b"ids\0", b"s\0\0\0", 0, 52, 256),
    (b"spec", b"s\0\0\0", 0, 308, 32),
)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_tile_path(path: str) -> tuple[int, int]:
    if path.startswith("/") or "\\" in path or ".." in path.split("/"):
        raise ValueError(f"unsafe tile path: {path}")
    match = SAFE_TILE_RE.match(path)
    if not match:
        raise ValueError(f"invalid tile path: {path}")
    order = int(match.group(1))
    pix = int(match.group(3))
    if int(match.group(2)) != (pix // 10000) * 10000:
        raise ValueError(f"tile dir does not match pix: {path}")
    return order, pix


def read_eph_chunks(data: bytes) -> list[tuple[str, bytes]]:
    if len(data) < 8 or data[:4] != b"EPHE":
        raise ValueError("missing EPHE magic")
    version = struct.unpack_from("<i", data, 4)[0]
    if version != 2:
        raise ValueError(f"unsupported EPHE version: {version}")
    chunks: list[tuple[str, bytes]] = []
    offset = 8
    while offset < len(data):
        if offset + 12 > len(data):
            raise ValueError("truncated EPHE chunk header")
        chunk_type = data[offset : offset + 4].decode("ascii")
        size = struct.unpack_from("<i", data, offset + 4)[0]
        if size < 0:
            raise ValueError("negative chunk size")
        start = offset + 8
        end = start + size
        if end + 4 > len(data):
            raise ValueError("truncated EPHE chunk")
        payload = data[start:end]
        expected_crc = struct.unpack_from("<I", data, end)[0]
        actual_crc = __import__("zlib").crc32(payload) & 0xFFFFFFFF
        if expected_crc != actual_crc:
            raise ValueError(f"EPHE chunk CRC mismatch: {chunk_type}")
        chunks.append((chunk_type, payload))
        offset = end + 4
    return chunks


def validate_star_chunk(payload: bytes, expected_order: int, expected_pix: int) -> int:
    if len(payload) < 28:
        raise ValueError("STAR chunk too small")
    version = struct.unpack_from("<i", payload, 0)[0]
    if version != 3:
        raise ValueError("unsupported STAR schema version")
    nuniq = struct.unpack_from("<Q", payload, 4)[0]
    if nuniq < 4:
        raise ValueError("invalid STAR tile index")
    order = int((nuniq // 4).bit_length() - 1) // 2
    pix = nuniq - 4 * (1 << (2 * order))
    if order != expected_order or pix != expected_pix:
        raise ValueError("STAR tile header does not match path")
    flags, row_size, column_count, row_count = struct.unpack_from("<iiii", payload, 12)
    if flags != 0:
        raise ValueError("unexpected shuffled table flag")
    if row_size != STAR_ROW_SIZE or column_count != len(STAR_COLUMNS) or row_count < 0:
        raise ValueError("invalid STAR schema row size, column count or row count")
    table_header_size = 16 + column_count * 20
    block_offset = 12 + table_header_size
    if block_offset + 8 > len(payload):
        raise ValueError("missing compressed STAR table block")
    for index, expected in enumerate(STAR_COLUMNS):
        actual = struct.unpack_from("<4s4siii", payload, 28 + index * 20)
        if actual != expected:
            raise ValueError(f"STAR column schema mismatch at {index}: {actual!r}; expected {expected!r}")
    data_size, compressed_size = struct.unpack_from("<ii", payload, block_offset)
    if data_size != row_count * row_size:
        raise ValueError("STAR data size does not match row count")
    if compressed_size <= 0 or block_offset + 8 + compressed_size != len(payload):
        raise ValueError("invalid compressed STAR table block size")
    import zlib

    decoder = zlib.decompressobj()
    table = decoder.decompress(payload[block_offset + 8 :], data_size + 1)
    if not decoder.eof or decoder.unused_data or decoder.unconsumed_tail:
        raise ValueError("invalid compressed STAR stream")
    if len(table) != data_size:
        raise ValueError("decompressed STAR table size mismatch")
    return row_count


def read_properties(path: Path) -> dict[str, str]:
    properties: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        properties[key.strip()] = value.strip()
    return properties


def validate_profile_tiles(profile_root: Path) -> dict[str, Any]:
    manifest_path = profile_root / "manifest.json"
    properties_path = profile_root / "properties"
    if not manifest_path.is_file():
        raise FileNotFoundError(f"dense star profile manifest not found: {manifest_path}")
    if not properties_path.is_file():
        raise FileNotFoundError(f"dense star profile properties not found: {properties_path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    properties = read_properties(properties_path)
    if manifest.get("schema_version") != 1:
        raise ValueError("unsupported dense star manifest schema")
    if manifest.get("rendering_path") != "native_swe_star_tiles":
        raise ValueError("dense star release must use native_swe_star_tiles")
    if manifest.get("source_id_type") != "string":
        raise ValueError("dense star source IDs must be string-preserved")
    if manifest.get("catalog_mode") != CATALOG_MODE:
        raise ValueError("dense star profile must replace the bright native catalog chain")
    continuation = manifest.get("native_continuation")
    if not isinstance(continuation, dict) or continuation.get("key") != NATIVE_CONTINUATION_KEY:
        raise ValueError("dense star profile must declare the native Gaia continuation")
    if manifest.get("label_mode") not in {"named", "suppressed"}:
        raise ValueError("dense star profile label mode must be named or suppressed")
    entries = manifest.get("tile_entries")
    if not isinstance(entries, list):
        raise ValueError("tile_entries must be a list")
    expected_tile_order = int(manifest.get("tile_order", -1))
    if properties.get("type") != "stars":
        raise ValueError("dense star properties type must be stars")
    if properties.get("hips_tile_format") != "eph":
        raise ValueError("dense star properties tile format must be eph")
    if int(properties.get("hips_order", -1)) != expected_tile_order:
        raise ValueError("dense star properties hips_order mismatch")

    star_count = 0
    seen_paths: set[str] = set()
    for entry in entries:
        path_text = str(entry.get("path", ""))
        if path_text in seen_paths:
            raise ValueError(f"duplicate dense star tile entry: {path_text}")
        seen_paths.add(path_text)
        order, pix = validate_tile_path(path_text)
        if order != expected_tile_order:
            raise ValueError(f"dense star tile order mismatch: {path_text}")
        tile_file = profile_root / path_text
        if not tile_file.is_file():
            raise FileNotFoundError(f"dense star tile missing: {path_text}")
        if tile_file.stat().st_size != int(entry.get("byte_size", -1)):
            raise ValueError(f"dense star tile byte size mismatch: {path_text}")
        if sha256_file(tile_file) != entry.get("sha256"):
            raise ValueError(f"dense star tile checksum mismatch: {path_text}")
        chunks = read_eph_chunks(tile_file.read_bytes())
        if not any(chunk_type == "JSON" for chunk_type, _payload in chunks):
            raise ValueError(f"dense star tile is missing JSON chunk: {path_text}")
        star_chunks = [payload for chunk_type, payload in chunks if chunk_type == "STAR"]
        if len(star_chunks) != 1:
            raise ValueError(f"dense star tile must contain one STAR chunk: {path_text}")
        star_count += validate_star_chunk(star_chunks[0], order, pix)

    if star_count != int(manifest.get("star_count", -1)):
        raise ValueError("dense star manifest star_count mismatch")
    if len(entries) != int(manifest.get("tile_count", -1)):
        raise ValueError("dense star manifest tile_count mismatch")
    return {
        "release_root": str(profile_root),
        "release_version": manifest.get("release_version"),
        "profile_id": manifest.get("profile_id"),
        "profile_label": manifest.get("profile_label"),
        "profile_intent": manifest.get("profile_intent"),
        "label_mode": manifest.get("label_mode"),
        "tile_order": expected_tile_order,
        "source_manifest_sha256": manifest.get("source_manifest_sha256"),
        "star_count": star_count,
        "tile_count": len(entries),
        "magnitude_limit": manifest.get("magnitude_limit"),
        "minimum_magnitude": manifest.get("minimum_magnitude"),
        "min_magnitude": manifest.get("min_magnitude"),
        "max_magnitude": manifest.get("max_magnitude"),
        "rendering_path": manifest.get("rendering_path"),
        "catalog_mode": manifest.get("catalog_mode"),
        "native_continuation": continuation,
    }


def validate_dense_star_tiles(release_root: Path = DEFAULT_RELEASE_ROOT) -> dict[str, Any]:
    release_root = Path(release_root)
    manifest_path = release_root / "manifest.json"
    if not manifest_path.is_file():
        raise FileNotFoundError(f"dense star manifest not found: {manifest_path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("schema_version") != 1:
        raise ValueError("unsupported dense star manifest schema")
    if manifest.get("rendering_path") != "native_swe_star_tiles":
        raise ValueError("dense star release must use native_swe_star_tiles")
    if manifest.get("source_id_type") != "string":
        raise ValueError("dense star source IDs must be string-preserved")
    if manifest.get("catalog_mode") != CATALOG_MODE:
        raise ValueError("dense star release must replace the bright native catalog chain")
    continuation = manifest.get("native_continuation")
    if not isinstance(continuation, dict) or continuation.get("key") != NATIVE_CONTINUATION_KEY:
        raise ValueError("dense star release must declare the native Gaia continuation")
    profiles = manifest.get("profiles")
    if not isinstance(profiles, dict) or not profiles:
        raise ValueError("dense star release must define profiles")
    default_profile = manifest.get("default_profile")
    if default_profile != "visual-default":
        raise ValueError("dense star default profile must be visual-default")
    visual_profile = profiles.get("visual-default")
    if not isinstance(visual_profile, dict):
        raise ValueError("dense star release must define visual-default profile")
    if float(visual_profile.get("magnitude_limit", 99)) > 4.8:
        raise ValueError("dense star visual-default profile must stay at mag 4.8 or brighter")
    release_tile_order = manifest.get("tile_order")
    if (
        isinstance(release_tile_order, bool)
        or not isinstance(release_tile_order, int)
        or not 0 <= release_tile_order <= 8
    ):
        raise ValueError("dense star release tile_order must be an integer between 0 and 8")
    release_source_digest = manifest.get("source_manifest_sha256")
    if not isinstance(release_source_digest, str) or len(release_source_digest) != 64:
        raise ValueError("dense star release source_manifest_sha256 must be a SHA-256 digest")

    profile_reports: dict[str, Any] = {}
    for profile_id, profile in profiles.items():
        if not isinstance(profile, dict):
            raise ValueError(f"dense star profile entry must be an object: {profile_id}")
        if profile.get("tile_order") != release_tile_order:
            raise ValueError(f"dense star profile tile order mismatch: {profile_id}")
        profile_path = str(profile.get("path", ""))
        if profile_path.startswith("/") or "\\" in profile_path or ".." in profile_path.split("/"):
            raise ValueError(f"unsafe dense star profile path: {profile_path}")
        profile_report = validate_profile_tiles(release_root / profile_path)
        if profile_report["tile_order"] != release_tile_order:
            raise ValueError(f"dense star profile actual tile order mismatch: {profile_id}")
        if profile_report["source_manifest_sha256"] != release_source_digest:
            raise ValueError(
                f"dense star profile catalog manifest digest mismatch: {profile_id}"
            )
        metadata_fields = (
            ("profile_id", "profile_id"),
            ("label", "profile_label"),
            ("profile_intent", "profile_intent"),
            ("label_mode", "label_mode"),
            ("magnitude_limit", "magnitude_limit"),
            ("minimum_magnitude", "minimum_magnitude"),
            ("min_magnitude", "min_magnitude"),
            ("max_magnitude", "max_magnitude"),
        )
        for profile_field, report_field in metadata_fields:
            if profile.get(profile_field) != profile_report[report_field]:
                raise ValueError(
                    f"dense star profile metadata mismatch: {profile_id} {profile_field}"
                )
        if profile_report["star_count"] != int(profile.get("star_count", -1)):
            raise ValueError(f"dense star profile star count mismatch: {profile_id}")
        if profile_report["tile_count"] != int(profile.get("tile_count", -1)):
            raise ValueError(f"dense star profile tile count mismatch: {profile_id}")
        profile_reports[profile_id] = profile_report

    deep_report = profile_reports.get("deep-catalog") or next(iter(profile_reports.values()))
    return {
        "release_root": str(release_root),
        "release_version": manifest.get("release_version"),
        "default_profile": default_profile,
        "profiles": profile_reports,
        "star_count": deep_report["star_count"],
        "tile_count": deep_report["tile_count"],
        "magnitude_limit": deep_report["magnitude_limit"],
        "rendering_path": manifest.get("rendering_path"),
        "catalog_mode": manifest.get("catalog_mode"),
        "native_continuation": continuation,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("release_root", nargs="?", type=Path, default=Path(os.environ.get("ORAS_DENSE_STAR_TILES_DIR", DEFAULT_RELEASE_ROOT)))
    args = parser.parse_args()
    report = validate_dense_star_tiles(args.release_root)
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

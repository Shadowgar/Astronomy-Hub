#!/usr/bin/env python3
"""Build ORAS native SWE dense-star tiles from mounted catalog-pack records."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import shutil
import stat
import struct
import tempfile
import zlib
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_ROOT = REPO_ROOT / "data/runtime-packs/catalog-packs"
DEFAULT_OUTPUT_ROOT = REPO_ROOT / "data/runtime-packs/dense-star-tiles"
DEFAULT_RELEASE_VERSION = "2026.06.native-stars.2"
DEFAULT_MAGNITUDE_LIMIT = 13.0
DEFAULT_TILE_ORDER = 3
SOURCE_PACK_ID = "stars-core"
DEFAULT_PROFILE = "visual-default"
DENSE_STAR_PROFILES = [
    {
        "profile_id": "visual-default",
        "label": "Visual",
        "magnitude_limit": 4.8,
        "profile_intent": "default",
        "label_mode": "suppressed",
    },
    {
        "profile_id": "binocular",
        "label": "Binocular",
        "magnitude_limit": 8.5,
        "profile_intent": "opt-in",
        "label_mode": "suppressed",
    },
    {
        "profile_id": "deep-catalog",
        "label": "Deep Catalog",
        "magnitude_limit": 13.0,
        "profile_intent": "opt-in",
        "label_mode": "suppressed",
    },
]

EPH_RAD = 1 << 16
EPH_ARCSEC = EPH_RAD | 1 | 2 | 4
EPH_VMAG = 3 << 16
EPH_RAD_PER_YEAR = 6 << 16
EPH_YEAR = 7 << 16

def _build_utab() -> list[int]:
    values: list[int] = []
    for m in range(256):
        value = (
            (m & 0x01)
            | ((m & 0x02) << 1)
            | ((m & 0x04) << 2)
            | ((m & 0x08) << 3)
            | ((m & 0x10) << 4)
            | ((m & 0x20) << 5)
            | ((m & 0x40) << 6)
            | ((m & 0x80) << 7)
        )
        values.append(value)
    return values


UTAB = _build_utab()


def healpix_xyf2nest(nside: int, ix: int, iy: int, face_num: int) -> int:
    return (
        face_num * nside * nside
        + (UTAB[ix & 0xFF] | (UTAB[ix >> 8] << 16) | (UTAB[iy & 0xFF] << 1) | (UTAB[iy >> 8] << 17))
    )


def _fmodulo(value: float, divisor: float) -> float:
    if value >= 0:
        return value if value < divisor else math.fmod(value, divisor)
    result = math.fmod(value, divisor) + divisor
    return 0.0 if result == divisor else result


def healpix_ang2pix(nside: int, theta: float, phi: float) -> int:
    z = math.cos(theta)
    za = abs(z)
    tt = _fmodulo(phi, 2 * math.pi) * (2 / math.pi)

    if za <= 2.0 / 3.0:
        temp1 = nside * (0.5 + tt)
        temp2 = nside * (z * 0.75)
        jp = int(temp1 - temp2)
        jm = int(temp1 + temp2)
        ifp = jp // nside
        ifm = jm // nside
        face_num = (ifp | 4) if ifp == ifm else (ifp if ifp < ifm else ifm + 8)
        ix = jm & (nside - 1)
        iy = nside - (jp & (nside - 1)) - 1
    else:
        ntt = int(tt)
        if ntt >= 4:
            ntt = 3
        tp = tt - ntt
        tmp = nside * math.sqrt(3 * (1 - za))
        jp = int(tp * tmp)
        jm = int((1.0 - tp) * tmp)
        if jp >= nside:
            jp = nside - 1
        if jm >= nside:
            jm = nside - 1
        if z >= 0:
            face_num = ntt
            ix = nside - jm - 1
            iy = nside - jp - 1
        else:
            face_num = ntt + 8
            ix = jp
            iy = jm

    return healpix_xyf2nest(nside, ix, iy, face_num)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def safe_float(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number):
        return None
    return number


def native_epoch(record: dict[str, Any]) -> float:
    if safe_float(record.get("epoch")) is not None:
        return float(record["epoch"])
    catalog = str(record.get("catalog") or "").lower()
    if "gaia" in catalog:
        return 2016.0
    if "hipparcos" in catalog:
        return 1991.25
    if "tycho" in catalog:
        return 1991.25
    return 2000.0


def parse_hip_number(record: dict[str, Any]) -> int:
    values = [record.get("source_id"), record.get("display_name")]
    values.extend(record.get("names") or [])
    values.extend(record.get("aliases") or [])
    for value in values:
        text = str(value or "").strip().upper()
        if text.startswith("HIP-"):
            text = "HIP " + text[4:]
        if text.startswith("HIP "):
            digits = "".join(ch for ch in text[4:] if ch.isdigit())
            if digits:
                return int(digits)
    return 0


def parse_gaia_id(record: dict[str, Any]) -> int:
    if str(record.get("catalog") or "").lower().startswith("gaia"):
        source_id = str(record.get("source_id") or "").strip()
        if source_id.isdigit():
            return int(source_id)
    return 0


def native_names(record: dict[str, Any], include_labels: bool = False) -> str:
    if not include_labels:
        return ""
    names = [record.get("display_name"), record.get("source_id")]
    names.extend(record.get("names") or [])
    names.extend(record.get("aliases") or [])
    cleaned: list[str] = []
    for value in names:
        text = str(value or "").strip()
        if text and "|" not in text and text not in cleaned:
            cleaned.append(text)
    return "|".join(cleaned)[:255]


def normalize_star_record(
    record: dict[str, Any],
    magnitude_limit: float,
    minimum_magnitude: float | None,
    include_labels: bool = False,
) -> tuple[dict[str, Any] | None, str | None]:
    if record.get("model") != "star":
        return None, "not_star"
    ra = safe_float(record.get("ra"))
    dec = safe_float(record.get("dec"))
    magnitude = safe_float(record.get("magnitude"))
    source_id = str(record.get("source_id") or "").strip()
    if not source_id:
        return None, "missing_source_id"
    if ra is None or dec is None or not (0 <= ra < 360) or not (-90 <= dec <= 90):
        return None, "invalid_coordinates"
    if magnitude is None:
        return None, "missing_magnitude"
    if magnitude > magnitude_limit:
        return None, "magnitude_limit"
    if minimum_magnitude is not None and magnitude < minimum_magnitude:
        return None, "minimum_magnitude"

    pm_ra_mas = safe_float(record.get("proper_motion_ra")) or 0.0
    pm_dec_mas = safe_float(record.get("proper_motion_dec")) or 0.0
    parallax_mas = safe_float(record.get("parallax"))
    color_index = safe_float(record.get("color_index"))
    return {
        "catalog": str(record.get("catalog") or "Unknown"),
        "source_id": source_id,
        "display_name": str(record.get("display_name") or source_id),
        "gaia": parse_gaia_id(record),
        "hip": parse_hip_number(record) if include_labels else 0,
        "vmag": magnitude,
        "gmag": magnitude,
        "ra_rad": math.radians(ra),
        "de_rad": math.radians(dec),
        "plx_arcsec": (parallax_mas / 1000.0) if parallax_mas is not None else math.nan,
        "pra_rad_year": pm_ra_mas * (math.pi / (180.0 * 3600.0 * 1000.0)),
        "pde_rad_year": pm_dec_mas * (math.pi / (180.0 * 3600.0 * 1000.0)),
        "epoch": native_epoch(record),
        "bv": color_index if color_index is not None else math.nan,
        "ids": native_names(record, include_labels=include_labels),
        "spectral_type": str(record.get("spectral_type") or "")[:31],
    }, None


def iter_catalog_records(source_root: Path) -> Iterable[dict[str, Any]]:
    manifest_path = source_root / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for pack in manifest.get("packs", []):
        if pack.get("pack_id") != SOURCE_PACK_ID:
            continue
        for chunk in pack.get("chunks", []):
            chunk_path = source_root / str(chunk.get("path", ""))
            if not chunk_path.is_file():
                continue
            with chunk_path.open("r", encoding="utf-8") as handle:
                for line in handle:
                    if line.strip():
                        yield json.loads(line)


def tile_path(root: Path, order: int, pix: int) -> Path:
    return root / f"Norder{order}" / f"Dir{(pix // 10000) * 10000}" / f"Npix{pix}.eph"


def nuniq(order: int, pix: int) -> int:
    return 4 * (1 << (2 * order)) + pix


def pack_fixed_string(value: str, size: int) -> bytes:
    data = value.encode("utf-8", errors="ignore")[: size - 1]
    return data + b"\0" * (size - len(data))


def pack_fixed_bytes(value: str, size: int) -> bytes:
    data = value.encode("ascii", errors="ignore")[:size]
    return data + b"\0" * (size - len(data))


def write_eph_chunk(chunk_type: bytes, payload: bytes) -> bytes:
    return chunk_type + struct.pack("<i", len(payload)) + payload + struct.pack("<I", zlib.crc32(payload) & 0xFFFFFFFF)


def write_star_tile(path: Path, order: int, pix: int, stars: list[dict[str, Any]]) -> None:
    columns = [
        ("type", "s", 0, 0, 4),
        ("gaia", "Q", 0, 4, 8),
        ("hip", "i", 0, 12, 4),
        ("vmag", "f", EPH_VMAG, 16, 4),
        ("gmag", "f", EPH_VMAG, 20, 4),
        ("ra", "f", EPH_RAD, 24, 4),
        ("de", "f", EPH_RAD, 28, 4),
        ("plx", "f", EPH_ARCSEC, 32, 4),
        ("pra", "f", EPH_RAD_PER_YEAR, 36, 4),
        ("pde", "f", EPH_RAD_PER_YEAR, 40, 4),
        ("epoc", "f", EPH_YEAR, 44, 4),
        ("bv", "f", 0, 48, 4),
        ("ids", "s", 0, 52, 256),
        ("spec", "s", 0, 308, 32),
    ]
    row_size = 340
    rows = bytearray()
    for star in sorted(stars, key=lambda item: item["vmag"]):
        rows.extend(pack_fixed_string("*", 4))
        rows.extend(struct.pack("<Q", int(star["gaia"])))
        rows.extend(struct.pack("<i", int(star["hip"])))
        rows.extend(struct.pack("<f", float(star["vmag"])))
        rows.extend(struct.pack("<f", float(star["gmag"])))
        rows.extend(struct.pack("<f", float(star["ra_rad"])))
        rows.extend(struct.pack("<f", float(star["de_rad"])))
        rows.extend(struct.pack("<f", float(star["plx_arcsec"])))
        rows.extend(struct.pack("<f", float(star["pra_rad_year"])))
        rows.extend(struct.pack("<f", float(star["pde_rad_year"])))
        rows.extend(struct.pack("<f", float(star["epoch"])))
        rows.extend(struct.pack("<f", float(star["bv"])))
        rows.extend(pack_fixed_string(star["ids"], 256))
        rows.extend(pack_fixed_string(star["spectral_type"], 32))
    table_header = struct.pack("<iiii", 0, row_size, len(columns), len(stars))
    for name, type_name, unit, start, size in columns:
        table_header += pack_fixed_bytes(name, 4)
        table_header += pack_fixed_bytes(type_name, 4)
        table_header += struct.pack("<iii", unit, start, size)
    compressed = zlib.compress(bytes(rows), level=9)
    table_block = table_header + struct.pack("<ii", len(rows), len(compressed)) + compressed
    star_payload = struct.pack("<iQ", 3, nuniq(order, pix)) + table_block
    json_payload = json.dumps({"children_mask": 0}, separators=(",", ":")).encode("utf-8")
    content = b"EPHE" + struct.pack("<i", 2) + write_eph_chunk(b"JSON", json_payload) + write_eph_chunk(b"STAR", star_payload)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)


def write_properties(root: Path, release_version: str, magnitude_limit: float, tile_order: int, star_count: int, min_mag: float | None, max_mag: float | None) -> None:
    min_vmag = min_mag if min_mag is not None else -2.0
    max_vmag = max_mag if max_mag is not None else magnitude_limit
    properties = "\n".join([
        "obs_description          = ORAS native dense stars generated from source-backed catalog packs",
        f"hips_release_date        = {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%MZ')}",
        f"hips_order               = {tile_order}",
        f"hips_order_min           = {tile_order}",
        f"min_vmag                 = {min_vmag}",
        f"max_vmag                 = {max_vmag}",
        "type                     = stars",
        "hips_tile_format         = eph",
        f"oras_release_version     = {release_version}",
        f"oras_star_count          = {star_count}",
        "",
    ])
    (root / "properties").write_text(properties, encoding="utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def make_release_tree_readable(root: Path) -> None:
    """Make generated mounted runtime data readable by non-owner containers."""
    for dirpath, dirnames, filenames in os.walk(root):
        directory = Path(dirpath)
        directory.chmod(stat.S_IMODE(directory.stat().st_mode) | 0o755)
        for dirname in dirnames:
            child = directory / dirname
            child.chmod(stat.S_IMODE(child.stat().st_mode) | 0o755)
        for filename in filenames:
            child = directory / filename
            child.chmod(stat.S_IMODE(child.stat().st_mode) | 0o644)


def promote_release_tree(tmp_root: Path, output_root: Path) -> None:
    backup_root: Path | None = None
    if output_root.exists():
        backup_root = output_root.with_name(f"{output_root.name}.previous-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}")
        if backup_root.exists():
            shutil.rmtree(backup_root)
        output_root.rename(backup_root)
    try:
        tmp_root.rename(output_root)
    except Exception:
        if backup_root and backup_root.exists() and not output_root.exists():
            backup_root.rename(output_root)
        raise
    else:
        if backup_root and backup_root.exists():
            shutil.rmtree(backup_root, ignore_errors=True)


def _build_profile_tiles(
    source_root: Path,
    output_root: Path,
    magnitude_limit: float = DEFAULT_MAGNITUDE_LIMIT,
    tile_order: int = DEFAULT_TILE_ORDER,
    release_version: str = DEFAULT_RELEASE_VERSION,
    minimum_magnitude: float | None = None,
    profile_id: str = "custom",
    profile_label: str = "Custom",
    profile_intent: str = "opt-in",
    label_mode: str = "suppressed",
) -> dict[str, Any]:
    source_root = Path(source_root)
    output_root = Path(output_root)
    if not (source_root / "manifest.json").is_file():
        raise FileNotFoundError(f"catalog pack manifest not found: {source_root / 'manifest.json'}")
    if tile_order < 0 or tile_order > 8:
        raise ValueError("tile_order must be between 0 and 8")

    tmp_root = Path(tempfile.mkdtemp(prefix="oras-dense-star-tiles-", dir=str(output_root.parent if output_root.parent.exists() else Path.cwd())))
    tiles: dict[int, list[dict[str, Any]]] = defaultdict(list)
    skipped: Counter[str] = Counter()
    source_catalogs: Counter[str] = Counter()
    source_count = 0
    nside = 1 << tile_order
    magnitudes: list[float] = []
    try:
        for record in iter_catalog_records(source_root):
            source_count += 1
            star, reason = normalize_star_record(
                record,
                magnitude_limit,
                minimum_magnitude,
                include_labels=label_mode != "suppressed",
            )
            if not star:
                skipped[str(reason)] += 1
                continue
            theta = math.pi / 2 - star["de_rad"]
            pix = healpix_ang2pix(nside, theta, star["ra_rad"])
            tiles[pix].append(star)
            source_catalogs[star["catalog"]] += 1
            magnitudes.append(float(star["vmag"]))

        for pix, stars in tiles.items():
            write_star_tile(tile_path(tmp_root, tile_order, pix), tile_order, pix, stars)

        star_count = sum(len(stars) for stars in tiles.values())
        if star_count <= 0:
            raise ValueError(f"dense star profile {profile_id} produced no stars")
        min_mag = min(magnitudes) if magnitudes else None
        max_mag = max(magnitudes) if magnitudes else None
        write_properties(tmp_root, release_version, magnitude_limit, tile_order, star_count, min_mag, max_mag)
        tile_files = sorted(tmp_root.glob(f"Norder{tile_order}/Dir*/Npix*.eph"))
        tile_entries = [
            {
                "path": str(path.relative_to(tmp_root)).replace(os.sep, "/"),
                "byte_size": path.stat().st_size,
                "sha256": sha256_file(path),
            }
            for path in tile_files
        ]
        manifest = {
            "schema_version": 1,
            "release_version": release_version,
            "generated_at": utc_now(),
            "rendering_path": "native_swe_star_tiles",
            "profile_id": profile_id,
            "profile_label": profile_label,
            "profile_intent": profile_intent,
            "label_mode": label_mode,
            "source_pack": SOURCE_PACK_ID,
            "source_id_type": "string",
            "star_count": star_count,
            "source_count": source_count,
            "skipped_count": sum(skipped.values()),
            "skipped_reasons": dict(sorted(skipped.items())),
            "source_catalogs": dict(sorted(source_catalogs.items())),
            "tile_order": tile_order,
            "tile_count": len(tile_files),
            "magnitude_limit": magnitude_limit,
            "minimum_magnitude": minimum_magnitude,
            "min_magnitude": min_mag,
            "max_magnitude": max_mag,
            "tile_format": "eph",
            "tile_entries": tile_entries,
            "source_attribution": [
                {
                    "name": f"ORAS catalog packs {SOURCE_PACK_ID}",
                    "source_key": "oras_catalog_pack_stars_core",
                    "license_note": "Derived from source-backed catalog packs; see catalog pack manifest for upstream attribution.",
                }
            ],
        }
        (tmp_root / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        report = {
            "profile_id": profile_id,
            "profile_label": profile_label,
            "profile_intent": profile_intent,
            "label_mode": label_mode,
            "source_count": source_count,
            "star_count": star_count,
            "skipped_count": sum(skipped.values()),
            "skipped_reasons": dict(sorted(skipped.items())),
            "tile_count": len(tile_files),
            "output_root": str(output_root),
            "release_version": release_version,
            "magnitude_limit": magnitude_limit,
            "minimum_magnitude": minimum_magnitude,
            "min_magnitude": min_mag,
            "max_magnitude": max_mag,
            "source_catalogs": dict(sorted(source_catalogs.items())),
            "byte_size": sum(path.stat().st_size for path in tile_files) + (tmp_root / "manifest.json").stat().st_size + (tmp_root / "properties").stat().st_size,
        }
        (tmp_root / "build-report.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")

        make_release_tree_readable(tmp_root)
        promote_release_tree(tmp_root, output_root)
        return report
    except Exception:
        shutil.rmtree(tmp_root, ignore_errors=True)
        raise


def build_dense_star_tiles(
    source_root: Path,
    output_root: Path,
    magnitude_limit: float = DEFAULT_MAGNITUDE_LIMIT,
    tile_order: int = DEFAULT_TILE_ORDER,
    release_version: str = DEFAULT_RELEASE_VERSION,
    minimum_magnitude: float | None = None,
) -> dict[str, Any]:
    source_root = Path(source_root)
    output_root = Path(output_root)
    if not (source_root / "manifest.json").is_file():
        raise FileNotFoundError(f"catalog pack manifest not found: {source_root / 'manifest.json'}")
    if tile_order < 0 or tile_order > 8:
        raise ValueError("tile_order must be between 0 and 8")

    tmp_root = Path(tempfile.mkdtemp(prefix="oras-dense-star-release-", dir=str(output_root.parent if output_root.parent.exists() else Path.cwd())))
    profiles: dict[str, dict[str, Any]] = {}
    try:
        for profile in DENSE_STAR_PROFILES:
            profile_id = str(profile["profile_id"])
            profile_root = tmp_root / "profiles" / profile_id
            profile_root.parent.mkdir(parents=True, exist_ok=True)
            profile_report = _build_profile_tiles(
                source_root=source_root,
                output_root=profile_root,
                magnitude_limit=float(profile["magnitude_limit"]),
                tile_order=tile_order,
                release_version=release_version,
                minimum_magnitude=minimum_magnitude,
                profile_id=profile_id,
                profile_label=str(profile["label"]),
                profile_intent=str(profile["profile_intent"]),
                label_mode=str(profile["label_mode"]),
            )
            profiles[profile_id] = {
                "profile_id": profile_id,
                "label": profile["label"],
                "profile_intent": profile["profile_intent"],
                "label_mode": profile["label_mode"],
                "path": f"profiles/{profile_id}",
                "star_count": profile_report["star_count"],
                "source_count": profile_report["source_count"],
                "skipped_count": profile_report["skipped_count"],
                "skipped_reasons": profile_report["skipped_reasons"],
                "source_catalogs": profile_report["source_catalogs"],
                "tile_order": tile_order,
                "tile_count": profile_report["tile_count"],
                "magnitude_limit": profile_report["magnitude_limit"],
                "minimum_magnitude": profile_report["minimum_magnitude"],
                "min_magnitude": profile_report["min_magnitude"],
                "max_magnitude": profile_report["max_magnitude"],
                "byte_size": profile_report["byte_size"],
            }

        deep_profile = profiles.get("deep-catalog") or next(iter(profiles.values()))
        manifest = {
            "schema_version": 1,
            "release_version": release_version,
            "generated_at": utc_now(),
            "rendering_path": "native_swe_star_tiles",
            "source_pack": SOURCE_PACK_ID,
            "source_id_type": "string",
            "default_profile": DEFAULT_PROFILE,
            "profiles": profiles,
            "star_count": deep_profile["star_count"],
            "tile_count": deep_profile["tile_count"],
            "magnitude_limit": deep_profile["magnitude_limit"],
            "tile_order": tile_order,
            "source_catalogs": deep_profile["source_catalogs"],
            "source_attribution": [
                {
                    "name": f"ORAS catalog packs {SOURCE_PACK_ID}",
                    "source_key": "oras_catalog_pack_stars_core",
                    "license_note": "Derived from source-backed catalog packs; see catalog pack manifest for upstream attribution.",
                }
            ],
        }
        (tmp_root / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        report = {
            "release_version": release_version,
            "default_profile": DEFAULT_PROFILE,
            "profiles": profiles,
            "source_count": deep_profile["source_count"],
            "star_count": deep_profile["star_count"],
            "tile_count": deep_profile["tile_count"],
            "output_root": str(output_root),
            "magnitude_limit": deep_profile["magnitude_limit"],
            "minimum_magnitude": minimum_magnitude,
            "source_catalogs": deep_profile["source_catalogs"],
            "byte_size": sum(profile["byte_size"] for profile in profiles.values()) + (tmp_root / "manifest.json").stat().st_size,
        }
        (tmp_root / "build-report.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")

        make_release_tree_readable(tmp_root)
        promote_release_tree(tmp_root, output_root)
        return report
    except Exception:
        shutil.rmtree(tmp_root, ignore_errors=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, default=Path(os.environ.get("ORAS_CATALOG_PACKS_DIR", DEFAULT_SOURCE_ROOT)))
    parser.add_argument("--output-root", type=Path, default=Path(os.environ.get("ORAS_DENSE_STAR_TILES_DIR", DEFAULT_OUTPUT_ROOT)))
    parser.add_argument("--magnitude-limit", type=float, default=float(os.environ.get("ORAS_DENSE_STAR_MAG_LIMIT", DEFAULT_MAGNITUDE_LIMIT)))
    parser.add_argument("--minimum-magnitude", type=float, default=os.environ.get("ORAS_DENSE_STAR_MIN_MAG"))
    parser.add_argument("--tile-order", type=int, default=int(os.environ.get("ORAS_DENSE_STAR_TILE_ORDER", DEFAULT_TILE_ORDER)))
    parser.add_argument("--release-version", default=os.environ.get("ORAS_DENSE_STAR_RELEASE_VERSION", DEFAULT_RELEASE_VERSION))
    args = parser.parse_args()
    minimum_magnitude = args.minimum_magnitude
    if minimum_magnitude is not None:
        minimum_magnitude = float(minimum_magnitude)
    report = build_dense_star_tiles(
        source_root=args.source_root,
        output_root=args.output_root,
        magnitude_limit=args.magnitude_limit,
        tile_order=args.tile_order,
        release_version=args.release_version,
        minimum_magnitude=minimum_magnitude,
    )
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import gzip
import hashlib
import json
import os
from pathlib import Path
import tempfile
from typing import Any, Iterable
import urllib.request
from urllib.parse import urlparse


DEFAULT_SOURCE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE"
DEFAULT_OUTPUT_DIR = Path("data/runtime-packs/satellite-tle/build")
DEFAULT_REQUIRED_NORAD = ("25544", "20580")
DEFAULT_MINIMUM_COUNT = 1000
FEED_FILENAME = "tle_satellite.jsonl.gz"
MANIFEST_FILENAME = "manifest.json"


def _tle_checksum_valid(line: str) -> bool:
    if len(line) != 69 or not line[-1].isdigit():
        return False
    checksum = sum(int(character) for character in line[:68] if character.isdigit())
    checksum += line[:68].count("-")
    return checksum % 10 == int(line[-1])


def _tle_epoch(line1: str) -> datetime:
    token = line1[18:32].strip()
    year_short = int(token[:2])
    year = 1900 + year_short if year_short >= 57 else 2000 + year_short
    return datetime(year, 1, 1, tzinfo=timezone.utc) + timedelta(days=float(token[2:]) - 1.0)


def _format_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _cospar_alias(designation: str) -> str | None:
    compact = designation.strip()
    if len(compact) < 5 or not compact[:5].isdigit():
        return None
    year_short = int(compact[:2])
    year = 1900 + year_short if year_short >= 57 else 2000 + year_short
    return f"COSPAR {year:04d}-{compact[2:]}"


def _normalize_record(name: str, line1: str, line2: str) -> dict[str, Any]:
    if not line1.startswith("1 ") or not line2.startswith("2 "):
        raise ValueError("invalid TLE line prefixes")
    if not _tle_checksum_valid(line1) or not _tle_checksum_valid(line2):
        raise ValueError("invalid TLE checksum")

    source_id = line1[2:7].strip()
    if not source_id.isdigit() or len(source_id) > 5 or line2[2:7].strip() != source_id:
        raise ValueError("mismatched or unsupported NORAD catalog number")
    _tle_epoch(line1)

    display_name = name.removeprefix("0 ").strip() or f"NORAD {source_id}"
    designation = line1[9:17].strip()
    names = [f"NAME {display_name}", f"NORAD {source_id}"]
    if cospar := _cospar_alias(designation):
        names.append(cospar)

    model_data: dict[str, Any] = {
        "norad_number": int(source_id),
        "source_id": source_id,
        "tle": [line1, line2],
    }
    if designation:
        model_data["designation"] = designation
    if "STARLINK" in display_name.upper():
        model_data["group"] = ["Starlink"]
        model_data["subtype"] = "Starlink"

    return {
        "types": ["Asa"],
        "model": "tle_satellite",
        "model_data": model_data,
        "names": names,
        "short_name": display_name,
        "provenance": {
            "source_key": "celestrak_active_gp",
            "source_url": DEFAULT_SOURCE_URL,
        },
    }


def parse_celestrak_3le(payload: str) -> tuple[list[dict[str, Any]], dict[str, int]]:
    lines = [line.rstrip("\r") for line in payload.splitlines() if line.strip()]
    records_by_norad: dict[str, dict[str, Any]] = {}
    input_record_count = 0
    malformed_count = 0
    duplicate_count = 0

    index = 0
    while index < len(lines):
        if lines[index].startswith("1 "):
            name = f"NORAD {lines[index][2:7].strip()}"
            block = lines[index:index + 2]
            index += 2
            if len(block) != 2:
                malformed_count += 1
                break
            line1, line2 = block
        else:
            block = lines[index:index + 3]
            index += 3
            if len(block) != 3:
                malformed_count += 1
                break
            name, line1, line2 = block

        input_record_count += 1
        try:
            record = _normalize_record(name, line1, line2)
        except (IndexError, TypeError, ValueError):
            malformed_count += 1
            continue
        source_id = record["model_data"]["source_id"]
        if source_id in records_by_norad:
            duplicate_count += 1
        records_by_norad[source_id] = record

    records = sorted(records_by_norad.values(), key=lambda record: int(record["model_data"]["source_id"]))
    return records, {
        "input_record_count": input_record_count,
        "output_record_count": len(records),
        "malformed_count": malformed_count,
        "duplicate_count": duplicate_count,
    }


def _nested_gzip_jsonl(records: Iterable[dict[str, Any]]) -> bytes:
    jsonl = b"".join(
        json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("ascii") + b"\n"
        for record in records
    )
    return gzip.compress(gzip.compress(jsonl, compresslevel=9, mtime=0), compresslevel=9, mtime=0)


def _atomic_write(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix=f".{path.name}.", delete=False) as stream:
        stream.write(payload)
        temp_path = Path(stream.name)
    os.replace(temp_path, path)


def build_release(
    *,
    input_path: Path,
    output_dir: Path,
    release_version: str,
    acquired_at: datetime,
    minimum_count: int,
    required_norad: tuple[str, ...],
    source_url: str = DEFAULT_SOURCE_URL,
) -> dict[str, Any]:
    records, stats = parse_celestrak_3le(input_path.read_text(encoding="utf-8", errors="replace"))
    if len(records) < minimum_count:
        raise ValueError(f"satellite record count {len(records)} is below minimum {minimum_count}")

    identities = {record["model_data"]["source_id"] for record in records}
    missing = [source_id for source_id in required_norad if source_id not in identities]
    if missing:
        raise ValueError(f"required NORAD IDs are missing: {', '.join(missing)}")

    epochs = [_tle_epoch(record["model_data"]["tle"][0]) for record in records]
    feed_payload = _nested_gzip_jsonl(records)
    manifest = {
        "schema_version": 1,
        "release_version": release_version,
        "source_key": "celestrak_active_gp",
        "source_url": source_url,
        "acquired_at": _format_utc(acquired_at),
        "record_count": len(records),
        "input_record_count": stats["input_record_count"],
        "malformed_count": stats["malformed_count"],
        "duplicate_count": stats["duplicate_count"],
        "epoch_min": _format_utc(min(epochs)),
        "epoch_max": _format_utc(max(epochs)),
        "feed_filename": FEED_FILENAME,
        "byte_size": len(feed_payload),
        "sha256": hashlib.sha256(feed_payload).hexdigest(),
        "required_norad": {source_id: source_id in identities for source_id in sorted(required_norad)},
        "compression_layers": 2,
        "catalog_number_format": "tle_5_digit",
        "six_digit_catalog_support": False,
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    _atomic_write(output_dir / FEED_FILENAME, feed_payload)
    manifest_payload = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode("utf-8")
    _atomic_write(output_dir / MANIFEST_FILENAME, manifest_payload)
    validate_release(output_dir, minimum_count=minimum_count, required_norad=required_norad)
    return manifest


def _read_nested_records(feed_path: Path) -> list[dict[str, Any]]:
    outer = gzip.decompress(feed_path.read_bytes())
    if not outer.startswith(b"\x1f\x8b"):
        raise ValueError("satellite feed is not double-gzipped")
    payload = gzip.decompress(outer)
    return [json.loads(line) for line in payload.splitlines() if line.strip()]


def read_validated_release(
    output_dir: Path,
    *,
    minimum_count: int = 1,
    required_norad: tuple[str, ...] = DEFAULT_REQUIRED_NORAD,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    manifest_path = output_dir / MANIFEST_FILENAME
    feed_path = output_dir / FEED_FILENAME
    if not manifest_path.is_file() or not feed_path.is_file():
        raise ValueError("satellite release requires manifest.json and tle_satellite.jsonl.gz")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    feed_payload = feed_path.read_bytes()
    if hashlib.sha256(feed_payload).hexdigest() != manifest.get("sha256"):
        raise ValueError("satellite feed checksum mismatch")
    records = _read_nested_records(feed_path)
    if len(records) != manifest.get("record_count") or len(records) < minimum_count:
        raise ValueError("satellite feed record count does not match manifest or minimum")
    identities = [str(record.get("model_data", {}).get("source_id") or "") for record in records]
    if len(identities) != len(set(identities)):
        raise ValueError("satellite feed contains duplicate NORAD identities")
    missing = [source_id for source_id in required_norad if source_id not in identities]
    if missing:
        raise ValueError(f"required NORAD IDs are missing: {', '.join(missing)}")
    return manifest, records


def validate_release(
    output_dir: Path,
    *,
    minimum_count: int = 1,
    required_norad: tuple[str, ...] = DEFAULT_REQUIRED_NORAD,
) -> dict[str, Any]:
    manifest, _ = read_validated_release(
        output_dir,
        minimum_count=minimum_count,
        required_norad=required_norad,
    )
    return manifest


def _download_source(url: str, destination: Path) -> None:
    if urlparse(url).scheme.lower() not in {"http", "https"}:
        raise ValueError("Satellite source URL must use HTTP or HTTPS")
    request = urllib.request.Request(url, headers={"User-Agent": "ORAS-Astronomy-Hub/1.0 satellite-import"})
    with urllib.request.urlopen(request, timeout=120) as response:
        payload = response.read()
    if not payload or b"<html" in payload[:512].lower():
        raise ValueError("CelesTrak returned an empty or HTML response")
    destination.write_bytes(payload)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build or validate an ORAS CelesTrak satellite release")
    parser.add_argument("--input", type=Path)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--release-version", default=os.getenv("ORAS_SATELLITE_RELEASE_VERSION"))
    parser.add_argument("--acquired-at")
    parser.add_argument("--minimum-count", type=int, default=DEFAULT_MINIMUM_COUNT)
    parser.add_argument("--required-norad", action="append")
    parser.add_argument("--source-url", default=DEFAULT_SOURCE_URL)
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    required_norad = tuple(args.required_norad or DEFAULT_REQUIRED_NORAD)

    if args.validate_only:
        manifest = validate_release(args.output, minimum_count=args.minimum_count, required_norad=required_norad)
    else:
        acquired_at = (
            datetime.fromisoformat(args.acquired_at.replace("Z", "+00:00"))
            if args.acquired_at
            else datetime.now(timezone.utc)
        )
        release_version = args.release_version or acquired_at.strftime("%Y.%m.%d.%H%M")
        if args.input:
            input_path = args.input
            manifest = build_release(
                input_path=input_path,
                output_dir=args.output,
                release_version=release_version,
                acquired_at=acquired_at,
                minimum_count=args.minimum_count,
                required_norad=required_norad,
                source_url=args.source_url,
            )
        else:
            with tempfile.TemporaryDirectory(prefix="oras-celestrak-") as temp_dir:
                input_path = Path(temp_dir) / "active.tle"
                _download_source(args.source_url, input_path)
                manifest = build_release(
                    input_path=input_path,
                    output_dir=args.output,
                    release_version=release_version,
                    acquired_at=acquired_at,
                    minimum_count=args.minimum_count,
                    required_norad=required_norad,
                    source_url=args.source_url,
                )

    print(
        "SATELLITE_RELEASE_OK "
        f"release={manifest['release_version']} records={manifest['record_count']} "
        f"epoch_max={manifest['epoch_max']} sha256={manifest['sha256']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

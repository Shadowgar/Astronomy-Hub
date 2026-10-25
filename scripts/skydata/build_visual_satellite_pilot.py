#!/usr/bin/env python3
"""Offline, pinned-source visual pilot. This does not change full-catalog policy."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
from typing import Any

from scripts.skydata.build_oras_satellite_tle_release import (
    FEED_FILENAME, MANIFEST_FILENAME, _atomic_write, _format_utc,
    _nested_gzip_jsonl, _read_nested_records, _tle_epoch, parse_celestrak_3le,
)

SOURCE_PROFILE = "visual_satellite_pilot.v1"
SOURCE_FILENAME = "visual.tle"
SOURCE_MANIFEST_FILENAME = "SHA256SUMS"
PINNED_REVISION = "38a142645e7814b538daaf5868b814550e1f0dda"
PINNED_SOURCE_SHA256 = "63c4c833d967c26c2b3d403de42c234ff6b920969639642a3bedce15225406e2"
PINNED_SOURCE_MANIFEST_SHA256 = "675f8ee1a02dfa915ca996263177cc6962f927ef0ecb3416e0d214a032f20646"
SOURCE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle"
SOURCE_KEY = "celestrak_visual_gp_mirror_pilot"
BASELINE_FILENAME = "baseline-native-feed.jsonl.gz"
BASELINE_SHA256 = "431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436"
PILOT_RECORD_COUNT = 155
REQUIRED_NORAD = ("20580", "25544", "48274")
MAX_AGE_DAYS = 14  # Existing native/API qualification window; propagation is unchanged.


def _utc_time(value: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError("pilot acquisition time must be an ISO-8601 string")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("pilot acquisition time must include a timezone")
    return parsed.astimezone(timezone.utc)


def _validated_source_records(source: bytes, sums: bytes, source_revision: str) -> list[dict[str, Any]]:
    if source_revision != PINNED_REVISION:
        raise ValueError("visual pilot requires the pinned immutable source revision")
    if hashlib.sha256(sums).hexdigest() != PINNED_SOURCE_MANIFEST_SHA256:
        raise ValueError("visual pilot published manifest checksum mismatch")
    if hashlib.sha256(source).hexdigest() != PINNED_SOURCE_SHA256:
        raise ValueError("visual pilot original source checksum mismatch")
    if f"{PINNED_SOURCE_SHA256}  {SOURCE_FILENAME}\n" not in sums.decode("ascii"):
        raise ValueError("visual pilot source digest absent from published manifest")
    records, stats = parse_celestrak_3le(source.decode("ascii"))
    if stats != {"input_record_count": PILOT_RECORD_COUNT, "output_record_count": PILOT_RECORD_COUNT,
                 "malformed_count": 0, "duplicate_count": 0}:
        raise ValueError("visual pilot requires exactly 155 valid, unique checksum pairs")
    identities = {record["model_data"]["source_id"] for record in records}
    if not set(REQUIRED_NORAD).issubset(identities):
        raise ValueError("visual pilot required NORAD identities are missing")
    for record in records:
        # Native exact-name lookup requires canonical decimal NORAD metadata.
        # Keep the original zero-padded TLE fields and all other aliases unchanged.
        source_id = record["model_data"]["source_id"]
        canonical_id = str(int(source_id))
        record["model_data"]["source_id"] = canonical_id
        record["names"] = [f"NORAD {canonical_id}" if name == f"NORAD {source_id}" else name
                           for name in record["names"]]
        record["provenance"] = {"source_key": SOURCE_KEY, "source_url": SOURCE_URL,
                                "source_profile": SOURCE_PROFILE,
                                "transport_revision": PINNED_REVISION,
                                "source_sha256": PINNED_SOURCE_SHA256}
    return records


def _retain_native_photometry(records: list[dict[str, Any]], baseline: list[dict[str, Any]]) -> dict[str, int]:
    """Preserve existing standard magnitudes only for exact NORAD + COSPAR matches."""
    magnitudes = {}
    for record in baseline:
        model = record["model_data"]
        source_id = str(int(model["norad_number"]))
        designator = model["tle"][0][9:17].strip()
        magnitude = model.get("mag")
        if designator and isinstance(magnitude, (int, float)) and not isinstance(magnitude, bool) and math.isfinite(magnitude):
            magnitudes[(source_id, designator)] = magnitude
    matched = 0
    for record in records:
        model = record["model_data"]
        key = (str(int(model["source_id"])), model["tle"][0][9:17].strip())
        if key in magnitudes:
            model["mag"] = magnitudes[key]
            record.setdefault("provenance", {})["standard_magnitude_source"] = "preserved_native_baseline"
            matched += 1
    return {"matched_record_count": matched, "native_default_record_count": len(records) - matched}


def _validated_baseline(path: Path) -> bytes:
    payload = path.read_bytes()
    if hashlib.sha256(payload).hexdigest() != BASELINE_SHA256:
        raise ValueError("visual pilot native baseline checksum mismatch")
    return payload


def _manifest(records: list[dict[str, Any]], payload: bytes, release_version: str,
              acquired_at: datetime, photometry_counts: dict[str, int]) -> dict[str, Any]:
    if not isinstance(release_version, str) or not release_version.strip():
        raise ValueError("visual pilot requires a release version")
    if acquired_at.tzinfo is None:
        raise ValueError("pilot acquisition time must include a timezone")
    epochs = [_tle_epoch(record["model_data"]["tle"][0]) for record in records]
    if any(abs((acquired_at - epoch).total_seconds()) > MAX_AGE_DAYS * 86400 for epoch in epochs):
        raise ValueError("visual pilot original source epochs are not all fresh at acquisition")
    return {
        "schema_version": 1, "release_version": release_version,
        "source_profile": SOURCE_PROFILE, "source_key": SOURCE_KEY, "source_url": SOURCE_URL,
        "acquired_at": _format_utc(acquired_at),
        "acquisition_method": "GitHub immutable-revision retrieval; locally verified source bytes",
        "coverage": {"kind": "visual_subset",
                     "description": "Limited visual-satellite pilot; 155 objects, not the full catalog.",
                     "record_count": PILOT_RECORD_COUNT, "full_catalog": False},
        "transport": {
            "repository": "caelo-works/tle-mirror", "revision": PINNED_REVISION,
            "retrieval_method": "GitHub connector fetch_file, base64 committed blob",
            "retrieval_url": f"https://api.github.com/repos/caelo-works/tle-mirror/contents/tle/visual.tle?ref={PINNED_REVISION}",
            "url": f"https://raw.githubusercontent.com/caelo-works/tle-mirror/{PINNED_REVISION}/tle/visual.tle",
            "blob_sha1": "9cd799b4c016d0b89e38c32bce15f577271b2c89",
            "sha256": PINNED_SOURCE_SHA256,
            "source_filename": SOURCE_FILENAME,
            "published_manifest_filename": SOURCE_MANIFEST_FILENAME,
            "published_manifest_sha256": PINNED_SOURCE_MANIFEST_SHA256,
            "published_manifest_url": f"https://raw.githubusercontent.com/caelo-works/tle-mirror/{PINNED_REVISION}/tle/SHA256SUMS",
            "mirror_fetch_at": "2026-10-25T04:50:13.0828324Z",
            "mirror_run_id": "40163310433", "mirror_job_id": "121079195976",
            "mirror_updated_at": "2026-10-25T04:50:23Z",
            "source_byte_processing": "Mirror normalizes CRLF to LF; retained source TLE values unchanged",
        },
        "authentication": {
            "whole_file_first_party_authenticated": False,
            "official_cross_check": "ISS 25544 only: extracted CelesTrak lines matched; other records not independently authenticated",
            "trust_basis": "Pinned third-party mirror revision and published digest; every TLE checksum, identity and epoch revalidated",
        },
        "photometry": {
            "source": "Preserved native catalog standard magnitudes; orbital epochs are not taken from this baseline",
            "baseline_filename": BASELINE_FILENAME, "baseline_sha256": BASELINE_SHA256,
            "join": "canonical NORAD string + original TLE international designator",
            **photometry_counts,
            "missing_magnitude_behavior": "Magnitude omitted; unchanged native SATELLITE_DEFAULT_MAG 7.0 applies",
            "live_brightness_claim": False,
        },
        "citation": "USSPACECOM 18 SDS GP orbital elements via CelesTrak, redistributed by caelo-works/tle-mirror",
        "freshness_at_acquisition": {"status": "fresh", "fresh_record_count": PILOT_RECORD_COUNT,
                                    "max_tle_age_days": MAX_AGE_DAYS},
        "record_count": len(records), "input_record_count": PILOT_RECORD_COUNT,
        "malformed_count": 0, "duplicate_count": 0,
        "epoch_min": _format_utc(min(epochs)), "epoch_max": _format_utc(max(epochs)),
        "feed_filename": FEED_FILENAME, "byte_size": len(payload),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "required_norad": {source_id: True for source_id in REQUIRED_NORAD},
        "compression_layers": 2, "catalog_number_format": "tle_5_digit",
        "six_digit_catalog_support": False,
        "identity_normalization": "Canonical decimal NORAD metadata and aliases; original zero-padded TLE fields unchanged",
        "rollback": {"base_commit": "7f5ea4d0c069463852698c836b3cd80a13bd75cf",
                     "native_record_count": 14281,
                     "sha256": "431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436",
                     "action": "Remove task preview overrides to restore preserved original native feed"},
    }


def _publish_public_artifact(path: Path, payload: bytes) -> None:
    """Publish public dataset bytes readable by the isolated preview service users."""
    _atomic_write(path, payload)
    path.chmod(0o644)


def build_visual_release(*, input_path: Path, source_manifest_path: Path, output_dir: Path,
                         release_version: str, acquired_at: datetime,
                         native_baseline_path: Path,
                         source_revision: str = PINNED_REVISION) -> dict[str, Any]:
    """Build only the owner-admitted pinned subset, without any download or promotion."""
    source, sums = input_path.read_bytes(), source_manifest_path.read_bytes()
    records = _validated_source_records(source, sums, source_revision)
    baseline_payload = _validated_baseline(native_baseline_path)
    photometry_counts = _retain_native_photometry(records, _read_nested_records(native_baseline_path))
    payload = _nested_gzip_jsonl(records)
    manifest = _manifest(records, payload, release_version, acquired_at, photometry_counts)
    output_dir.mkdir(parents=True, exist_ok=True)
    _publish_public_artifact(output_dir / SOURCE_FILENAME, source)
    _publish_public_artifact(output_dir / SOURCE_MANIFEST_FILENAME, sums)
    _publish_public_artifact(output_dir / BASELINE_FILENAME, baseline_payload)
    _publish_public_artifact(output_dir / FEED_FILENAME, payload)
    _publish_public_artifact(output_dir / MANIFEST_FILENAME, (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode())
    read_validated_visual_release(output_dir)
    return manifest


def read_validated_visual_release(output_dir: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Verify claims against pinned original bytes and actual normalized native records.

    A self-consistent modified feed/manifest hash is insufficient. Both original
    source artifacts must match immutable pins, and all native records must match
    their complete source-derived representation, including absence of fake values.
    Freshness here refers to acquisition; the API separately ages original epochs.
    """
    manifest = json.loads((output_dir / MANIFEST_FILENAME).read_text(encoding="utf-8"))
    if not isinstance(manifest, dict) or not isinstance(manifest.get("transport"), dict):
        raise ValueError("visual pilot manifest and transport must be objects")
    records = _validated_source_records((output_dir / SOURCE_FILENAME).read_bytes(),
                                      (output_dir / SOURCE_MANIFEST_FILENAME).read_bytes(),
                                      manifest.get("transport", {}).get("revision"))
    baseline_path = output_dir / BASELINE_FILENAME
    _validated_baseline(baseline_path)
    photometry_counts = _retain_native_photometry(records, _read_nested_records(baseline_path))
    payload = (output_dir / FEED_FILENAME).read_bytes()
    if hashlib.sha256(payload).hexdigest() != manifest.get("sha256"):
        raise ValueError("visual pilot native feed checksum mismatch")
    native_records = _read_nested_records(output_dir / FEED_FILENAME)
    if native_records != records:
        raise ValueError("visual pilot native records differ from pinned source records")
    expected = _manifest(records, payload, manifest.get("release_version"), _utc_time(manifest.get("acquired_at", "")), photometry_counts)
    if manifest != expected:
        raise ValueError("visual pilot manifest profile, coverage or provenance does not match pinned source")
    return manifest, native_records


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path)
    parser.add_argument("--source-manifest", type=Path)
    parser.add_argument("--native-baseline", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--release-version")
    parser.add_argument("--acquired-at")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    if args.validate_only:
        manifest, _ = read_validated_visual_release(args.output)
    else:
        if not all((args.input, args.source_manifest, args.release_version, args.acquired_at, args.native_baseline)):
            parser.error("build requires --input, --source-manifest, --native-baseline, --release-version and --acquired-at")
        manifest = build_visual_release(input_path=args.input, source_manifest_path=args.source_manifest,
                                        output_dir=args.output, release_version=args.release_version,
                                        acquired_at=_utc_time(args.acquired_at), native_baseline_path=args.native_baseline)
    print(f"VISUAL_SATELLITE_PILOT_OK profile={SOURCE_PROFILE} release={manifest['release_version']} "
          f"records={manifest['record_count']} sha256={manifest['sha256']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

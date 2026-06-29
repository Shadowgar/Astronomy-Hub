from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from scripts.skydata.catalog_pack import (
    CatalogPackSpec,
    build_catalog_release,
    validate_catalog_release,
)


def _record(source_id: str, *, name: str | None = None) -> dict:
    return {
        "catalog": "Test Catalog",
        "source_id": source_id,
        "model": "star",
        "display_name": name or f"Test {source_id}",
        "category": "stars",
        "ra": 12.5,
        "dec": -4.25,
        "magnitude": 6.2,
        "aliases": [f"T {source_id}"],
        "source_attribution": [
            {
                "name": "Test Authority",
                "source_key": "test_authority",
                "source_url": "https://example.test/catalog",
                "license_note": "Test fixture terms",
                "version": "2026.1",
            }
        ],
    }


def _spec() -> CatalogPackSpec:
    return CatalogPackSpec(
        pack_id="stars-core",
        label="Stars Core",
        category="stars",
        version="2026.06",
        sources=(
            {
                "name": "Test Authority",
                "source_key": "test_authority",
                "source_url": "https://example.test/catalog",
                "license_note": "Test fixture terms",
                "version": "2026.1",
            },
        ),
        overlay_limit=25,
    )


def test_catalog_release_writes_bounded_chunks_and_checksums(tmp_path: Path) -> None:
    manifest = build_catalog_release(
        tmp_path,
        release_version="2026.06",
        generated_at="2026-06-23T06:00:00Z",
        packs=[(_spec(), [_record("1"), _record("2"), _record("3")])],
        chunk_size=2,
    )

    pack = manifest["packs"][0]
    assert manifest["schema_version"] == 1
    assert manifest["release_version"] == "2026.06"
    assert pack["object_count"] == 3
    assert pack["browser_index_count"] == 3
    assert [chunk["object_count"] for chunk in pack["chunks"]] == [2, 1]
    assert pack["overlay_limit"] == 25

    for chunk in pack["chunks"]:
        chunk_path = tmp_path / chunk["path"]
        payload = chunk_path.read_bytes()
        assert chunk["byte_size"] == len(payload)
        assert chunk["sha256"] == hashlib.sha256(payload).hexdigest()
        records = [json.loads(line) for line in payload.decode("utf-8").splitlines()]
        assert all(isinstance(record["source_id"], str) for record in records)

    assert validate_catalog_release(tmp_path) == []


def test_catalog_release_rejects_numeric_and_duplicate_source_ids(tmp_path: Path) -> None:
    numeric = _record("2252802052894084352")
    numeric["source_id"] = 2252802052894084352

    with pytest.raises(ValueError, match="source_id must be a string"):
        build_catalog_release(
            tmp_path / "numeric",
            release_version="2026.06",
            generated_at="2026-06-23T06:00:00Z",
            packs=[(_spec(), [numeric])],
        )

    with pytest.raises(ValueError, match="duplicate catalog identity"):
        build_catalog_release(
            tmp_path / "duplicate",
            release_version="2026.06",
            generated_at="2026-06-23T06:00:00Z",
            packs=[(_spec(), [_record("1"), _record("1")])],
        )


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("source_attribution", [], "source_attribution"),
        ("ra", None, "finite ra"),
        ("dec", 91, "dec must be between"),
        ("catalog", "", "catalog is required"),
    ],
)
def test_catalog_release_rejects_unattributed_or_invalid_records(
    tmp_path: Path,
    field: str,
    value,
    message: str,
) -> None:
    record = _record("1")
    record[field] = value

    with pytest.raises(ValueError, match=message):
        build_catalog_release(
            tmp_path,
            release_version="2026.06",
            generated_at="2026-06-23T06:00:00Z",
            packs=[(_spec(), [record])],
        )


def test_catalog_release_validation_reports_tampered_chunks(tmp_path: Path) -> None:
    manifest = build_catalog_release(
        tmp_path,
        release_version="2026.06",
        generated_at="2026-06-23T06:00:00Z",
        packs=[(_spec(), [_record("1")])],
    )
    chunk_path = tmp_path / manifest["packs"][0]["chunks"][0]["path"]
    chunk_path.write_text("{}\n", encoding="utf-8")

    errors = validate_catalog_release(tmp_path)

    assert any("checksum mismatch" in error for error in errors)
    assert any("byte size mismatch" in error for error in errors)


def test_catalog_release_validation_reports_non_utf8_chunks(tmp_path: Path) -> None:
    manifest = build_catalog_release(
        tmp_path,
        release_version="2026.06",
        generated_at="2026-06-23T06:00:00Z",
        packs=[(_spec(), [_record("1")])],
    )
    chunk_path = tmp_path / manifest["packs"][0]["chunks"][0]["path"]
    chunk_path.write_bytes(b"\xff\xfe\xfd")

    errors = validate_catalog_release(tmp_path)

    assert any("not UTF-8" in error for error in errors)

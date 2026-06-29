from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.catalog_pack_service import (
    load_catalog_pack_index,
    lookup_catalog_pack_object,
    search_catalog_packs,
)
from backend.app.services.sky_catalog_service import build_sky_search_payload
from scripts.skydata.catalog_pack import CatalogPackSpec, build_catalog_release


client = TestClient(app)


def _source(name: str) -> dict:
    return {
        "name": name,
        "source_key": name.lower().replace(" ", "_"),
        "source_url": f"https://example.test/{name.lower().replace(' ', '-')}",
        "license_note": "Test fixture terms",
        "version": "2026.1",
    }


def _spec(pack_id: str, category: str) -> CatalogPackSpec:
    return CatalogPackSpec(
        pack_id=pack_id,
        label=pack_id.replace("-", " ").title(),
        category=category,
        version="2026.06",
        sources=(_source(pack_id),),
        overlay_limit=5,
    )


def _record(catalog: str, source_id: str, model: str, name: str, category: str) -> dict:
    return {
        "catalog": catalog,
        "source_id": source_id,
        "model": model,
        "display_name": name,
        "category": category,
        "ra": 10.5,
        "dec": 41.2,
        "aliases": [f"Alias {source_id}"],
        "types": ["*" if model == "star" else "G"],
        "source_attribution": [_source(catalog)],
    }


def _build_release(root: Path) -> None:
    build_catalog_release(
        root,
        release_version="2026.06",
        generated_at="2026-06-23T06:00:00Z",
        packs=[
            (
                _spec("stars-core", "stars"),
                [_record("Gaia DR3", "5853498713190525696", "star", "Gaia DR3 proof star", "stars")],
            ),
            (
                _spec("dso-expanded", "dsos"),
                [_record("Arp", "Arp 220", "dso", "Arp 220", "dsos")],
            ),
        ],
        chunk_size=1,
    )


def test_catalog_pack_index_loads_status_search_and_exact_identity(tmp_path: Path) -> None:
    _build_release(tmp_path)

    index = load_catalog_pack_index(tmp_path)
    results = search_catalog_packs("Gaia DR3 5853498713190525696", path=tmp_path)
    exact = lookup_catalog_pack_object(
        "Gaia DR3",
        "5853498713190525696",
        "star",
        path=tmp_path,
    )

    assert index.mounted is True
    assert index.release_version == "2026.06"
    assert index.object_count == 2
    assert [pack["status"] for pack in index.pack_statuses] == ["loaded", "loaded"]
    assert results[0]["source_id"] == "5853498713190525696"
    assert isinstance(results[0]["source_id"], str)
    assert exact["pack_id"] == "stars-core"
    assert exact["pack_version"] == "2026.06"
    assert exact["indexed"] is True
    assert "source_id=5853498713190525696" in exact["sky_engine_url"]


def test_catalog_pack_index_isolates_a_tampered_pack(tmp_path: Path) -> None:
    _build_release(tmp_path)
    manifest = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    bad_chunk = tmp_path / manifest["packs"][1]["chunks"][0]["path"]
    bad_chunk.write_text("{}\n", encoding="utf-8")

    index = load_catalog_pack_index(tmp_path)

    assert index.object_count == 1
    assert index.pack_statuses[0]["status"] == "loaded"
    assert index.pack_statuses[1]["status"] == "failed"
    assert "checksum" in index.pack_statuses[1]["error"]
    assert search_catalog_packs("Gaia DR3", path=tmp_path)
    assert search_catalog_packs("Arp 220", path=tmp_path) == []


def test_catalog_pack_index_reloads_when_chunk_file_changes(tmp_path: Path) -> None:
    _build_release(tmp_path)
    assert search_catalog_packs("Arp 220", path=tmp_path)
    manifest = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    bad_chunk = tmp_path / manifest["packs"][1]["chunks"][0]["path"]
    bad_chunk.write_text("{}\n", encoding="utf-8")

    assert search_catalog_packs("Arp 220", path=tmp_path) == []


def test_catalog_pack_loader_rejects_symlink_chunk_escape(tmp_path: Path) -> None:
    _build_release(tmp_path)
    manifest = json.loads((tmp_path / "manifest.json").read_text(encoding="utf-8"))
    outside = tmp_path.parent / f"{tmp_path.name}-outside.jsonl"
    outside.write_text("{}\n", encoding="utf-8")
    linked = tmp_path / "packs" / "stars-core" / "chunk-escape.jsonl"
    linked.symlink_to(outside)
    manifest["packs"][0]["chunks"][0]["path"] = "packs/stars-core/chunk-escape.jsonl"
    (tmp_path / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")

    index = load_catalog_pack_index(tmp_path)

    assert index.object_count == 1
    assert index.pack_statuses[0]["status"] == "failed"
    assert "unsafe chunk path" in index.pack_statuses[0]["error"]


def test_missing_catalog_pack_mount_falls_back_without_breaking_existing_search(
    tmp_path: Path,
    monkeypatch,
) -> None:
    missing = tmp_path / "missing"
    monkeypatch.setenv("ORAS_CATALOG_PACKS_DIR", str(missing))

    index = load_catalog_pack_index()
    existing = build_sky_search_payload("M31")["data"]["results"]

    assert index.mounted is False
    assert index.pack_statuses == ()
    assert existing
    assert existing[0]["source_id"] == "M31"


def test_catalog_pack_api_and_sky_search_use_mounted_release(tmp_path: Path, monkeypatch) -> None:
    _build_release(tmp_path)
    monkeypatch.setenv("ORAS_CATALOG_PACKS_DIR", str(tmp_path))

    status_response = client.get("/api/sky/catalog-packs", headers={"User-Agent": "pytest"})
    search_response = client.get(
        "/api/sky/search?q=Arp%20220",
        headers={"User-Agent": "pytest"},
    )
    exact_response = client.get(
        "/api/sky/object?catalog=Arp&source_id=Arp%20220&model=dso",
        headers={"User-Agent": "pytest"},
    )

    assert status_response.status_code == 200
    assert status_response.json()["data"]["object_count"] == 2
    assert search_response.status_code == 200
    assert search_response.json()["data"]["results"][0]["source_id"] == "Arp 220"
    assert exact_response.status_code == 200
    assert exact_response.json()["data"]["pack_id"] == "dso-expanded"

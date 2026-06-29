from __future__ import annotations

import gzip
import json
from pathlib import Path

import pytest

from scripts.skydata.catalog_sources.common import sexagesimal_dec, sexagesimal_ra
from scripts.skydata.catalog_sources.dsos import load_openngc, load_vizier_dsos
from scripts.skydata.catalog_sources.doubles import load_wds
from scripts.skydata.catalog_sources.stars import load_hipparcos, load_vizier_stars
from scripts.skydata.catalog_sources.unusual import load_atnf, load_vizier_unusual
from scripts.skydata.catalog_sources.release import CatalogReleaseInputs, build_source_release, drop_ambiguous_identities
from scripts.skydata.catalog_sources.acquisition import (
    VIZIER_ACQUISITIONS,
    _validate_download_payload,
    default_release_inputs,
)


def _write_vizier(path: Path, columns: list[str], rows: list[list[str]]) -> Path:
    separator = ["-" * max(3, len(column)) for column in columns]
    path.write_text(
        "# VizieR source fixture\n"
        + "\t".join(columns)
        + "\n"
        + "\t".join(["deg" if column.startswith("_") else "" for column in columns])
        + "\n"
        + "\t".join(separator)
        + "\n"
        + "\n".join("\t".join(row) for row in rows)
        + "\n",
        encoding="utf-8",
    )
    return path


def test_star_adapters_preserve_string_ids_and_source_backed_fields(tmp_path: Path) -> None:
    hip_path = tmp_path / "hip.json"
    hip_path.write_text(
        json.dumps(
            [
                {
                    "id": "hip-25336",
                    "name": "HIP 25336",
                    "right_ascension": 5.418852,
                    "declination": 6.349735,
                    "magnitude": 1.64,
                    "color_index": -0.224,
                }
            ]
        ),
        encoding="utf-8",
    )
    hip = list(load_hipparcos(hip_path))
    assert hip[0]["source_id"] == "hip-25336"
    assert hip[0]["ra"] == 81.28278
    assert hip[0]["color_index"] == -0.224

    gaia_path = _write_vizier(
        tmp_path / "gaia.tsv",
        ["_RAJ2000", "_DEJ2000", "Source", "Gmag", "BP-RP", "Plx", "pmRA", "pmDE", "RV", "Teff"],
        [["217.392", "-62.676", "5853498713190525696", "7.10", "0.82", "12.5", "-15.2", "4.1", "22.3", "5772"]],
    )
    gaia = list(load_vizier_stars(gaia_path, "gaia_dr3"))
    assert gaia[0]["source_id"] == "5853498713190525696"
    assert isinstance(gaia[0]["source_id"], str)
    assert gaia[0]["catalog"] == "Gaia DR3"
    assert gaia[0]["temperature_k"] == 5772.0


def test_dso_adapters_cover_openngc_and_named_catalog_families(tmp_path: Path) -> None:
    openngc_path = tmp_path / "openngc.json.gz"
    with gzip.open(openngc_path, "wt", encoding="utf-8") as handle:
        json.dump(
            {
                "records": [
                    {
                        "catalog": "NGC (OpenNGC)",
                        "source_id": "NGC6543",
                        "model": "dso",
                        "display_name": "NGC 6543 Cat's Eye Nebula",
                        "ra": 269.6392,
                        "dec": 66.6332,
                        "aliases": ["C 6", "C6", "Cat's Eye Nebula"],
                        "types": ["PN"],
                        "object_type": "planetary_nebula",
                        "provenance": {"source_key": "openngc_local", "license_note": "CC-BY-SA-4.0"},
                    }
                ]
            },
            handle,
        )
    openngc = list(load_openngc(openngc_path))
    assert "C6" in openngc[0]["aliases"]
    assert "Caldwell 6" in openngc[0]["aliases"]
    assert openngc[0]["object_type"] == "planetary_nebula"

    barnard_path = _write_vizier(
        tmp_path / "barnard.tsv",
        ["_RAJ2000", "_DEJ2000", "Barn", "Diam"],
        [["053.2392", "+31.1592", "1", "30.0"]],
    )
    barnard = list(load_vizier_dsos(barnard_path, "barnard"))
    assert barnard[0]["source_id"] == "B1"
    assert barnard[0]["aliases"] == ["B 1", "Barnard 1"]
    assert barnard[0]["angular_size"]["major_arcmin"] == 30.0

    cluster_path = _write_vizier(
        tmp_path / "clusters.tsv",
        ["_RAJ2000", "_DEJ2000", "Cluster", "Diam"],
        [["111.0", "-20.0", "Collinder 140", "15"]],
    )
    cluster = list(load_vizier_dsos(cluster_path, "open_clusters"))[0]
    assert cluster["catalog"] == "Collinder (Dias)"
    assert {"Cr 140", "Cr140"} <= set(cluster["aliases"])


def test_wds_adapter_keeps_system_and_component_measurements(tmp_path: Path) -> None:
    path = _write_vizier(
        tmp_path / "wds.tsv",
        ["_RAJ2000", "_DEJ2000", "WDS", "Disc", "Comp", "pa2", "sep2", "mag1", "mag2"],
        [["101.287", "-16.716", "06451-1643", "STF 1005", "AB", "73", "7.50", "-1.46", "8.50"]],
    )
    record = list(load_wds(path))[0]
    assert record["source_id"] == "06451-1643:STF1005:AB"
    assert "STF 1005" in record["aliases"]
    assert record["double_star"] == {
        "component": "AB",
        "position_angle_deg": 73.0,
        "separation_arcsec": 7.5,
        "primary_magnitude": -1.46,
        "secondary_magnitude": 8.5,
    }


def test_unusual_adapters_cover_atnf_quasar_and_blackcat(tmp_path: Path) -> None:
    atnf_path = tmp_path / "psrcat.db"
    atnf_path.write_text(
        "PSRJ J0437-4715\nRAJ 04:37:15.9\nDECJ -47:15:09\nP0 0.005757\nS1400 150.2\n@----------------\n"
        "PSRJ BROKEN\nRAJ bad\nDECJ bad\n@----------------\n",
        encoding="utf-8",
    )
    pulsars = list(load_atnf(atnf_path))
    assert [record["source_id"] for record in pulsars] == ["J0437-4715"]
    assert pulsars[0]["period_seconds"] == 0.005757

    quasar_path = _write_vizier(
        tmp_path / "milliquas.tsv",
        ["_RAJ2000", "_DEJ2000", "Name", "Type", "Rmag", "Bmag", "z"],
        [["0.0006286", "+35.5178439", "SDSS J000000.15+353104.2", "Q", "17.93", "19.00", "0.845"]],
    )
    quasar = list(load_vizier_unusual(quasar_path, "milliquas"))[0]
    assert quasar["object_type"] == "quasar"
    assert quasar["redshift"] == 0.845

    zero_mag_path = _write_vizier(
        tmp_path / "milliquas_zero.tsv",
        ["_RAJ2000", "_DEJ2000", "Name", "Type", "Rmag", "Bmag", "z"],
        [["0.0006286", "+35.5178439", "ZERO QSO", "Q", "0.0", "19.00", "0.1"]],
    )
    zero_mag = list(load_vizier_unusual(zero_mag_path, "milliquas"))[0]
    assert zero_mag["magnitude"] == 0.0

    blackcat_path = _write_vizier(
        tmp_path / "blackcat.tsv",
        ["_RAJ2000", "_DEJ2000", "Name", "Dist", "Noutb"],
        [["266.365375", "-29.331619", "IGR J17454-2919", "7.0", "1"]],
    )
    black_hole = list(load_vizier_unusual(blackcat_path, "blackcat"))[0]
    assert black_hole["object_type"] == "black_hole_candidate"
    assert black_hole["distance_pc"] == 7000.0


def test_adapters_skip_rows_without_real_coordinates(tmp_path: Path) -> None:
    path = _write_vizier(
        tmp_path / "missing.tsv",
        ["_RAJ2000", "_DEJ2000", "Source", "Gmag"],
        [["", "", "123", "8.2"]],
    )
    assert list(load_vizier_stars(path, "gaia_dr3")) == []


def test_source_release_builds_four_valid_packs(tmp_path: Path) -> None:
    hip_path = tmp_path / "hip.json"
    hip_path.write_text(
        json.dumps(
            [{"id": "hip-1", "name": "HIP 1", "right_ascension": 1.0, "declination": 2.0}]
        ),
        encoding="utf-8",
    )
    openngc_path = tmp_path / "openngc.json.gz"
    with gzip.open(openngc_path, "wt", encoding="utf-8") as handle:
        json.dump(
            {
                "objects": [
                    {
                        "catalog": "NGC (OpenNGC)",
                        "source_id": "NGC0001",
                        "model": "dso",
                        "display_name": "NGC 1",
                        "ra": 1.0,
                        "dec": 2.0,
                        "types": ["G"],
                        "object_type": "galaxy",
                    }
                ]
            },
            handle,
        )
    gaia = _write_vizier(
        tmp_path / "gaia.tsv",
        ["_RAJ2000", "_DEJ2000", "Source", "Gmag"],
        [["2", "3", "5853498713190525696", "8"]],
    )
    barnard = _write_vizier(
        tmp_path / "barnard.tsv",
        ["_RAJ2000", "_DEJ2000", "Barn", "Diam"],
        [["3", "4", "1", "30"]],
    )
    wds = _write_vizier(
        tmp_path / "wds.tsv",
        ["_RAJ2000", "_DEJ2000", "WDS", "Disc", "Comp", "pa2", "sep2", "mag1", "mag2"],
        [["4", "5", "00000+0000", "STF 1", "AB", "50", "2", "7", "8"]],
    )
    atnf = tmp_path / "psrcat.db"
    atnf.write_text("PSRJ J0000+0000\nRAJ 00:00:01\nDECJ +00:00:01\n@\n", encoding="utf-8")
    blackcat = _write_vizier(
        tmp_path / "blackcat.tsv",
        ["_RAJ2000", "_DEJ2000", "Name", "Dist"],
        [["5", "6", "BH Test", "1"]],
    )

    manifest = build_source_release(
        CatalogReleaseInputs(
            hipparcos=hip_path,
            openngc=openngc_path,
            star_sources=(("gaia_dr3", gaia),),
            dso_sources=(("barnard", barnard),),
            wds=wds,
            atnf=atnf,
            unusual_sources=(("blackcat", blackcat),),
        ),
        tmp_path / "release",
        release_version="2026.06-test",
        generated_at="2026-06-23T00:00:00Z",
        chunk_size=2,
    )

    assert manifest["pack_count"] == 4
    assert manifest["object_count"] == 7
    assert {pack["pack_id"] for pack in manifest["packs"]} == {
        "stars-core",
        "dso-expanded",
        "double-stars",
        "unusual-objects",
    }


def test_acquisition_manifest_covers_required_release_families(tmp_path: Path) -> None:
    profiles = {(source.family, source.profile) for source in VIZIER_ACQUISITIONS}
    assert {
        ("stars", "gaia_dr3"),
        ("stars", "tycho2"),
        ("stars", "gliese"),
        ("dsos", "open_clusters"),
        ("dsos", "barnard"),
        ("dsos", "lbn"),
        ("dsos", "ldn"),
        ("dsos", "sharpless"),
        ("dsos", "arp"),
        ("dsos", "markarian"),
        ("dsos", "3c"),
        ("double-stars", "wds"),
        ("unusual-objects", "milliquas"),
        ("unusual-objects", "blackcat"),
    } <= profiles
    inputs = default_release_inputs(tmp_path / "sources", tmp_path / "repo")
    assert inputs.hipparcos.name == "hipparcos_tier2_subset.json"
    assert inputs.openngc.name == "openngc_dso_catalog.json.gz"
    assert inputs.atnf.name == "psrcat.db"
    expensive_profiles = {"gaia_dr3", "tycho2", "wds", "milliquas"}
    assert all(source.sort is None for source in VIZIER_ACQUISITIONS if source.profile in expensive_profiles)


def test_vizier_download_validation_rejects_html_and_malformed_tsv(tmp_path: Path) -> None:
    with pytest.raises(RuntimeError, match="HTML"):
        _validate_download_payload(b"<html>blocked</html>", url="https://example.test", destination=tmp_path / "bad.tsv")

    with pytest.raises(RuntimeError, match="expected VizieR TSV"):
        _validate_download_payload(b"name,value\none,two\n", url="https://example.test", destination=tmp_path / "bad.tsv")

    _validate_download_payload(
        b"_RAJ2000\t_DEJ2000\tName\n1\t2\tok\n",
        url="https://example.test",
        destination=tmp_path / "good.tsv",
    )


def test_sexagesimal_parsers_reject_impossible_values() -> None:
    assert sexagesimal_ra("04:37:15.9") is not None
    assert sexagesimal_dec("-47:15:09") is not None
    assert sexagesimal_ra("99:99:99") is None
    assert sexagesimal_ra("24:00:00") is None
    assert sexagesimal_dec("+90:00:01") is None
    assert sexagesimal_dec("-91:00:00") is None


def test_release_omits_ambiguous_source_identities_instead_of_fabricating_suffixes() -> None:
    records = [
        {"catalog": "Gliese CNS3", "source_id": "Gl 4", "model": "star", "ra": 1},
        {"catalog": "Gliese CNS3", "source_id": "Gl 4", "model": "star", "ra": 2},
        {"catalog": "Gliese CNS3", "source_id": "Gl 5", "model": "star", "ra": 3},
    ]
    assert drop_ambiguous_identities(records) == [records[2]]

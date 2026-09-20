"""Fail-closed release schema and compiled, upstream-native reader fixtures."""
from __future__ import annotations

import importlib.util
import json
import math
from pathlib import Path
import shutil
import struct
import subprocess

import pytest

ROOT = Path(__file__).resolve().parents[2]
SWE = ROOT / "vendor/stellarium-web-engine"


def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts/skydata" / f"{name}.py")
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


@pytest.fixture
def golden_tile(tmp_path):
    # Sirius-like measured values plus explicit edge-case validation fixtures;
    # these controlled fixtures are never installed as production catalog data.
    base = dict(gaia=0, hip=32349, vmag=-1.46, gmag=-1.1, ra_rad=1.767,
                de_rad=-0.291, plx_arcsec=0.37921, pra_rad_year=-2.64e-6,
                pde_rad_year=-5.93e-6, epoch=2000.0, bv=0.009,
                ids="NAME Sirius|HIP 32349", spectral_type="A1V")
    stars = [base, dict(base, hip=0, vmag=0.0, gmag=2.0, bv=0.65,
                       ids="NAME Zero magnitude fixture"),
             dict(base, gaia=4034171629042489088, hip=0, vmag=math.nan,
                  gmag=9.3, bv=math.nan, epoch=2016.0,
                  ids="GAIA 4034171629042489088", spectral_type="")]
    path = tmp_path / "golden.eph"
    module("build_oras_dense_star_tiles").write_star_tile(path, 3, 447, stars)
    return path


def star_payload(path):
    return next(data for kind, data in module("validate_oras_dense_star_tiles").read_eph_chunks(path.read_bytes()) if kind == "STAR")


@pytest.mark.parametrize("column", range(14))
@pytest.mark.parametrize("field", ["name", "type", "unit", "offset", "size"])
def test_rejects_changed_required_star_schema(golden_tile, column, field):
    payload = bytearray(star_payload(golden_tile))
    offset = 28 + column * 20
    if field == "name":
        # Includes the historical vmag -> vma\0, gaia -> gai\0 defect.
        raw = payload[offset:offset + 4]
        last = len(raw.rstrip(b"\0")) - 1
        payload[offset + last] = 0
    elif field == "type":
        payload[offset + 5] = ord("x")  # Exact four-byte type, not first char.
    else:
        delta = {"unit": 8, "offset": 12, "size": 16}[field]
        value = struct.unpack_from("<i", payload, offset + delta)[0]
        struct.pack_into("<i", payload, offset + delta, value + 1)
    with pytest.raises(ValueError, match="STAR.*(schema|column)"):
        module("validate_oras_dense_star_tiles").validate_star_chunk(payload, 3, 447)


@pytest.mark.parametrize("offset,value", [(0, 4), (16, 341), (20, 13), (24, -1)])
def test_rejects_invalid_star_table_header(golden_tile, offset, value):
    payload = bytearray(star_payload(golden_tile))
    struct.pack_into("<i", payload, offset, value)
    with pytest.raises(ValueError):
        module("validate_oras_dense_star_tiles").validate_star_chunk(payload, 3, 447)


@pytest.fixture(scope="session")
def native_reader(tmp_path_factory):
    compiler = shutil.which("cc")
    assert compiler, "Native conformance requires a C compiler; do not silently skip"
    exe = tmp_path_factory.mktemp("native-star-reader") / "probe"
    include = [SWE / "src", *(SWE / "ext_src" / p for p in ["json", "uthash", "erfa", "inih"])]
    command = [compiler, "-std=gnu99", "-O2", "-D_GNU_SOURCE", *[f"-I{p}" for p in include],
               str(ROOT / "scripts/skydata/native_star_reader_probe.c"),
               str(SWE / "src/eph-file.c"),
               str(SWE / "ext_src/json/json.c"), "-lz", "-lm", "-o", str(exe)]
    result = subprocess.run(command, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    return exe


def test_golden_values_round_trip_through_actual_native_reader(golden_tile, native_reader):
    validator = module("validate_oras_dense_star_tiles")
    assert validator.validate_star_chunk(star_payload(golden_tile), 3, 447) == 3
    result = subprocess.run([str(native_reader), str(golden_tile)], check=True, capture_output=True, text=True)
    rows = [json.loads(line) for line in result.stdout.splitlines()]
    assert [r["render_magnitude"] for r in rows] == pytest.approx([-1.46, 0.0, 9.3])
    assert rows[2]["vmag"] is None and rows[2]["gmag"] == pytest.approx(9.3)
    assert rows[0]["bv"] == pytest.approx(0.009)
    assert rows[1]["bv"] == pytest.approx(0.65)
    assert rows[2]["bv"] is None
    assert rows[2]["gaia"] == "4034171629042489088"
    assert rows[0]["hip"] == 32349 and rows[0]["spectrum"] == "A1V"
    assert rows[0]["pra"] == pytest.approx(-2.64e-6)
    assert rows[0]["pde"] == pytest.approx(-5.93e-6)
    assert rows[0]["plx"] == pytest.approx(0.37921)
    assert [r["epoch"] for r in rows] == [2000.0, 2000.0, 2016.0]


@pytest.fixture(scope="session")
def native_behavior(tmp_path_factory):
    work = tmp_path_factory.mktemp("native-star-behavior")
    source = (SWE / "src/modules/stars.c").read_text()
    # Compile the actual functions, omitting only GL-bound class registration.
    marker = "/*\n * Meta class declarations."
    assert source.count(marker) == 1
    binding = work / "binding.c"
    binding.write_text(source.split(marker)[0] + (ROOT / "scripts/skydata/native_star_behavior_probe.c").read_text())
    # The actual HiPS iterator is also used; transport is the stub above.
    hips = (SWE / "src/hips.c").read_text()
    begin = hips.index("void hips_iter_init(")
    end = hips.index("\n}", hips.index("void hips_iter_push_children(", begin)) + 2
    with binding.open("a") as handle:
        handle.write("\n" + hips[begin:end])
    exe = work / "probe"
    includes = [SWE / "src", *(SWE / "ext_src" / p for p in ["json", "uthash", "erfa", "inih"])]
    command = ["cc", "-std=gnu99", "-O2", "-D_GNU_SOURCE", "-ffunction-sections", "-fdata-sections",
               *[f"-I{p}" for p in includes], str(binding),
               str(SWE / "src/utils/utils_json.c"), str(SWE / "src/eph-file.c"), str(SWE / "ext_src/json/json.c"),
               str(SWE / "ext_src/json/json-builder.c"), str(SWE / "ext_src/erfa/erfa.c"),
               "-Wl,--gc-sections", "-lm", "-lz", "-o", str(exe)]
    result = subprocess.run(command, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    return exe


def native_output(native_behavior, mode):
    return subprocess.run([str(native_behavior), mode], check=True, capture_output=True, text=True).stdout.strip()


def test_dynamic_native_star_preserves_bv_and_spectrum(native_behavior):
    color, spectrum = native_output(native_behavior, "color").split()
    assert float(color) == pytest.approx(0.65)
    assert spectrum == "G2V"


def test_unknown_color_and_small_parallax_match_tile_semantics(native_behavior):
    unknown, parallax = native_output(native_behavior, "unknown").split()
    assert unknown == "1"
    assert float(parallax) == 0.0


def test_julian_j2000_epoch_does_not_add_besselian_shift(native_behavior):
    assert float(native_output(native_behavior, "epoch")) < 1e-12


def test_parallax_threshold_applies_to_same_float32_value_for_json_and_tiles(native_behavior):
    assert native_output(native_behavior, "parallax-boundary") == "1"


def test_generic_search_reaches_minimum_order_without_parent_tiles(native_behavior):
    found, requests, below_minimum = map(int, native_output(native_behavior, "search").split())
    assert found == 1
    assert below_minimum == 0
    assert requests <= 768


def test_direct_lookup_uses_one_tile_and_preserves_large_identity(native_behavior):
    assert native_output(native_behavior, "lookup") == "1 200 1 1 404 1 0 1 400"


def test_familiar_labels_skip_numeric_aliases_but_selection_still_labels(native_behavior):
    assert native_output(native_behavior, "labels") == "Sirius||HIP 2|Betelgeuse"


def test_native_tile_and_materialized_star_have_identical_science(golden_tile, native_behavior):
    result = subprocess.run([str(native_behavior), "tile", str(golden_tile)],
                            check=True, capture_output=True, text=True)
    assert result.stdout.strip() == "0 1 1 1 1 1"


def test_dynamic_star_without_measured_magnitude_is_rejected(native_behavior):
    assert native_output(native_behavior, "missing-magnitude") == "-1"


def test_direct_lookup_waits_for_queued_survey_registration(native_behavior):
    result = subprocess.run([str(native_behavior), "pending-registration"], capture_output=True, text=True, check=True)
    assert result.stdout.strip() == "1 0 0"

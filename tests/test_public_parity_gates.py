from __future__ import annotations

from pathlib import Path

from scripts.skydata.evaluate_public_parity_gates import DEFAULT_REQUIRED_SCENARIOS, evaluate_gates


def test_parity_gates_pass_with_complete_fixture(tmp_path: Path) -> None:
    coverage = {
        scenario: {"attempted": True, "observed_live": True}
        for scenario in DEFAULT_REQUIRED_SCENARIOS
    }
    parity_diff = {"status_counts": {"missing_local": 0, "checksum_mismatch": 0, "extra_local": 3}, "rows": []}
    dependency_report = {"runtime_forbidden_count": 0}
    skydata_root = tmp_path / "skydata"
    summary_root = skydata_root / "object-media/summaries"
    summary_root.mkdir(parents=True)
    (summary_root / "index.json").write_text('{"alias_to_file":{"m31":"m31.json"}}', encoding="utf-8")

    report = evaluate_gates(
        coverage=coverage,
        parity_diff=parity_diff,
        dependency_report=dependency_report,
        skydata_root=skydata_root,
        required_scenarios=DEFAULT_REQUIRED_SCENARIOS,
    )

    assert report["status"] == "pass"


def test_parity_gates_block_on_missing_assets_forbidden_runtime_and_missing_summary(tmp_path: Path) -> None:
    coverage = {"boot": {"attempted": True, "observed_live": True}}
    parity_diff = {"status_counts": {"missing_local": 2, "checksum_mismatch": 1}, "rows": []}
    dependency_report = {"runtime_forbidden_count": 1}

    report = evaluate_gates(
        coverage=coverage,
        parity_diff=parity_diff,
        dependency_report=dependency_report,
        skydata_root=tmp_path / "missing",
        required_scenarios=["boot", "cygnus_57_fov_00443"],
    )

    gates = {gate["name"]: gate for gate in report["gates"]}
    assert report["status"] == "blocked"
    assert gates["capture_coverage"]["status"] == "blocked"
    assert gates["asset_parity"]["status"] == "blocked"
    assert gates["runtime_external_dependencies"]["status"] == "blocked"
    assert gates["local_object_summaries"]["status"] == "blocked"

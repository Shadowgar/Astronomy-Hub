#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.skydata.common import REPO_ROOT, write_json

DEFAULT_REQUIRED_SCENARIOS = [
    "boot",
    "pan_zoom",
    "faint_stars",
    "cygnus_57_fov_00443",
    "dense_milky_way",
    "high_latitude_field",
    "dense_cluster",
    "galaxy_field",
    "star_search",
    "dso_search",
    "planet_views",
    "moon_views",
    "sun_views",
    "satellites",
    "minor_planets",
    "object_summary_panel",
    "time_date",
    "observer_location",
    "object_search",
]

KNOWN_57_CYGNI_GAIA_SOURCE_IDS = [
    "2162953261210433024",
    "2162953261210433536",
    "2162953261210433152",
    "2162953402941703936",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate ORAS/Stellarium public parity release gates.")
    parser.add_argument("--coverage", type=Path, required=True, help="coverage_ledger.json from runtime capture.")
    parser.add_argument("--parity-diff", type=Path, required=True, help="parity_diff.json from compare_public_vs_oras_skydata.py.")
    parser.add_argument("--dependency-report", type=Path, required=True, help="JSON report from scan_runtime_external_dependencies.py.")
    parser.add_argument("--skydata-root", type=Path, default=REPO_ROOT / "frontend/public/oras-sky-engine/skydata")
    parser.add_argument("--required-scenarios", default=",".join(DEFAULT_REQUIRED_SCENARIOS))
    parser.add_argument("--out-json", type=Path, default=Path("captured_assets/parity_gate_report.json"))
    parser.add_argument("--out-md", type=Path, default=Path("captured_assets/parity_gate_report.md"))
    parser.add_argument("--fail-on-blocked", action="store_true", help="Exit nonzero when any gate is blocked.")
    return parser.parse_args()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def evaluate_gates(
    *,
    coverage: dict[str, Any],
    parity_diff: dict[str, Any],
    dependency_report: dict[str, Any],
    skydata_root: Path,
    required_scenarios: list[str],
) -> dict[str, Any]:
    gates: list[dict[str, Any]] = []

    missing_scenarios = []
    unobserved_scenarios = []
    for scenario in required_scenarios:
        row = coverage.get(scenario)
        if row is None:
            missing_scenarios.append(scenario)
            continue
        if not row.get("attempted") or not row.get("observed_live"):
            unobserved_scenarios.append(scenario)
    gates.append(
        _gate(
            "capture_coverage",
            not missing_scenarios and not unobserved_scenarios,
            {
                "missing_scenarios": missing_scenarios,
                "unobserved_scenarios": unobserved_scenarios,
            },
        )
    )

    status_counts = parity_diff.get("status_counts", {})
    gates.append(
        _gate(
            "asset_parity",
            int(status_counts.get("missing_local", 0)) == 0 and int(status_counts.get("checksum_mismatch", 0)) == 0,
            {
                "missing_local": int(status_counts.get("missing_local", 0)),
                "checksum_mismatch": int(status_counts.get("checksum_mismatch", 0)),
                "extra_local": int(status_counts.get("extra_local", 0)),
            },
        )
    )

    runtime_forbidden_count = int(dependency_report.get("runtime_forbidden_count", 0))
    gates.append(
        _gate(
            "runtime_external_dependencies",
            runtime_forbidden_count == 0,
            {"runtime_forbidden_count": runtime_forbidden_count},
        )
    )

    summary_index_path = skydata_root / "object-media/summaries/index.json"
    summary_index_ok = False
    summary_alias_count = 0
    if summary_index_path.exists():
        try:
            summary_index = load_json(summary_index_path)
            summary_alias_count = len(summary_index.get("alias_to_file", {}))
            summary_index_ok = summary_alias_count > 0
        except Exception:
            summary_index_ok = False
    gates.append(
        _gate(
            "local_object_summaries",
            summary_index_ok,
            {"index_path": str(summary_index_path), "alias_count": summary_alias_count},
        )
    )

    gaia_probe = []
    for source_id in KNOWN_57_CYGNI_GAIA_SOURCE_IDS:
        found = any(
            source_id in str(row.get("relative_path", "")) or source_id in str(row)
            for row in parity_diff.get("rows", [])[:1000]
        )
        gaia_probe.append({"source_id": source_id, "present_in_diff_sample": found})
    gates.append(
        _gate(
            "known_57_cygni_targets_tracked",
            bool(gaia_probe),
            {"targets": gaia_probe},
        )
    )

    blocked = [gate for gate in gates if gate["status"] != "pass"]
    return {
        "status": "pass" if not blocked else "blocked",
        "gate_count": len(gates),
        "blocked_count": len(blocked),
        "gates": gates,
    }


def _gate(name: str, passed: bool, details: dict[str, Any]) -> dict[str, Any]:
    return {"name": name, "status": "pass" if passed else "blocked", "details": details}


def build_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# ORAS Stellarium Public Parity Gate Report",
        "",
        f"- Status: {report['status']}",
        f"- Gates: {report['gate_count']}",
        f"- Blocked: {report['blocked_count']}",
        "",
        "## Gates",
        "",
    ]
    for gate in report["gates"]:
        lines.append(f"- {gate['name']}: {gate['status']}")
        details = gate.get("details", {})
        for key, value in details.items():
            if value in (None, "", [], {}):
                continue
            lines.append(f"  - {key}: {value}")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    report = evaluate_gates(
        coverage=load_json(args.coverage),
        parity_diff=load_json(args.parity_diff),
        dependency_report=load_json(args.dependency_report),
        skydata_root=args.skydata_root,
        required_scenarios=[item.strip() for item in args.required_scenarios.split(",") if item.strip()],
    )
    write_json(args.out_json, report)
    args.out_md.parent.mkdir(parents=True, exist_ok=True)
    args.out_md.write_text(build_markdown(report), encoding="utf-8")
    print(json.dumps({"status": report["status"], "out_json": str(args.out_json), "out_md": str(args.out_md)}, indent=2))
    return 1 if args.fail_on_blocked and report["status"] != "pass" else 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_CLASSES = [
    "star_pack_minimal",
    "star_pack_base",
    "star_pack_extended",
    "dso_pack_base",
    "dso_pack_extended",
    "milkyway_survey",
    "dss_survey",
    "moon_survey",
    "landscape_guereins",
]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Run capture -> mirror -> parity diff pipeline.")
    p.add_argument("--profiles", default="baseline,max_zoom_izar")
    p.add_argument("--classes", default=",".join(DEFAULT_CLASSES))
    p.add_argument("--output-root", type=Path, default=Path("captured_assets"))
    p.add_argument("--target-url", default="https://stellarium-web.org")
    p.add_argument("--notes", default="")
    p.add_argument("--python-bin", default=sys.executable)
    p.add_argument("--order-min", type=int, default=0)
    p.add_argument("--order-max", type=int, default=4)
    p.add_argument("--hips-workers", type=int, default=16)
    p.add_argument("--hips-rate-limit", type=float, default=0.0)
    p.add_argument("--retry-count", type=int, default=4)
    p.add_argument("--request-timeout", type=int, default=30)
    return p.parse_args()


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def run_json_command(cmd: list[str], cwd: Path) -> dict[str, Any]:
    proc = subprocess.run(cmd, cwd=cwd, text=True, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(f"command failed ({proc.returncode}): {' '.join(cmd)}\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}")
    text = proc.stdout.strip()
    return json.loads(text[text.find("{") : text.rfind("}") + 1])


def build_mirror_cmd(
    python_bin: str,
    class_name: str,
    order_min: int,
    order_max: int,
    hips_workers: int,
    hips_rate_limit: float,
    retry_count: int,
    request_timeout: int,
) -> list[str]:
    cmd = [
        python_bin,
        "scripts/skydata/mirror_public_runtime_data.py",
        "--class",
        class_name,
        "--confirm-download",
        "--resume",
        "--checksum-manifest",
        "--order-min",
        str(order_min),
        "--order-max",
        str(order_max),
        "--retry-count",
        str(retry_count),
        "--request-timeout",
        str(request_timeout),
    ]
    if class_name in {"dss_survey", "milkyway_survey", "moon_survey", "landscape_guereins"}:
        cmd.extend(["--workers", str(max(1, hips_workers))])
        if hips_rate_limit > 0:
            cmd.extend(["--rate-limit-per-worker", str(hips_rate_limit)])
        cmd.append("--progress")
    return cmd


def write_restart_report(path: Path, capture: dict[str, Any], mirror_results: list[dict[str, Any]], diff: dict[str, Any], pipeline_path: Path) -> None:
    lines = [
        "# ORAS STELLARIUM PUBLIC DATA PARITY AUDIT",
        "",
        f"- Generated: {utc_now()}",
        f"- Capture run ID: {capture.get('run_id')}",
        f"- Profiles: {', '.join(capture.get('profiles', []))}",
        f"- Target URL: {capture.get('target_url', 'https://stellarium-web.org')}",
        "",
        "## Capture vs Mirror Boundaries",
        "",
        "- Browser-observed coverage comes from `captured_assets/manifest.jsonl`.",
        "- Mirrored class inventory comes from manifest-driven class runs under `data/runtime-packs`.",
        "- This report distinguishes observed traffic from mirrored inventory and from ORAS parity state.",
        "",
        "## Mirror Class Results",
        "",
    ]

    for item in mirror_results:
        if "class" not in item:
            continue
        cls = item.get("class")
        status = item.get("status", "unknown")
        downloaded = item.get("downloaded_files", 0)
        runtime_count = item.get("runtime_file_count", 0)
        lines.append(f"- {cls}: status={status}, downloaded_files={downloaded}, runtime_file_count={runtime_count}")

    sc = diff.get("status_counts", {})
    lines += [
        "",
        "## Parity Deltas",
        "",
        f"- present_both: {sc.get('present_both', 0)}",
        f"- missing_local: {sc.get('missing_local', 0)}",
        f"- extra_local: {sc.get('extra_local', 0)}",
        f"- checksum_mismatch: {sc.get('checksum_mismatch', 0)}",
        f"- mismatch_rate: {diff.get('mismatch_rate', 0):.4f}",
        "",
        "## Priority Remediation",
        "",
        "- Prioritize `missing_local` and `checksum_mismatch` rows in stars, dso, and surveys/dss|hips families first.",
        "- Then resolve planet texture and minor-body deltas for visual fidelity.",
        "- Re-run this pipeline after each remediation batch and track trend in mismatch_rate.",
        "",
        "## Evidence Artifacts",
        "",
        "- `captured_assets/manifest.jsonl`",
        "- `captured_assets/asset_taxonomy.json`",
        "- `captured_assets/manifest_summary.md`",
        "- `captured_assets/parity_diff.json`",
        "- `captured_assets/parity_diff_summary.md`",
        f"- `{pipeline_path.as_posix()}`",
        "",
        "## Completeness Statement",
        "",
        "- This report does not claim full completeness unless counts and checksum parity prove it.",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    output_root = (REPO_ROOT / args.output_root).resolve()
    output_root.mkdir(parents=True, exist_ok=True)

    run_id = f"public-parity-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
    started_at = utc_now()

    capture_cmd = [
        "node",
        "scripts/skydata/stellarium_runtime_traffic_audit.js",
        "--profiles",
        args.profiles,
        "--run-id",
        run_id,
        "--target-url",
        args.target_url,
        "--notes",
        args.notes,
        "--output-root",
        str(output_root),
    ]
    capture_result = run_json_command(capture_cmd, REPO_ROOT)

    class_names = [c.strip() for c in args.classes.split(",") if c.strip()]
    mirror_runs: list[dict[str, Any]] = []
    for cls in class_names:
        mirror_cmd = build_mirror_cmd(
            args.python_bin,
            cls,
            args.order_min,
            args.order_max,
            args.hips_workers,
            args.hips_rate_limit,
            args.retry_count,
            args.request_timeout,
        )
        result = run_json_command(mirror_cmd, REPO_ROOT)
        mirror_runs.append({"class": cls, "command": mirror_cmd, "result": result})

    diff_cmd = [
        args.python_bin,
        "scripts/skydata/compare_public_vs_oras_skydata.py",
        "--mirror-root",
        "data/runtime-packs",
        "--oras-root",
        "frontend/public/oras-sky-engine/skydata",
        "--out-json",
        str(output_root / "parity_diff.json"),
        "--out-md",
        str(output_root / "parity_diff_summary.md"),
    ]
    diff_result = run_json_command(diff_cmd, REPO_ROOT)
    diff_payload = json.loads((output_root / "parity_diff.json").read_text(encoding="utf-8"))

    ended_at = utc_now()
    pipeline_payload = {
        "run_id": run_id,
        "started_at": started_at,
        "ended_at": ended_at,
        "capture": {"command": capture_cmd, "result": capture_result},
        "mirror": mirror_runs,
        "compare": {"command": diff_cmd, "result": diff_result},
        "artifacts": {
            "manifest": str(output_root / "manifest.jsonl"),
            "taxonomy": str(output_root / "asset_taxonomy.json"),
            "summary": str(output_root / "manifest_summary.md"),
            "parity_json": str(output_root / "parity_diff.json"),
            "parity_md": str(output_root / "parity_diff_summary.md"),
        },
    }

    pipeline_path = output_root / "pipeline_run.json"
    pipeline_path.write_text(json.dumps(pipeline_payload, indent=2), encoding="utf-8")

    report_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    report_path = REPO_ROOT / "docs" / "restart" / f"ORAS_STELLARIUM_PUBLIC_DATA_PARITY_AUDIT_{report_date}.md"
    flat_results = []
    for run in mirror_runs:
        for row in run["result"].get("results", []):
            if isinstance(row, dict):
                flat_results.append(row)
    write_restart_report(report_path, capture_result, flat_results, diff_payload, pipeline_path)

    print(json.dumps({
        "pipeline_run": str(pipeline_path),
        "report": str(report_path),
        "capture_requests": capture_result.get("requests"),
        "compared_files": diff_payload.get("file_count"),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

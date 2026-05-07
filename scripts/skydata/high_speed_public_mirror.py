#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

EPH_CLASSES = [
    "star_pack_minimal",
    "star_pack_base",
    "star_pack_extended",
    "dso_pack_base",
    "dso_pack_extended",
]
HIPS_CLASSES = [
    "milkyway_survey",
    "moon_survey",
    "landscape_guereins",
    "dss_survey",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def run(cmd: list[str]) -> dict:
    proc = subprocess.run(cmd, cwd=REPO_ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        return {
            "ok": False,
            "returncode": proc.returncode,
            "cmd": cmd,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
        }
    text = proc.stdout.strip()
    start = text.find("{")
    end = text.rfind("}")
    payload = json.loads(text[start : end + 1]) if start >= 0 and end >= start else {"raw": text}
    return {
        "ok": True,
        "cmd": cmd,
        "payload": payload,
    }


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="High-speed public mirror runner for ORAS sky-engine parity data")
    p.add_argument("--python-bin", default=sys.executable)
    p.add_argument("--order-min", type=int, default=0)
    p.add_argument("--order-max-eph", type=int, default=4)
    p.add_argument("--order-max-hips", type=int, default=4)
    p.add_argument("--workers", type=int, default=48)
    p.add_argument("--retry-count", type=int, default=2)
    p.add_argument("--request-timeout", type=int, default=12)
    p.add_argument("--max-files", type=int, default=0)
    p.add_argument("--out", type=Path, default=Path("captured_assets/high_speed_mirror_run.json"))
    return p.parse_args()


def main() -> int:
    args = parse_args()
    results = []

    for cls in EPH_CLASSES:
        cmd = [
            args.python_bin,
            "scripts/skydata/mirror_public_runtime_data.py",
            "--class",
            cls,
            "--confirm-download",
            "--resume",
            "--checksum-manifest",
            "--order-min",
            str(args.order_min),
            "--order-max",
            str(args.order_max_eph),
            "--retry-count",
            str(args.retry_count),
            "--request-timeout",
            str(args.request_timeout),
        ]
        if args.max_files > 0:
            cmd += ["--max-files", str(args.max_files)]
        results.append(run(cmd))

    for cls in HIPS_CLASSES:
        cmd = [
            args.python_bin,
            "scripts/skydata/mirror_public_runtime_data.py",
            "--class",
            cls,
            "--confirm-download",
            "--resume",
            "--checksum-manifest",
            "--order-min",
            str(args.order_min),
            "--order-max",
            str(args.order_max_hips),
            "--workers",
            str(args.workers),
            "--retry-count",
            str(args.retry_count),
            "--request-timeout",
            str(args.request_timeout),
            "--progress",
            "--progress-interval",
            "3",
        ]
        if args.max_files > 0:
            cmd += ["--max-files", str(args.max_files)]
        results.append(run(cmd))

    payload = {
        "generated_at": utc_now(),
        "order_min": args.order_min,
        "order_max_eph": args.order_max_eph,
        "order_max_hips": args.order_max_hips,
        "workers": args.workers,
        "retry_count": args.retry_count,
        "request_timeout": args.request_timeout,
        "max_files": args.max_files,
        "results": results,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps({"out": str(args.out), "ok": all(r.get("ok") for r in results), "runs": len(results)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

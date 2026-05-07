#!/usr/bin/env python3
from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
script = ROOT / "scripts" / "skydata" / "stellarium_runtime_traffic_audit.js"

if not script.exists():
    raise SystemExit(f"Missing script: {script}")

cmd = ["node", str(script)]
res = subprocess.run(cmd, cwd=str(ROOT))
raise SystemExit(res.returncode)

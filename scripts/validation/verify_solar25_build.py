"""Bind the private served build to exported bytes and the reviewed inputs."""
import hashlib
import json
import re
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "output/playwright/owner-acceptance/hub-solar25-final"
BASE = "http://localhost:4231"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    pending = {"index.html"}
    pending.update(str(p.relative_to(DIST)) for p in (DIST / "mission-assets/v2.5").rglob("*") if p.is_file())
    served = {}
    while pending:
        name = pending.pop()
        if name in served:
            continue
        local = (DIST / name).read_bytes()
        with urllib.request.urlopen(BASE + "/" + name, timeout=30) as response:
            remote = response.read()
            assert response.status == 200
        assert remote == local, name
        served[name] = {"bytes": len(local), "sha256": digest(local)}
        if name.endswith((".html", ".js")):
            for reference in re.findall(r'["\']((?:\.?/)?(?:assets/)?[\w.-]+\.(?:js|css))["\']', local.decode()):
                candidate = reference.lstrip("/") if reference.startswith(("/", "assets/")) else str(Path(name).parent / reference)
                if (DIST / candidate).is_file():
                    pending.add(candidate)
    assert any("MissionWorkspace" in name for name in served)
    paths = set()
    for pattern in ["frontend/src/features/missions/*", "backend/app/*/mission_exploration.py", "backend/app/data/mission_events.json"]:
        paths.update(ROOT.glob(pattern))
    paths.update(ROOT / p for p in ["frontend/src/features/solar/SolarScene.ts", "frontend/src/features/solar/SolarWorkspace.tsx", "frontend/src/features/solar/solarExplorer.css", "frontend/src/routes/AppRouter.tsx", "frontend/vite.config.mjs", "frontend/Dockerfile.production", "backend/app/main.py", "docker-compose.solar25.yml"])
    inputs = {str(p.relative_to(ROOT)): digest(p.read_bytes()) for p in sorted(paths) if p.is_file()}
    image = subprocess.check_output(["docker", "image", "inspect", "astronomy-hub-solar25-handoff-proof:latest", "--format", "{{.Id}}"], text=True).strip()
    receipt = {"status": "PASS", "base": BASE, "image": image, "buildCommand": "docker build --target build -f frontend/Dockerfile.production -t astronomy-hub-solar25-handoff-proof:latest .", "served": dict(sorted(served.items())), "reviewedSourceInputs": inputs, "sourceManifestSha256": digest((ROOT / "data/runtime-packs/solar-missions/release-v3/manifest.json").read_bytes()), "note": "Source input hashes bind the reviewed runtime to the final commit. Hashes verify delivery identity, not public corresponding-source release completeness."}
    (ROOT / "docs/validation/solar-system-2.5/evidence/served-build.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"status": "PASS", "servedFiles": len(served), "sourceInputs": len(inputs), "image": image}))


if __name__ == "__main__":
    main()

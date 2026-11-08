"""Package bounded factual receipts; retain full diagnostic traces in output/."""
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "output/playwright/solar-system-2.6/performance"
DEST = ROOT / "docs/validation/solar-system-2.6"
EVIDENCE = DEST / "evidence"
GALLERY = DEST / "performance-gallery"
EVIDENCE.mkdir(parents=True, exist_ok=True)
GALLERY.mkdir(parents=True, exist_ok=True)


def read(relative):
    return json.loads((SOURCE / relative).read_text())


def artifact(file):
    return {"path": str(file.relative_to(ROOT)), "bytes": file.stat().st_size,
            "sha256": hashlib.sha256(file.read_bytes()).hexdigest()}


report = {"scope": "Mission cold shader variant correction; native context stall remains",
          "cold": [], "artifacts": []}
for name in ["baseline-plain", "baseline-trace", "baseline-programs",
             "candidate-programs", "candidate-plain", "baseline-paired"]:
    run = read(f"{name}/cold.json")
    ready = next(m["time"] for m in run["cold"]["milestones"] if m["name"] == "ready-observed")
    programs = [p for p in run["cold"].get("programs", [])
                if p.get("firstUseAt", float("inf")) < ready
                and not any(poll["ready"] for poll in p["polls"])]
    report["cold"].append({
        "name": name, "status": run["status"], "mode": run["mode"],
        "startedUtc": run["startedUtc"], "base": run["base"], "gpu": run["gpu"],
        "readyMilliseconds": run["readyMilliseconds"],
        "maximumFrameMilliseconds": max(f["duration"] for f in run["cold"]["frames"]),
        "longTasks": run["cold"]["tasks"], "readyDiagnostics": run["readyDiagnostics"],
        "callTotals": run["cold"]["callTotals"], "calls": run["cold"]["calls"],
        "unpreparedProgramsBeforeReady": programs if run["mode"] == "trace" and "programs" in run["cold"] else None,
        "servedScripts": run["servedScripts"], "errors": run["errors"],
    })
    for file in sorted((SOURCE / name).iterdir()):
        if file.is_file():
            report["artifacts"].append(artifact(file))

report["shadowContinuity"] = read("shadow-continuity/shadow-continuity.json")
report["lifecycle"] = read("lifecycle/lifecycle-edges.json")
warm = read("warm-four-models/performance.json")
report["warm"] = {"status": warm["status"], "errors": warm["errors"], "measurements": [
    {key: row[key] for key in ["mission", "size", "gpu", "readyMs", "frames", "diagnostics"]}
    for row in warm["measurements"]]}
for name in ["shadow-continuity", "lifecycle", "warm-four-models"]:
    for file in sorted((SOURCE / name).iterdir()):
        if file.is_file():
            report["artifacts"].append(artifact(file))

gallery_names = []
for variant in ["baseline", "candidate"]:
    shutil.copyfile(SOURCE / f"{variant}-plain/actual-inspection.png",
                    GALLERY / f"{variant}-voyager1-inspection.png")
    gallery_names.append(f"{variant}-voyager1-inspection.png")
for file in sorted((SOURCE / "shadow-continuity").glob("*.png")):
    shutil.copyfile(file, GALLERY / file.name)
    gallery_names.append(file.name)
report["gallery"] = [artifact(GALLERY / name) for name in sorted(gallery_names)]
report["identicalVoyagerInspection"] = (
    (GALLERY / "baseline-voyager1-inspection.png").read_bytes()
    == (GALLERY / "candidate-voyager1-inspection.png").read_bytes())
(EVIDENCE / "mission-performance.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"coldRuns": len(report["cold"]), "warmCases": len(warm["measurements"]),
                  "shadowMissions": len(report["shadowContinuity"]["missions"]),
                  "lifecycleChecks": len(report["lifecycle"]["checks"]),
                  "identicalVoyagerInspection": report["identicalVoyagerInspection"],
                  "galleryImages": len(report["gallery"])}))

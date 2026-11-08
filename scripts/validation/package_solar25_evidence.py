"""Copy original browser evidence; never synthesize or alter screenshots.

Run from the recovery worktree after the recorded GPU checks finish. Videos stay
in the existing private owner preview; their hashes and sizes are committed.
"""
import hashlib
import html
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output/playwright/solar-system-2.5"
DOC = ROOT / "docs/validation/solar-system-2.5"
GALLERY = DOC / "gallery"
PRIVATE = ROOT / "output/playwright/owner-acceptance/solar25-evidence"


def record(path):
    return {"path": str(path.relative_to(ROOT)), "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def main():
    GALLERY.mkdir(parents=True, exist_ok=True)
    (PRIVATE / "videos").mkdir(parents=True, exist_ok=True)
    rows, movies, artifacts = [], [], []
    sources = [("voyager1", "journeys-voyager1-fixed"),
               ("voyager2", "journeys-qualified"), ("cassini", "journeys-qualified"),
               ("newhorizons", "journeys-qualified")]
    for mission, directory in sources:
        folder = OUT / directory
        receipt = json.loads((folder / "journeys.json").read_text())
        run = next(r for r in receipt["runs"] if r["mission"] == mission)
        assert run["status"] == "PASS", (mission, run["status"])
        video = next(folder.rglob(run["video"]))
        shutil.copy2(video, PRIVATE / "videos" / f"{mission}.webm")
        artifacts.append(record(video))
        movies.append(f'<article><h2>{html.escape(mission)}</h2><video controls preload="none" src="/owner-review/solar25-evidence/videos/{mission}.webm"></video></article>')
        for source in sorted(folder.glob(f"{mission}-*.png")):
            assert "failure" not in source.name
            destination = GALLERY / source.name
            shutil.copy2(source, destination)
            artifacts.append(record(source))
            label = source.stem.replace("-", " ")
            rows.append(f'<figure><a href="{html.escape(source.name, quote=True)}"><img loading="lazy" src="{html.escape(source.name, quote=True)}" alt="{html.escape(label, quote=True)}"></a><figcaption>{html.escape(label)}</figcaption></figure>')
    for directory, names in [
        ("review24", ["2035-expired-path.png", "fixed-2035-no-expired-path.png"]),
        ("performance", ["newhorizons-coverage-disclosure.png"]),
    ]:
        for name in names:
            source = OUT / directory / name
            shutil.copy2(source, GALLERY / name)
            artifacts.append(record(source))
            rows.append(f'<figure><a href="{name}"><img loading="lazy" src="{name}" alt="{html.escape(name)}"></a><figcaption>{html.escape(name)}</figcaption></figure>')
    for directory, name in [("journeys-qualified", "journeys.json"),
                            ("journeys-voyager1-fixed", "journeys.json"),
                            ("lifecycle-edges-before3", "lifecycle-edges.json"),
                            ("lifecycle-edges-fixed", "lifecycle-edges.json"),
                            ("performance", "performance.json"),
                            ("quality-recovery-qualified", "quality-recovery.json")]:
        source = OUT / directory / name
        shutil.copy2(source, DOC / "evidence" / (name if directory == "quality-recovery-qualified" else f"{directory}-{name}"))
        artifacts.append(record(source))
    report = {"ownerAcceptance": False, "physicalIPhone": False,
              "evidence": "Original headed Windows Edge NVIDIA RTX 3060 captures",
              "note": "The earlier aggregate FAIL receipt is preserved. Its three passing mission rows are combined with the later passing Voyager 1 run. Final text-only Pluto coverage disclosure is captured separately; scene and source pack are unchanged.",
              "artifacts": artifacts}
    (DOC / "evidence/browser-artifacts.json").write_text(json.dumps(report, indent=2) + "\n")
    page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Solar 2.5 actual browser evidence</title><style>body{background:#080c13;color:#e6edf5;font:16px/1.5 system-ui;margin:24px;max-width:1440px}a{color:#9bd3ff}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,430px),1fr));gap:20px}figure,article{margin:0;background:#111925;padding:12px}img,video{width:100%;height:auto}figcaption{overflow-wrap:anywhere}h1{font-size:28px}</style><h1>Solar 2.5 · actual browser evidence</h1><p>Headed Windows Edge / NVIDIA RTX 3060. These are unaltered application screenshots and complete recorded journeys. Owner visual acceptance and physical iPhone qualification remain pending.</p><p>Private preview: <a href="/missions/voyager1">Spacecraft &amp; Missions</a>. Videos play on the owner's existing localhost:4231 preview. This gallery does not publish a new server or source archive.</p><p>Three passing journeys from the preserved aggregate FAIL run are combined with the corrected passing Voyager 1 journey. A final text-only Pluto/Charon coverage explanation is captured separately. No scene or source changes followed those journeys. Black angular areas on Pluto/Charon are source-mosaic gaps, not dark terrain. Map longitude and spacecraft attitude remain illustrative.</p><h2>Four complete journeys</h2><div class="grid">'''
    page += "\n".join(movies) + '</div><h2>Original screenshots and before/after regression</h2><p>The last two 2035 images preserve the Solar 2.4 expired-path defect and its correction at the same unsupported epoch.</p><div class="grid">' + "\n".join(rows) + "</div></html>\n"
    (GALLERY / "index.html").write_text(page)
    shutil.copytree(GALLERY, PRIVATE, dirs_exist_ok=True)
    print(json.dumps({"screenshots": len(rows), "videos": len(movies), "artifacts": len(artifacts),
                      "privateGallery": "http://localhost:4231/owner-review/solar25-evidence/index.html"}))


if __name__ == "__main__":
    main()

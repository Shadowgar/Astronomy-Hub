"""Package retained actual browser evidence; no generated/altered scene imagery."""
import hashlib
import html
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'output/playwright/solar-system-2.4'
DEST = ROOT / 'docs/validation/solar-system-2.4/gallery'
EVIDENCE = DEST.parent / 'evidence'

def figure(source, target, title):
    destination = DEST / target
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    return f'<figure><a href="{html.escape(target, quote=True)}"><img loading="lazy" src="{html.escape(target, quote=True)}" alt="{html.escape(title, quote=True)}"></a><figcaption>{html.escape(title)}</figcaption></figure>'

def main():
    DEST.mkdir(parents=True, exist_ok=True)
    blocks = []
    for layout in ['desktop', 'portrait', 'landscape']:
        directory = SOURCE / f'candidate-{layout}-final'
        receipt = json.loads((directory / 'candidate.json').read_text())
        assert receipt['status'] == 'PASS'
        shutil.copyfile(directory / 'candidate.json', EVIDENCE / f'candidate-{layout}-final.json')
        blocks.append(f'<h2 id="{layout}">{layout.title()} — final Docker build</h2><div class="grid">')
        for run in receipt['layouts']:
            for shot in run['captures']:
                blocks.append(figure(directory / shot['file'], 'after/' + shot['file'], f"{shot['name']} · {run['width']} × {run['height']}"))
        blocks.append('</div>')
    baseline = json.loads((SOURCE / 'before/baseline.json').read_text())
    assert baseline['status'] == 'PASS'
    shutil.copyfile(SOURCE / 'before/baseline.json', EVIDENCE / 'baseline.json')
    blocks.append('<h2 id="before">Preserved Solar 2.3 baseline</h2><p>Actual prior implementation at the same UTC and viewport. Pluto, Charon, Ceres, TNOs and comet destinations did not exist here; no invented before images. Camera presets for existing views were reused. Source-driven belt framing and measured Eros geometry now differ intentionally.</p><div class="grid">')
    for run in baseline['runs']:
        blocks.append(figure(SOURCE / 'before' / run['file'], 'before/' + run['file'], f"Solar 2.3 · {run['scene']} · {run['width']} × {run['height']}"))
    blocks.append('</div><h2 id="videos">Actual journey recordings</h2><div class="grid">')
    journeys = json.loads((SOURCE / 'journeys-final/journeys.json').read_text())
    assert journeys['status'] == 'PASS'
    for run in journeys['runs']:
        target = 'video/' + run['name'] + '.webm'
        destination = DEST / target
        destination.parent.mkdir(exist_ok=True)
        shutil.copyfile(SOURCE / 'journeys-final/video' / run['video'], destination)
        blocks.append(f'<figure><video controls preload="metadata" playsinline src="{target}"></video><figcaption>{html.escape(run["name"])} · {run["width"]} × {run["height"]} · Windows NVIDIA</figcaption></figure>')
    blocks.append('</div>')
    page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Solar System 2.4 — actual owner preview</title><style>
body{margin:0;background:#080d15;color:#e5edf7;font:16px/1.6 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:24px}h1{font-size:clamp(24px,4vw,42px)}a{color:#a7d3ff}nav{display:flex;gap:18px;flex-wrap:wrap;padding:16px 0}p{max-width:1000px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:20px}figure{margin:0;background:#111b29;border:1px solid #344053;border-radius:12px;overflow:hidden}img,video{display:block;width:100%;height:auto;max-height:700px;object-fit:contain;background:#000}figcaption{padding:12px;overflow-wrap:anywhere}.status{border-left:3px solid #dfb36c;padding:12px 18px;background:#17191d}h2{margin-top:42px}
</style><main><h1>Solar System 2.4</h1><p class="status">Actual browser output. Owner visual acceptance is pending. Final independent application review, physical iPhone and release/source qualifications remain open.</p><p>Windows Edge · NVIDIA RTX 3060 Laptop GPU · 27 October 2026, 04:00 UTC. Desktop and mobile viewport sizes run on the same Windows hardware; these are not physical-phone captures. No generated scene imagery or retouched source surfaces.</p><p>Pluto/Charon retain real source coverage and variable detail; precise historical map longitude registration is unqualified. Ceres is a mapped visualization. Vesta/Eros/67P/Halley retain measured or reconstructed shapes; comet phase/activity and Eris surface imagery are unqualified. Population dots identify a bounded, approximate source subset, not a complete census.</p><nav><a href="#desktop">Desktop</a><a href="#portrait">Portrait</a><a href="#landscape">Landscape</a><a href="#before">Solar 2.3 baseline</a><a href="#videos">Four recordings</a><a href="/solar-system?solarBody=pluto&amp;date=2026-10-27T04:00:00Z">Open Pluto</a></nav>'''
    (DEST / 'index.html').write_text(page + '\n'.join(blocks) + '</main></html>\n')
    manifest = [{'path': p.relative_to(DEST).as_posix(), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(DEST.rglob('*')) if p.is_file()]
    (EVIDENCE / 'gallery-files.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{len(manifest)} gallery files; {sum(x["bytes"] for x in manifest):,} bytes')

if __name__ == '__main__':
    main()

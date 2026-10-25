#!/usr/bin/env python3
"""Verify bounded pilot delivery. Candidate/skip-browser runs remain explicitly PARTIAL."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output/satellite-visual-pilot"
BASE = "7f5ea4d0c069463852698c836b3cd80a13bd75cf"
OWNER = Path("/home/rocco/Astronomy-Hub")
OWNER_HEAD = "1cb71b848a1ed46390945fe0fa636676b8b8f744"
OWNER_SETTINGS_SHA = "6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0"
LEGACY_SHA = "431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436"
FEED_ROUTE = "/oras-sky-engine/skydata/tle_satellite.jsonl.gz"
PROFILE = "visual_satellite_pilot.v1"
PRESERVATION = ROOT / "docs/validation/sky-satellite-live/evidence/source-audit/preservation.json"
PROTECTED = [
    "runtimes", "packages", "vendor", "integrations", "frontend/public",
    "frontend/src/features/solar", "frontend/src/features/systems", "frontend/src/features/planet",
    "frontend/src/features/earth", "frontend/src/features/sky-engine", "frontend/src/config",
    "backend/app/services/planet_view.py", "backend/app/services/solar_exploration.py",
    "backend/app/services/planetary_systems.py", "backend/app/services/planetary_ephemeris_service.py",
    "backend/app/services/satellite_propagation_service.py", "backend/app/services/satellite_tle_catalog_service.py",
    "backend/app/services/satellite_tle_release_service.py", "scripts/skydata/build_oras_satellite_tle_release.py",
    "frontend/package.json", "frontend/package-lock.json", "package.json", "package-lock.json",
    "backend/requirements.txt", "docker-compose.yml", "docker-compose.prod.yml",
    "docs/design/cinematic-references-2026-10-21",
]


def sha(payload):
    return hashlib.sha256(payload).hexdigest()


def git(*args, cwd=ROOT):
    return subprocess.check_output(["git", *args], cwd=cwd)


def tree(path):
    return {str(p.relative_to(path)): sha(p.read_bytes()) for p in sorted(path.rglob("*")) if p.is_file()}


def fetch(url):
    with urlopen(Request(url, headers={"Cache-Control": "no-cache", "Accept-Encoding": "identity"}), timeout=20) as response:
        assert response.status == 200, f"HTTP status {response.status}: {url}"
        return response.read()


def inspect(name):
    # Filter at Docker's output boundary; never request environment/config secrets.
    template = ('{"id":{{json .Id}},"image":{{json .Image}},"running":{{json .State.Running}},'
                '"readonly_rootfs":{{json .HostConfig.ReadonlyRootfs}},"mounts":{{json .Mounts}}}')
    value = json.loads(subprocess.check_output(["docker", "inspect", "--format", template, name]))
    value["mounts"] = sorted(({k: m.get(k) for k in ("Type", "Source", "Destination", "RW")}
                              for m in value["mounts"]), key=lambda m: m["Destination"])
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", action="store_true", help="Skip committed-source binding; report PARTIAL")
    parser.add_argument("--skip-browser", action="store_true", help="Skip unfinished browser proof; report PARTIAL")
    parser.add_argument("--url", default="http://127.0.0.1:4227")
    parser.add_argument("--legacy-url", default="http://127.0.0.1:4226")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = {"status": "RUNNING", "at_utc": datetime.now(timezone.utc).isoformat(),
              "candidate": args.candidate, "browser_skipped": args.skip_browser,
              "base": BASE, "head": git("rev-parse", "HEAD").decode().strip(),
              "preview": args.url, "checks": {}, "limits": [
                  "Bounded107tracked paths and9named data files; no claim over all database or volume bytes.",
                  "155-object limited visual subset; ISS-only official cross-check does not authenticate the entire mirror file.",
                  "Browser viewport/input emulation and software rendering do not establish physical-device or owner acceptance.",
                  "No production promotion, merge or deployment is qualified by this receipt."]}

    def check(name, operation):
        try:
            result["checks"][name] = {"status": "PASS", "evidence": operation()}
        except Exception as exc:
            result["checks"][name] = {"status": "FAIL", "error": f"{type(exc).__name__}: {exc}"}

    def hub():
        builds = {name: tree(OUT / name) for name in ("hub", "hub-repeat", "hub-container")}
        expected = builds["hub"]
        assert len(expected) == 142, f"Expected142Hub artifacts, got{len(expected)}"
        assert expected == builds["hub-repeat"] == builds["hub-container"], "Hub build bytes differ"
        overridden = {}
        manifest = json.loads((OUT / "release/manifest.json").read_text())
        for path, digest in expected.items():
            wanted = manifest["sha256"] if "/" + path == FEED_ROUTE else digest
            assert sha(fetch(args.url + "/" + path)) == wanted, "Served Hub bytes differ: " + path
            if wanted != digest:
                overridden[path] = wanted
        return {"build_files": len(expected), "served_files": len(expected),
                "hub_sha256": expected, "intentional_feed_overrides_within_hub_tree": overridden}

    def sky():
        lock = json.loads((ROOT / "integrations/renderers.lock.json").read_text())
        base_lock = json.loads(git("show", BASE + ":integrations/renderers.lock.json"))
        assert lock == base_lock, "Renderer pins differ fromPR101"
        rows = lock["sky"]["artifact_files"]
        assert len(rows) == 111, f"Expected111Sky rows, got{len(rows)}"
        for row in rows:
            local = ROOT / "frontend/public/oras-sky-engine" / row["path"]
            assert sha(local.read_bytes()) == row["sha256"], "Local pinned Sky artifact differs: " + row["path"]
            assert sha(fetch(args.url + "/oras-sky-engine/" + row["path"])) == row["sha256"], "Served Sky artifact differs: " + row["path"]
        return {"served_pinned_files": len(rows), "renderer_lock_sha256": sha((ROOT / "integrations/renderers.lock.json").read_bytes()),
                "native_js_wasm": lock["sky"]["native_horizon"]["native_output_sha256"],
                "sky_artifact_sha256": lock["sky"]["artifact_sha256"], "earth_artifact_sha256": lock["earth"]["artifact_sha256"]}

    def pilot():
        manifest = json.loads((OUT / "release/manifest.json").read_text())
        local_digest = sha((OUT / "release/tle_satellite.jsonl.gz").read_bytes())
        served_digest = sha(fetch(args.url + FEED_ROUTE))
        data = json.loads(fetch(args.url + "/api/sky/satellite-feed"))["data"]
        assert manifest["sha256"] == local_digest == served_digest == data["sha256"], "Native/backend/release feed hashes differ"
        assert data["status"] == "ready" and data["release_validated"] is True, "API release is not ready/validated"
        assert data["record_count"] == data["fresh_record_count"] == 155, "API pilot count/freshness differs"
        assert data["stale_record_count"] == data["unknown_epoch_count"] == data["malformed_count"] == 0
        assert data["source_profile"] == manifest["source_profile"] == PROFILE
        assert data["coverage"]["kind"] == "visual_subset" and data["coverage"]["full_catalog"] is False
        return {"separately_served_override_files": 1, "feed_sha256": served_digest, "api": data}

    def protected():
        changed = git("diff", BASE, "--name-only", "--", *PROTECTED).decode().splitlines()
        untracked = git("ls-files", "--others", "--exclude-standard", "--", *PROTECTED).decode().splitlines()
        assert not changed and not untracked, f"Protected paths changed: {changed + untracked}"
        old = json.loads(PRESERVATION.read_text())
        assert len(old["protected_tracked_rows"]) == 107 and len(old["bounded_data_hashes"]) == 9
        tracked = []
        for row in old["protected_tracked_rows"]:
            digest = sha((ROOT / row["path"]).read_bytes())
            assert digest == row["current_sha256"] == row["pr95_sha256"], "Protected tracked bytes differ: " + row["path"]
            tracked.append({"path": row["path"], "sha256": digest})
        data_files = []
        for row in old["bounded_data_hashes"]:
            path = Path(row["path"])
            digest = sha(path.read_bytes())
            assert digest == row["sha256"] and path.stat().st_size == row["bytes"], "Bounded protected data differs: " + str(path)
            data_files.append({"path": str(path), "bytes": path.stat().st_size, "sha256": digest})
        return {"identical_to_PR101": PROTECTED, "tracked_rows": tracked, "bounded_data_hashes": data_files}

    def legacy():
        original = OWNER / "frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz"
        digest = sha(original.read_bytes())
        assert digest == LEGACY_SHA == sha(fetch(args.legacy_url + FEED_ROUTE)), "Protected original or4226feed differs"
        data = json.loads(fetch(args.legacy_url + "/api/sky/satellite-feed"))["data"]
        assert data["record_count"] == data["stale_record_count"] == 14281
        assert data["fresh_record_count"] == 0 and data["status"] == "degraded"
        return {"original_path": str(original), "sha256": digest, "legacy_preview": args.legacy_url,
                "record_count": data["record_count"], "stale_record_count": data["stale_record_count"], "status": data["status"]}

    def owner():
        head = git("rev-parse", "HEAD", cwd=OWNER).decode().strip()
        status = git("status", "--porcelain", cwd=OWNER).decode().splitlines()
        digest = sha((OWNER / ".vscode/settings.json").read_bytes())
        assert head == OWNER_HEAD, "Owner checkout HEAD drifted"
        assert status == [" M .vscode/settings.json"], "Owner checkout status drifted"
        assert digest == OWNER_SETTINGS_SHA, "Owner existing settings bytes drifted"
        return {"head": head, "status": status, "settings_sha256": digest, "action": "Read only; no restoration performed"}

    def containers():
        old = json.loads(PRESERVATION.read_text())
        receipt = {}
        for name in ("oras-satellite-visual-pilot-preview", "oras-satellite-visual-pilot-backend"):
            current = inspect(name)
            assert current["running"] is True and current["readonly_rootfs"] is True, name + " must run with readonly rootfs"
            assert all(m["RW"] is False for m in current["mounts"] if m["Type"] == "bind"), name + " has writable bind mounts"
            destination = "/pilot" if name.endswith("preview") else "/runtime/satellite-visual-pilot"
            mount = next(m for m in current["mounts"] if m["Destination"] == destination)
            assert Path(mount["Source"]).resolve() == (OUT / "release").resolve()
            if name.endswith("backend"):
                mount = next(m for m in current["mounts"] if m["Destination"] == "/app/backend")
                assert Path(mount["Source"]).resolve() == (ROOT / "backend").resolve()
            receipt[name] = current
        for name in ("oras-satellite-live-preview", "oras-satellite-live-backend"):
            current = inspect(name)
            baseline = next(c for c in old["containers"] if c["name"] == name)
            mounts = sorted(({k: m.get(k) for k in ("Type", "Source", "Destination", "RW")} for m in baseline["mounts"]), key=lambda m: m["Destination"])
            assert current["id"] == baseline["id"] and current["image"] == baseline["image"], name + " identity changed"
            assert current["mounts"] == mounts, name + " mounts changed"
            receipt[name] = current
        return receipt

    def sources():
        changed = git("diff", BASE, "--name-only").decode().splitlines()
        changed += git("ls-files", "--others", "--exclude-standard").decode().splitlines()
        names = sorted({p for p in changed if not p.startswith("docs/")})
        digests = {p: sha((ROOT / p).read_bytes()) for p in names if (ROOT / p).is_file()}
        assert len(digests) == len(names), "Changed source includes missing/deleted file"
        if not args.candidate:
            dirty = [p for p in git("diff", "HEAD", "--name-only").decode().splitlines() if not p.startswith("docs/")]
            untracked = [p for p in git("ls-files", "--others", "--exclude-standard").decode().splitlines() if not p.startswith("docs/")]
            assert not dirty and not untracked, f"Uncommitted source remains: {dirty + untracked}"
            for path, digest in digests.items():
                assert sha(git("show", "HEAD:" + path)) == digest, "HEAD source bytes differ: " + path
        return {"source_sha256": digests, "head_bound": not args.candidate}

    def browser():
        path = OUT / "browser-qualified/proof.json"
        proof = json.loads(path.read_text())
        assert proof["status"] == "PASS" and proof["source_unchanged"] is True, "Browser proof not final PASS"
        assert proof["base"] == args.url, "Browser proof preview differs"
        expected = {(1440, 900), (390, 900), (667, 390)}
        assert {(r["width"], r["height"]) for r in proof["runs"]} == expected, "Missing required browser viewport"
        for run in proof["runs"]:
            assert run["status"] == "PASS" and run["errors"] == [], "Browser run failed/errors"
            assert run["pointPixelDisplacement"] > 0.25 and run["angularDisplacementDeg"] > 0.001
            for sample in (run["pointBefore"], run["pointAfter"]):
                for key in ("on", "off"):
                    artifact = sample[key]
                    assert sha((ROOT / artifact["path"]).read_bytes()) == artifact["sha256"], "Browser pixel artifact differs"
        for source_path, digest in proof["source_sha256"].items():
            assert sha((ROOT / source_path).read_bytes()) == digest, "Browser source changed: " + source_path
        video = proof["runs"][0]["video"]
        assert sha((ROOT / video["path"]).read_bytes()) == video["sha256"], "Native video bytes differ"
        return {"proof": str(path.relative_to(ROOT)), "sha256": sha(path.read_bytes()), "viewport_runs": len(proof["runs"]), "limits": proof["limits"]}

    def navigation():
        path = OUT / "navigation/proof.json"
        proof = json.loads(path.read_text())
        assert proof["status"] == "PASS" and proof["source_unchanged"] is True
        assert {(r["width"], r["height"]) for r in proof["runs"]} == {(1440, 900), (390, 900), (667, 390)}
        assert sum(len(r["steps"]) for r in proof["runs"]) == 16
        for run in proof["runs"]:
            assert run["status"] == "PASS" and not run["pageErrors"]
            assert "caelo-works/tle-mirror" in run["sourceDetails"]
            assert all(step["heavyFrames"] + step["canvasCount"] == 1 for step in run["steps"])
        for source_path, digest in proof["source_sha256"].items():
            assert sha((ROOT / source_path).read_bytes()) == digest, "Navigation source changed: " + source_path
        return {"proof": str(path.relative_to(ROOT)), "sha256": sha(path.read_bytes()), "checkpoints": 16}

    for label, operation in (("hub_builds_and_served_bytes", hub), ("pinned_sky_artifacts", sky),
                             ("pilot_feed_api_binding", pilot), ("protected_sources_and_bounded_data", protected),
                             ("original_feed_and_legacy_preview", legacy), ("owner_checkout", owner),
                             ("docker_mounts", containers), ("changed_source_HEAD_binding", sources)):
        check(label, operation)
    if args.skip_browser:
        result["checks"]["browser"] = {"status": "SKIPPED", "reason": "Explicit --skip-browser; qualification remains partial"}
    else:
        check("browser", browser)
        check("navigation_and_final_source_UI", navigation)
    failed = [name for name, value in result["checks"].items() if value["status"] == "FAIL"]
    result["status"] = "FAIL" if failed else "PARTIAL" if args.candidate or args.skip_browser else "PASS"
    destination = args.output or OUT / ("delivery-candidate.json" if args.candidate else "delivery.json")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"status": result["status"], "candidate": args.candidate, "browser_skipped": args.skip_browser,
                      "head": result["head"], "checks": {k: {a: b for a, b in v.items() if a != "evidence"} for k, v in result["checks"].items()},
                      "receipt": str(destination)}, indent=2))
    return int(bool(failed))


if __name__ == "__main__":
    raise SystemExit(main())

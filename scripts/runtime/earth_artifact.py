"""Read-only artifact proof and atomic first installation of the locked release.

Never builds, downloads, changes qualification metadata, or replaces owner data.
The verifier shares the release/input checks used by record_runtime_versions.py.
"""
import argparse
import fcntl
import hashlib
import json
import os
import shutil
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]


def manifest_digest(rows):
    return hashlib.sha256(json.dumps(rows, separators=(",", ":")).encode()).hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def member(root, name):
    relative = Path(name)
    require(not relative.is_absolute() and ".." not in relative.parts, "Unsafe manifest path: " + name)
    path = root / relative
    require(path.resolve().is_relative_to(root.resolve()), "Escaped manifest path: " + name)
    return path


def verify(artifact, repo=REPO, *, qualified=False):
    artifact, repo = Path(artifact), Path(repo)
    require(not artifact.is_symlink(), "Artifact root must be a real directory")
    require(not any(p.is_symlink() for p in artifact.rglob("*")), "Artifact contains symlinks")
    release = json.loads((artifact / "release.json").read_text())
    lock = json.loads((repo / "integrations/renderers.lock.json").read_text())["earth"]
    require(release["schema"] == 1 and release["owner"] == "Astronomy Hub", "Wrong artifact owner/schema")
    require(release["upstream_sha"] == lock["sha"] and release["upstream"] == lock["upstream"], "Upstream pin drift")
    rows = release["files"]
    require(rows and len({r["path"] for r in rows}) == len(rows), "Empty or duplicate artifact manifest")
    require("release.json" not in {r["path"] for r in rows}, "Recursive release manifest")
    for row in rows:
        path = member(artifact, row["path"])
        require(path.is_file() and path.stat().st_size == row["bytes"], "Missing/size mismatch: " + row["path"])
        require(hashlib.sha256(path.read_bytes()).hexdigest() == row["sha256"], "File digest mismatch: " + row["path"])
    require(manifest_digest(rows) == release["artifact_sha256"], "Artifact digest mismatch")
    expected = {r["path"] for r in rows} | {"release.json"}
    require({p.relative_to(artifact).as_posix() for p in artifact.rglob("*") if p.is_file()} == expected, "Unexpected artifact files")
    require("ORAS Earth runtime ready" in (artifact / "health").read_text(), "Missing health marker")
    inputs = release["inputs"]
    require(inputs and len({r["path"] for r in inputs}) == len(inputs), "Empty or duplicate source manifest")
    for row in inputs:
        root = repo if row["path"].startswith("packages/runtime-protocol/") else repo / "runtimes/earth-runtime"
        path = member(root, row["path"])
        require(path.stat().st_size == row["bytes"] and hashlib.sha256(path.read_bytes()).hexdigest() == row["sha256"], "Source drift: " + row["path"])
    if qualified:
        require(release["artifact_sha256"] == lock["artifact_sha256"], "Artifact is not the currently qualified release")
        require(manifest_digest(inputs) == lock["source_input_sha256"], "Source metadata drift")
        for key in ("cesium", "public_exports"):
            require(release[key] == lock[key], "Release metadata drift: " + key)
        served = json.loads((repo / "frontend/public/runtime-versions.json").read_text())["earth"]
        require(served == lock, "Hub runtime metadata differs from renderer lock")
    return release


def install(source, repo=REPO):
    repo = Path(repo)
    parent = repo / "data/runtime-artifacts"
    parent.mkdir(parents=True, exist_ok=True)
    target = parent / "earth"
    with (parent / ".earth-install.lock").open("a") as guard:
        fcntl.flock(guard, fcntl.LOCK_EX)
        if target.exists() or target.is_symlink():
            release = verify(target, repo, qualified=True)
            print("ALREADY VERIFIED", release["artifact_sha256"], target)
            return target
        release = verify(Path(source), repo, qualified=True)
        stage = Path(tempfile.mkdtemp(prefix=".earth-stage-", dir=parent))
        try:
            shutil.copytree(source, stage, dirs_exist_ok=True, symlinks=True)
            verify(stage, repo, qualified=True)
            os.rename(stage, target)  # Same filesystem; current never exposes a partial copy.
            print("INSTALLED VERIFIED", release["artifact_sha256"], target)
        finally:
            if stage.exists():
                shutil.rmtree(stage)
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("verify", "install"))
    parser.add_argument("--source", type=Path)
    args = parser.parse_args()
    try:
        if args.command == "verify":
            target = args.source or REPO / "data/runtime-artifacts/earth"
            release = verify(target, qualified=True)
            print("VERIFIED ARTIFACT", release["artifact_sha256"], target)
        else:
            lock = json.loads((REPO / "integrations/renderers.lock.json").read_text())["earth"]
            source = args.source or Path("/var/tmp/oras-renderers") / ("owned-earth-" + lock["artifact_sha256"])
            install(source)
    except (OSError, ValueError, KeyError) as error:
        parser.exit(1, f"Earth artifact preflight failed: {error}\nProvide the exact qualified artifact with npm run dev:earth:install -- --source /path/to/artifact. No rebuild was attempted. Existing data was retained.\n")


if __name__ == "__main__":
    main()

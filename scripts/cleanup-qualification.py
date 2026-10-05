"""Stop completed allowlisted qualification workloads; preserve all data.

Dry run by default. --apply is explicit authorization to stop these workloads.
Do not run while an allowlisted project has an active qualification in progress.
"""
import argparse
import json
import subprocess

PROJECTS = frozenset({
    "oras-workspace-qualification", "oras-pr59-integration",
    "oras-pr60-interaction-reset", "oras-cesium-prod-review",
})
STANDALONE = frozenset({
    "oras-cesium-production-qualification", "oras-phasec-production-qualification",
    "oras-phasec-sky-qualification", "oras-cesium-shell-final-qualification",
})


def eligible(container):
    labels = container["Config"].get("Labels") or {}
    project = labels.get("com.docker.compose.project", "")
    name = container["Name"].lstrip("/")
    return project in PROJECTS or (name in STANDALONE and project in ("", "astronomy-hub"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    ids = subprocess.check_output(["docker", "ps", "-aq"], text=True).split()
    containers = json.loads(subprocess.check_output(["docker", "inspect", *ids])) if ids else []
    selected = [c for c in containers if eligible(c)]
    for c in selected:
        print("STOP / disable restart:", c["Name"], c["State"]["Status"], flush=True)
    print("Volumes, networks, containers and evidence are retained.", flush=True)
    if not args.apply:
        print("Preview only; rerun with --apply after qualification is finished.")
        return
    for c in selected:
        subprocess.run(["docker", "update", "--restart=no", c["Id"]], check=True, stdout=subprocess.DEVNULL)
        if c["State"]["Status"] in ("running", "restarting"):
            subprocess.run(["docker", "stop", "--timeout", "15", c["Id"]], check=True)


if __name__ == "__main__":
    main()

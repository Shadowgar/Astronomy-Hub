#!/usr/bin/env python3
"""Start only the two preserved PR107 preview containers; never recreate them.

Run from WSL: python3 scripts/validation/recover_owner_preview.py
This verifies Linux HTTP readiness. Windows browser/GPU acceptance is separate.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time
from urllib.request import urlopen

NAMES = ("pr107-owner-backend", "pr107-owner-preview")
TASK = "owner-acceptance-20261027"
NETWORK = "oras-repository-recovery-20261026"
BASE = "http://127.0.0.1:4231"
SCIENCE = "/api/v1/solar-system?epoch=2026-10-27T04:00:00.000Z"
ROUTES = ("/solar-system", "/solar-system?solarBody=earth",
          "/solar-system?solarBody=saturn", "/planet-terrain/apollo17-nac-v1",
          "/owner-review/solar-system-2.1.1/")


def docker(*args):
    return subprocess.check_output(["docker", *args], text=True, timeout=65)


def validate(containers):
    """Validate both containers before any startup operation."""
    if [c["Name"].lstrip("/") for c in containers] != list(NAMES):
        raise ValueError("Expected both existing named owner-preview containers")
    for c in containers:
        name = c["Name"]
        if c["Config"].get("Labels", {}).get("oras.task") != TASK:
            raise ValueError(f"{name}: unexpected task ownership")
        if not c["HostConfig"]["ReadonlyRootfs"]:
            raise ValueError(f"{name}: root filesystem is not read-only")
        if set(c["NetworkSettings"]["Networks"]) != {NETWORK}:
            raise ValueError(f"{name}: unexpected network")
        if c["HostConfig"].get("PublishAllPorts"):
            raise ValueError(f"{name}: unexpected automatic port publishing")
        expected = {} if name.endswith("backend") else {
            "8877/tcp": [{"HostIp": "127.0.0.1", "HostPort": "4231"}]}
        if c["HostConfig"].get("PortBindings", {}) != expected:
            raise ValueError(f"{name}: unexpected port binding; require private 127.0.0.1:4231")
        for mount in c["Mounts"]:
            if mount["Type"] != "bind" or mount["RW"] or not Path(mount["Source"]).exists():
                raise ValueError(f"{name}: missing or writable mount {mount['Destination']}")
        state = c["State"]
        if (state["Status"] not in ("running", "exited", "created")
                or state.get("OOMKilled") or state.get("Error") or state.get("ExitCode", 0)):
            raise ValueError(f"{name}: needs inspection before startup: {state}")
        if state.get("Health", {}).get("Status") == "unhealthy":
            raise ValueError(f"{name}: unhealthy; inspect logs before recovery")


def read_http(route):
    with urlopen(BASE + route, timeout=10) as response:
        if response.status != 200:
            raise ValueError(f"{route}: HTTP {response.status}")
        return response.read()


def main():
    try:
        docker("info", "--format", "{{.ServerVersion}}")
        containers = json.loads(docker("inspect", *NAMES))
        validate(containers)
        for c in containers:
            name = c["Name"].lstrip("/")
            if not c["State"]["Running"]:
                print(f"Starting existing {name}", flush=True)
                docker("start", name)
            else:
                print(f"Already running: {name}")
            if name == NAMES[0]:
                # Wait for source-backed API readiness before starting nginx.
                probe = ("import json,urllib.request; "
                         "r=urllib.request.urlopen('http://127.0.0.1:8000" + SCIENCE + "',timeout=5); "
                         "d=json.load(r); assert len(d['bodies'])>=9")
                deadline = time.monotonic() + 45
                while True:
                    try:
                        docker("exec", name, "python3", "-c", probe)
                        break
                    except subprocess.CalledProcessError:
                        if time.monotonic() >= deadline:
                            raise RuntimeError("Backend scientific API not ready after 45s")
                        time.sleep(1)
        docker("exec", NAMES[1], "nginx", "-t")
        deadline = time.monotonic() + 30
        while True:
            try:
                science = json.loads(read_http(SCIENCE))
                assert len(science["bodies"]) >= 9
                break
            except (OSError, ValueError, AssertionError):
                if time.monotonic() >= deadline:
                    raise RuntimeError("Private proxy/scientific API not ready after 30s; inspect nginx")
                time.sleep(1)
        for route in ROUTES:
            body = read_http(route)
            print(f"HTTP 200 {route} bytes={len(body)} sha256={hashlib.sha256(body).hexdigest()}")
        print("Ready in WSL: http://localhost:4231/solar-system")
        print("Windows browser availability and intended build identity require separate verification.")
        return 0
    except (OSError, ValueError, KeyError, RuntimeError, subprocess.SubprocessError) as error:
        print(f"Preview recovery stopped: {error}", file=sys.stderr)
        print("No container recreation, restart-policy change or data cleanup attempted.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

"""Start only this task's isolated read-only preview; never replace an existing container."""
from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output/satellite-visual-pilot"
NETWORK = "oras-satellite-visual-pilot"
BACKEND = NETWORK + "-backend"
PREVIEW = NETWORK + "-preview"

def run(*args):
    return subprocess.check_output(args, text=True).strip()

def main():
    subprocess.run([sys.executable, "-m", "scripts.skydata.build_visual_satellite_pilot",
                    "--output", str(OUT / "release"), "--validate-only"], cwd=ROOT, check=True)
    assert (OUT / "hub/index.html").is_file(), "Build the Hub first"
    for name in (BACKEND, PREVIEW):
        if subprocess.run(["docker", "inspect", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
            raise SystemExit("Refusing to replace existing task container: " + name)
    old_backend = json.loads(run("docker", "inspect", "oras-satellite-live-backend"))[0]
    old_preview = json.loads(run("docker", "inspect", "oras-satellite-live-preview"))[0]
    environment = dict(item.split("=", 1) for item in old_backend["Config"]["Env"])
    subprocess.run(["docker", "network", "create", NETWORK], check=True)
    backend = ["docker", "run", "-d", "--name", BACKEND, "--network", NETWORK, "--read-only", "--tmpfs", "/tmp"]
    replaced = {"/app/backend": ROOT / "backend", "/app/scripts": ROOT / "scripts",
                "/work": ROOT, "/app/frontend/src/config": ROOT / "frontend/src/config"}
    for mount in old_backend["Mounts"]:
        assert mount["Type"] == "bind" and not mount["RW"]
        source = replaced.get(mount["Destination"], Path(mount["Source"]))
        assert source.exists(), source
        backend += ["--mount", f"type=bind,source={source},target={mount['Destination']},readonly"]
    backend += ["--mount", f"type=bind,source={OUT / 'release'},target=/runtime/satellite-visual-pilot,readonly"]
    for key in ("ORAS_LUNAR_ORIENTATION_DIR", "ORAS_PLANETARY_EPHEMERIS_DIR",
                "ORAS_PLANETARY_SYSTEMS_DIR", "ORAS_CATALOG_PACKS_DIR"):
        backend += ["--env", key + "=" + environment[key]]
    backend += ["--env", "SATELLITE_TLE_FEED_PATH=/runtime/satellite-visual-pilot/tle_satellite.jsonl.gz",
                "--env", "ORAS_SATELLITE_TLE_MANIFEST_PATH=/runtime/satellite-visual-pilot/manifest.json",
                "--env", "ORAS_SATELLITE_RELEASE_PROFILE=visual_satellite_pilot.v1",
                "--workdir", "/app", old_backend["Image"], *old_backend["Config"]["Cmd"]]
    subprocess.run(backend, check=True)
    config = """server {
 listen 8877;
 server_name _;
 include /etc/nginx/mime.types;
 types { application/javascript mjs; application/wasm wasm; }
 root /frontend;
 add_header Cache-Control no-store;
 location = /oras-sky-engine/skydata/tle_satellite.jsonl.gz {
  alias /pilot/tle_satellite.jsonl.gz;
  add_header Content-Encoding gzip;
  add_header Cache-Control no-store;
 }
 location /oras-sky-engine/skydata/ { alias /skydata/; }
 location /earth-runtime/ { alias /earth/; }
 location /planet-runtime/ { alias /planet/; }
 location /planet-data/ { alias /planet-data/; }
 location /api/ { proxy_pass http://oras-satellite-visual-pilot-backend:8000; }
 location /evidence/ { alias /evidence/; autoindex on; }
 location / { try_files $uri $uri/ /index.html; }
}
"""
    (OUT / "nginx.conf").write_text(config)
    preview = ["docker", "run", "-d", "--name", PREVIEW, "--network", NETWORK,
               "--read-only", "--tmpfs", "/var/cache/nginx", "--tmpfs", "/var/run",
               "-p", "0.0.0.0:4227:8877"]
    replacements = {"/etc/nginx/conf.d/default.conf": OUT / "nginx.conf",
                    "/frontend": OUT / "hub", "/evidence": ROOT / "output"}
    for mount in old_preview["Mounts"]:
        assert mount["Type"] == "bind" and not mount["RW"]
        source = replacements.get(mount["Destination"], Path(mount["Source"]))
        assert source.exists(), source
        preview += ["--mount", f"type=bind,source={source},target={mount['Destination']},readonly"]
    preview += ["--mount", f"type=bind,source={OUT / 'release'},target=/pilot,readonly", old_preview["Image"]]
    subprocess.run(preview, check=True)
    receipt = {"backend_command": backend, "preview_command": preview,
               "network": NETWORK, "base_head": "7f5ea4d0c069463852698c836b3cd80a13bd75cf",
               "preview": "http://172.26.23.204:4227/sky-engine",
               "policy": "Task-only containers and network; all scientific/source binds read-only; no volume write or promotion"}
    (OUT / "preview-launch.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"preview": receipt["preview"], "backend": BACKEND, "container": PREVIEW}))

if __name__ == "__main__":
    main()

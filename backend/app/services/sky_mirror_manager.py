from __future__ import annotations

import json
import subprocess
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from scripts.skydata.common import REPO_ROOT

MANIFEST_PATH = REPO_ROOT / "data/manifests/public_stellarium_runtime_parity_manifest.json"
RUNTIME_PACKS_ROOT = REPO_ROOT / "data/runtime-packs"
VENDOR_TEST_SKYDATA_ROOT = REPO_ROOT / "vendor/stellarium-web-engine/apps/test-skydata"
PUBLIC_SKYDATA_ROOT = REPO_ROOT / "frontend/public/oras-sky-engine/skydata"

SUPPORTED_CLASSES = [
    "dss_survey",
    "star_pack_minimal",
    "star_pack_base",
    "star_pack_extended",
    "dso_pack_base",
    "dso_pack_extended",
    "milkyway_survey",
    "landscape_guereins",
    "moon_survey",
    "object_summaries_media",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _tail_jsonl(path: Path, limit: int = 200) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    out: list[dict[str, Any]] = []
    for line in lines[-limit:]:
        try:
            out.append(json.loads(line))
        except Exception:
            out.append({"raw": line})
    return out


def _class_target_paths(class_cfg: dict[str, Any]) -> tuple[str, str]:
    rel = class_cfg.get("oras_runtime_target_path", "").lstrip("/")
    if rel.startswith("oras-sky-engine/skydata/"):
        rel = rel[len("oras-sky-engine/skydata/") :]
    runtime_target = str(PUBLIC_SKYDATA_ROOT / rel)
    vendor_target = str(VENDOR_TEST_SKYDATA_ROOT / rel)
    return runtime_target, vendor_target


@dataclass
class MirrorJob:
    class_name: str
    cmd: list[str]
    process: subprocess.Popen[str] | None = None
    started_at: str | None = None
    updated_at: str | None = None
    status: str = "not_started"
    stdout_tail: list[str] = field(default_factory=list)
    stderr_tail: list[str] = field(default_factory=list)
    return_code: int | None = None
    last_launch_options: dict[str, Any] = field(default_factory=dict)
    last_progress_event: dict[str, Any] = field(default_factory=dict)

    def append_stdout(self, line: str) -> None:
        self.stdout_tail.append(line.rstrip("\n"))
        if len(self.stdout_tail) > 400:
            self.stdout_tail = self.stdout_tail[-400:]
        text = line.strip()
        if text.startswith("{") and text.endswith("}"):
            try:
                payload = json.loads(text)
                if payload.get("event") == "progress":
                    self.last_progress_event = payload
            except Exception:
                pass
        self.updated_at = utc_now()

    def append_stderr(self, line: str) -> None:
        self.stderr_tail.append(line.rstrip("\n"))
        if len(self.stderr_tail) > 400:
            self.stderr_tail = self.stderr_tail[-400:]
        self.updated_at = utc_now()


class SkyMirrorManager:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._jobs: dict[str, MirrorJob] = {}
        self._manifest_cache = _read_json(MANIFEST_PATH).get("classes", {})
        self._class_probe_cache: dict[str, tuple[float, dict[str, Any]]] = {}

    def classes(self) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        for class_name in SUPPORTED_CLASSES:
            cfg = self._manifest_cache.get(class_name, {})
            runtime_target, vendor_target = _class_target_paths(cfg) if cfg else ("", "")
            out.append(
                {
                    "class": class_name,
                    "display_name": class_name.replace("_", " ").title(),
                    "available": bool(cfg) or class_name == "object_summaries_media",
                    "runtime_target_path": runtime_target,
                    "vendor_target_path": vendor_target,
                }
            )
        return out

    def _runtime_pack_root_for(self, class_name: str) -> Path | None:
        cfg = self._manifest_cache.get(class_name)
        if not cfg:
            return None
        target = cfg.get("oras_runtime_target_path", "").lstrip("/")
        if not target.startswith("oras-sky-engine/skydata/"):
            return None
        rel = target[len("oras-sky-engine/skydata/") :]
        return RUNTIME_PACKS_ROOT / rel

    def _status_path_for(self, class_name: str) -> Path | None:
        root = self._runtime_pack_root_for(class_name)
        if not root:
            return None
        return root / "mirror-status.json"

    def _command_for(self, class_name: str, options: dict[str, Any] | None = None) -> list[str]:
        options = options or {}
        python = str(REPO_ROOT / ".venv/bin/python")
        cmd = [python, "scripts/skydata/mirror_public_runtime_data.py", "--class", class_name]
        if class_name in self._manifest_cache:
            cmd.extend(["--confirm-download", "--resume", "--checksum-manifest"])
        if options.get("promote", True):
            cmd.append("--promote-runtime-pack")
        if options.get("full", True):
            cmd.append("--full")
        if options.get("max_files"):
            cmd.extend(["--max-files", str(options["max_files"])])
        cmd.extend(["--order-min", str(options.get("order_min", 0)), "--order-max", str(options.get("order_max", 7))])
        cmd.extend(["--workers", str(options.get("workers", 16))])
        cmd.extend(["--progress", "--progress-interval", str(options.get("progress_interval", 5)), "--jsonl-progress"])
        return cmd

    def _default_options_for(self, class_name: str) -> dict[str, Any]:
        if class_name == "dss_survey":
            return {"full": True, "workers": 16, "order_min": 0, "order_max": 7, "promote": True, "progress_interval": 5}
        if class_name in {"star_pack_minimal", "star_pack_base", "dso_pack_base"}:
            return {"full": False, "workers": 8, "order_min": 0, "order_max": 1, "max_files": 1000, "promote": True, "progress_interval": 5}
        if class_name in {"star_pack_extended", "dso_pack_extended"}:
            return {"full": False, "workers": 4, "order_min": 0, "order_max": 0, "max_files": 200, "promote": True, "progress_interval": 5}
        return {"full": False, "workers": 4, "order_min": 0, "order_max": 0, "promote": True, "progress_interval": 5}

    def _start_reader_threads(self, job: MirrorJob) -> None:
        assert job.process is not None

        def read_stream(stream, sink):
            while True:
                line = stream.readline()
                if not line:
                    break
                sink(line)

        t1 = threading.Thread(target=read_stream, args=(job.process.stdout, job.append_stdout), daemon=True)
        t2 = threading.Thread(target=read_stream, args=(job.process.stderr, job.append_stderr), daemon=True)
        t1.start()
        t2.start()

    def start(self, class_name: str, options: dict[str, Any] | None = None) -> dict[str, Any]:
        if class_name not in SUPPORTED_CLASSES:
            return {"ok": False, "error": f"unsupported class: {class_name}"}
        if class_name in {"star_pack_extended", "dso_pack_extended"}:
            block = self._probe_blocker(class_name)
            if block.get("status") == "blocked":
                return {"ok": False, "class": class_name, **block}
        with self._lock:
            existing = self._jobs.get(class_name)
            if existing and existing.process and existing.process.poll() is None:
                return {"ok": True, "status": "running", "class": class_name, "pid": existing.process.pid, "duplicate": True}
            merged_options = {**self._default_options_for(class_name), **(options or {})}
            cmd = self._command_for(class_name, merged_options)
            proc = subprocess.Popen(
                cmd,
                cwd=str(REPO_ROOT),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
            )
            job = MirrorJob(
                class_name=class_name,
                cmd=cmd,
                process=proc,
                started_at=utc_now(),
                updated_at=utc_now(),
                status="running",
                last_launch_options=merged_options,
            )
            self._jobs[class_name] = job
            self._start_reader_threads(job)
            return {"ok": True, "status": "running", "class": class_name, "pid": proc.pid, "cmd": cmd}

    def _update_job_state(self, class_name: str) -> None:
        job = self._jobs.get(class_name)
        if not job or not job.process:
            return
        rc = job.process.poll()
        if rc is None:
            job.status = "running"
            return
        job.return_code = rc
        job.updated_at = utc_now()
        if job.status in {"paused", "cancelled"}:
            return
        job.status = "complete" if rc == 0 else "failed"

    def cancel(self, class_name: str, pause: bool = False) -> dict[str, Any]:
        with self._lock:
            job = self._jobs.get(class_name)
            if not job or not job.process or job.process.poll() is not None:
                return {"ok": False, "error": "no active job", "class": class_name}
            try:
                job.process.terminate()
            except Exception:
                pass
            job.status = "paused" if pause else "cancelled"
            job.updated_at = utc_now()
            return {"ok": True, "class": class_name, "status": job.status}

    def resume(self, class_name: str) -> dict[str, Any]:
        with self._lock:
            job = self._jobs.get(class_name)
            options = job.last_launch_options if job else {}
        return self.start(class_name, options=options)

    def start_all_required(self, autostart: bool = False) -> dict[str, Any]:
        required = ["dss_survey", "star_pack_minimal", "star_pack_base", "dso_pack_base"]
        results = []
        for class_name in required:
            results.append(self.start(class_name))
        if autostart:
            for class_name in ["star_pack_extended", "dso_pack_extended"]:
                block = self._probe_blocker(class_name)
                results.append({"class": class_name, **block})
        return {"ok": True, "results": results}

    def cancel_all(self) -> dict[str, Any]:
        with self._lock:
            running = [name for name, job in self._jobs.items() if job.process and job.process.poll() is None]
        results = [self.cancel(name, pause=False) for name in running]
        return {"ok": True, "results": results}

    def logs(self, class_name: str) -> dict[str, Any]:
        with self._lock:
            self._update_job_state(class_name)
            job = self._jobs.get(class_name)
            status_path = self._status_path_for(class_name)
            log_path = status_path.parent / "download-log.jsonl" if status_path else None
            return {
                "class": class_name,
                "job": {
                    "status": job.status if job else "not_started",
                    "started_at": job.started_at if job else None,
                    "updated_at": job.updated_at if job else None,
                    "return_code": job.return_code if job else None,
                    "stdout_tail": (job.stdout_tail[-200:] if job else []),
                    "stderr_tail": (job.stderr_tail[-200:] if job else []),
                },
                "download_log_tail": _tail_jsonl(log_path, 200) if log_path else [],
            }

    def failures(self, class_name: str) -> dict[str, Any]:
        status_path = self._status_path_for(class_name)
        if not status_path:
            return {"class": class_name, "failed_files": [], "count": 0}
        failed_path = status_path.parent / "failed-files.json"
        payload = _read_json(failed_path)
        files = payload.get("failed_files") or []
        return {"class": class_name, "failed_files": files, "count": len(files), "path": str(failed_path)}

    def _probe_blocker(self, class_name: str) -> dict[str, Any]:
        now = time.time()
        cached = self._class_probe_cache.get(class_name)
        if cached and now - cached[0] < 600:
            return cached[1]
        cfg = self._manifest_cache.get(class_name)
        if not cfg:
            result = {"status": "blocked", "blocker": "missing manifest class"}
            self._class_probe_cache[class_name] = (now, result)
            return result
        base = str(cfg.get("public_base_url") or "").rstrip("/")
        url = f"{base}/properties"
        headers = {"User-Agent": "oras-mirror-manager/1.0"}
        parsed = urlparse(url)
        if parsed.netloc == "stellarium.sfo2.cdn.digitaloceanspaces.com":
            headers["Origin"] = "https://stellarium-web.org"
        try:
            with urlopen(Request(url, headers=headers), timeout=6) as _:
                result = {"status": "ok"}
        except HTTPError as exc:
            result = {"status": "blocked", "blocker": f"properties HTTP {exc.code}"}
        except Exception as exc:  # noqa: BLE001
            result = {"status": "blocked", "blocker": str(exc)}
        self._class_probe_cache[class_name] = (now, result)
        return result

    def status(self) -> dict[str, Any]:
        classes = self.classes()
        rows: list[dict[str, Any]] = []
        total_bytes = 0
        active_jobs = 0
        completed_classes = 0
        blocked_classes = 0
        partial_classes = 0
        total_failed_files = 0
        for entry in classes:
            class_name = entry["class"]
            with self._lock:
                self._update_job_state(class_name)
                job = self._jobs.get(class_name)
            status_path = self._status_path_for(class_name)
            status_payload = _read_json(status_path) if status_path and status_path.exists() else {}
            failed_path = status_payload.get("failed_files_path")
            checksum_path = status_payload.get("checksum_path")
            log_path = status_payload.get("download_log_path")
            expected = int(status_payload.get("expected_files", 0) or 0)
            downloaded = int(status_payload.get("downloaded_files", 0) or 0)
            failed = int(status_payload.get("failed_files", 0) or 0)
            missing_before = int(status_payload.get("missing_files_before", 0) or 0)
            remaining = int(status_payload.get("remaining_estimate", max(0, missing_before - downloaded)) or 0)
            percent = float(status_payload.get("percent_complete", 0.0) or 0.0)
            bytes_downloaded = int(status_payload.get("bytes_downloaded", 0) or 0)
            total_bytes += bytes_downloaded
            class_status = "not_started"
            if job and job.status == "running":
                class_status = "running"
                active_jobs += 1
            elif job and job.status in {"paused", "cancelled", "failed", "complete"}:
                class_status = job.status
            elif status_payload:
                if bool(status_payload.get("complete")):
                    class_status = "complete"
                elif bool(status_payload.get("interrupted")):
                    class_status = "interrupted"
                elif failed > 0:
                    class_status = "partial"
                elif downloaded > 0:
                    class_status = "partial"
            if class_status == "not_started" and class_name in {"star_pack_extended", "dso_pack_extended"}:
                probe = self._probe_blocker(class_name)
                if probe.get("status") == "blocked":
                    class_status = "blocked"
            if class_status == "complete":
                completed_classes += 1
            if class_status == "partial":
                partial_classes += 1
            if class_status == "blocked":
                blocked_classes += 1
            total_failed_files += failed
            last_progress_event = job.last_progress_event if job else {}
            rows.append(
                {
                    "class": class_name,
                    "display_name": entry["display_name"],
                    "status": class_status,
                    "expected_files": expected,
                    "existing_files": int(status_payload.get("existing_files", 0) or 0),
                    "missing_files_before": missing_before,
                    "downloaded_files": downloaded,
                    "failed_files": failed,
                    "remaining_files": remaining,
                    "percent_complete": percent,
                    "bytes_downloaded": bytes_downloaded,
                    "total_size": int(status_payload.get("bytes_downloaded", 0) or 0),
                    "speed_files_per_sec": float(status_payload.get("files_per_second", 0.0) or 0.0),
                    "speed_mb_per_sec": float(status_payload.get("bytes_per_second", 0.0) or 0.0) / (1024 * 1024),
                    "eta_seconds": status_payload.get("eta_seconds"),
                    "workers": int(status_payload.get("workers", 0) or 0),
                    "active_workers": int(last_progress_event.get("workers", 0) or 0) if class_status == "running" else 0,
                    "current_order": last_progress_event.get("current_order", status_payload.get("order_max")),
                    "source_root": status_payload.get("source_root"),
                    "runtime_target_path": entry["runtime_target_path"],
                    "vendor_target_path": entry["vendor_target_path"],
                    "last_updated": status_payload.get("updated_at"),
                    "last_completed": last_progress_event.get("last_completed"),
                    "blocker": self._probe_blocker(class_name).get("blocker") if class_status == "blocked" else None,
                    "failed_files_path": failed_path,
                    "checksum_path": checksum_path,
                    "log_path": log_path,
                    "job_started_at": job.started_at if job else None,
                    "job_updated_at": job.updated_at if job else None,
                    "job_pid": job.process.pid if job and job.process and job.process.poll() is None else None,
                }
            )
        return {
            "warning": "Admin mirror jobs may fetch external sources. User runtime remains ORAS-hosted only.",
            "global": {
                "total_classes": len(classes),
                "active_jobs": active_jobs,
                "completed_classes": completed_classes,
                "partial_classes": partial_classes,
                "blocked_classes": blocked_classes,
                "total_downloaded_size": total_bytes,
                "total_runtime_size": total_bytes,
                "total_failed_files": total_failed_files,
                "runtime_readiness_summary": f"{completed_classes}/{len(classes)} complete",
                "scanner_status": "unknown",
                "scanner_runtime_forbidden_count": None,
                "last_updated": utc_now(),
            },
            "classes": rows,
        }

    def class_status(self, class_name: str) -> dict[str, Any]:
        payload = self.status()
        for row in payload["classes"]:
            if row["class"] == class_name:
                return row
        return {"class": class_name, "status": "not_started"}

    def promote(self, class_name: str) -> dict[str, Any]:
        cfg = self._manifest_cache.get(class_name)
        if not cfg:
            return {"ok": False, "error": "unsupported class for promotion", "class": class_name}
        target = cfg.get("oras_runtime_target_path", "").lstrip("/")
        if not target.startswith("oras-sky-engine/skydata/"):
            return {"ok": False, "error": "invalid target path", "class": class_name}
        rel = target[len("oras-sky-engine/skydata/") :]
        src_root = RUNTIME_PACKS_ROOT / rel / "runtime-ready" / "surveys"
        if not src_root.exists():
            src_root = RUNTIME_PACKS_ROOT / rel / "runtime-ready"
        if not src_root.exists():
            return {"ok": False, "error": "runtime-ready pack missing", "class": class_name}
        return {"ok": True, "class": class_name, "source_root": str(src_root)}

    def verify(self, class_name: str | None = None) -> dict[str, Any]:
        snapshot = self.status()
        if class_name:
            matched = [c for c in snapshot["classes"] if c["class"] == class_name]
            return {"ok": True, "classes": matched}
        return {"ok": True, **snapshot}

    def run_scanner(self) -> dict[str, Any]:
        cmd = ["npm", "run", "scan:runtime-external-deps:fail"]
        proc = subprocess.run(cmd, cwd=str(REPO_ROOT), text=True, capture_output=True)
        out = proc.stdout or ""
        runtime_forbidden = None
        try:
            payload_start = out.find("{")
            if payload_start >= 0:
                parsed = json.loads(out[payload_start:])
                runtime_forbidden = parsed.get("runtime_forbidden_count")
        except Exception:
            pass
        return {
            "ok": proc.returncode == 0,
            "return_code": proc.returncode,
            "runtime_forbidden_count": runtime_forbidden,
            "stdout_tail": out[-4000:],
            "stderr_tail": (proc.stderr or "")[-4000:],
            "ran_at": utc_now(),
            "command": "npm run scan:runtime-external-deps:fail",
        }


_MANAGER: SkyMirrorManager | None = None


def get_sky_mirror_manager() -> SkyMirrorManager:
    global _MANAGER
    if _MANAGER is None:
        _MANAGER = SkyMirrorManager()
    return _MANAGER

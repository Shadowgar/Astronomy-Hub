from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app


class _FakeMirrorManager:
    def __init__(self):
        self.started = []
        self.cancelled = []

    def classes(self):
        return [{"class": "dss_survey", "display_name": "Dss Survey", "available": True}]

    def status(self):
        return {
            "global": {"total_classes": 1, "active_jobs": 0, "completed_classes": 0, "blocked_classes": 0, "total_downloaded_size": 0, "runtime_readiness_summary": "0/1 complete", "scanner_status": "unknown", "last_updated": "now"},
            "classes": [{"class": "dss_survey", "status": "not_started", "failed_files_path": "/tmp/failed.json"}],
            "warning": "Admin mirror jobs may fetch external sources. User runtime remains ORAS-hosted only.",
        }

    def start(self, class_name, options=None):
        self.started.append((class_name, options or {}))
        return {"ok": True, "class": class_name, "status": "running"}

    def cancel(self, class_name, pause=False):
        self.cancelled.append((class_name, pause))
        return {"ok": True, "class": class_name, "status": "paused" if pause else "cancelled"}

    def resume(self, class_name):
        return {"ok": True, "class": class_name, "status": "running"}

    def logs(self, class_name):
        return {"class": class_name, "job": {"status": "not_started"}, "download_log_tail": []}

    def failures(self, class_name):
        return {"class": class_name, "failed_files": [{"url": "x"}], "count": 1}

    def promote(self, class_name):
        return {"ok": True, "class": class_name}

    def verify(self, class_name=None):
        return {"ok": True, "classes": []}

    def class_status(self, class_name):
        return {"class": class_name, "status": "not_started"}

    def start_all_required(self, autostart=False):
        return {"ok": True, "results": [{"class": "dss_survey", "status": "running"}], "autostart": autostart}

    def cancel_all(self):
        return {"ok": True, "results": []}

    def run_scanner(self):
        return {"ok": True, "runtime_forbidden_count": 0}


def test_mirror_status_and_classes(monkeypatch):
    fake = _FakeMirrorManager()
    monkeypatch.setattr("backend.app.routes.sky_mirror.get_sky_mirror_manager", lambda: fake)
    client = TestClient(app)

    status = client.get("/api/sky/mirror/status")
    assert status.status_code == 200
    assert status.json()["data"]["classes"][0]["class"] == "dss_survey"

    classes = client.get("/api/sky/mirror/classes")
    assert classes.status_code == 200
    assert classes.json()["data"][0]["class"] == "dss_survey"


def test_start_duplicate_and_cancel(monkeypatch):
    fake = _FakeMirrorManager()
    monkeypatch.setattr("backend.app.routes.sky_mirror.get_sky_mirror_manager", lambda: fake)
    client = TestClient(app)

    start = client.post("/api/sky/mirror/start", json={"class": "dss_survey", "options": {"workers": 8}})
    assert start.status_code == 200
    assert start.json()["data"]["status"] == "running"
    assert fake.started[0][0] == "dss_survey"

    cancel = client.post("/api/sky/mirror/cancel", json={"class": "dss_survey"})
    assert cancel.status_code == 200
    assert cancel.json()["data"]["status"] == "cancelled"


def test_logs_and_failed_files_exposed(monkeypatch):
    fake = _FakeMirrorManager()
    monkeypatch.setattr("backend.app.routes.sky_mirror.get_sky_mirror_manager", lambda: fake)
    client = TestClient(app)

    logs = client.get("/api/sky/mirror/logs/dss_survey")
    assert logs.status_code == 200
    assert logs.json()["data"]["class"] == "dss_survey"

    failures = client.get("/api/sky/mirror/failures/dss_survey")
    assert failures.status_code == 200
    assert failures.json()["data"]["count"] == 1

    status = client.get("/api/sky/mirror/status")
    row = status.json()["data"]["classes"][0]
    assert row["failed_files_path"].endswith("failed.json")


def test_start_all_cancel_all_and_stream(monkeypatch):
    fake = _FakeMirrorManager()
    monkeypatch.setattr("backend.app.routes.sky_mirror.get_sky_mirror_manager", lambda: fake)
    client = TestClient(app)

    start_all = client.post("/api/sky/mirror/start-all", json={"autostart": True})
    assert start_all.status_code == 200
    assert start_all.json()["data"]["autostart"] is True

    cancel_all = client.post("/api/sky/mirror/cancel-all")
    assert cancel_all.status_code == 200

    status_class = client.get("/api/sky/mirror/status/dss_survey")
    assert status_class.status_code == 200
    assert status_class.json()["data"]["class"] == "dss_survey"

    scan = client.post("/api/sky/mirror/scan")
    assert scan.status_code == 200
    assert scan.json()["data"]["runtime_forbidden_count"] == 0

    with client.stream("GET", "/api/sky/mirror/stream?once=1") as stream:
        assert stream.status_code == 200
        assert stream.headers["content-type"].startswith("text/event-stream")
        first = next(stream.iter_text())
        assert "data:" in first

from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import APIRouter, Body
from fastapi.responses import StreamingResponse

from backend.app.services.sky_mirror_manager import get_sky_mirror_manager

router = APIRouter()


@router.get("/sky/mirror/classes")
async def get_mirror_classes():
    return {"data": get_sky_mirror_manager().classes(), "error": None, "meta": {}}


@router.get("/sky/mirror/status")
async def get_mirror_status():
    return {"data": get_sky_mirror_manager().status(), "error": None, "meta": {}}


@router.get("/sky/mirror/status/{class_name}")
async def get_mirror_status_class(class_name: str):
    return {"data": get_sky_mirror_manager().class_status(class_name), "error": None, "meta": {}}


@router.post("/sky/mirror/start")
async def start_mirror_job(payload: dict[str, Any] = Body(default_factory=dict)):
    mgr = get_sky_mirror_manager()
    class_name = payload.get("class")
    options = payload.get("options") or {}
    if isinstance(class_name, list):
        results = [mgr.start(c, options=options) for c in class_name]
        return {"data": {"results": results}, "error": None, "meta": {}}
    if not class_name:
        return {"data": None, "error": {"code": "invalid_request", "message": "missing class"}, "meta": {}}
    return {"data": mgr.start(class_name, options=options), "error": None, "meta": {}}


@router.post("/sky/mirror/start-all")
async def start_all_mirror_jobs(payload: dict[str, Any] = Body(default_factory=dict)):
    autostart = bool(payload.get("autostart", False))
    return {"data": get_sky_mirror_manager().start_all_required(autostart=autostart), "error": None, "meta": {}}


@router.post("/sky/mirror/pause")
async def pause_mirror_job(payload: dict[str, Any] = Body(default_factory=dict)):
    class_name = payload.get("class")
    if not class_name:
        return {"data": None, "error": {"code": "invalid_request", "message": "missing class"}, "meta": {}}
    return {"data": get_sky_mirror_manager().cancel(class_name, pause=True), "error": None, "meta": {}}


@router.post("/sky/mirror/resume")
async def resume_mirror_job(payload: dict[str, Any] = Body(default_factory=dict)):
    class_name = payload.get("class")
    if not class_name:
        return {"data": None, "error": {"code": "invalid_request", "message": "missing class"}, "meta": {}}
    return {"data": get_sky_mirror_manager().resume(class_name), "error": None, "meta": {}}


@router.post("/sky/mirror/cancel")
async def cancel_mirror_job(payload: dict[str, Any] = Body(default_factory=dict)):
    class_name = payload.get("class")
    if isinstance(class_name, list):
        results = [get_sky_mirror_manager().cancel(c, pause=False) for c in class_name]
        return {"data": {"results": results}, "error": None, "meta": {}}
    if not class_name:
        return {"data": None, "error": {"code": "invalid_request", "message": "missing class"}, "meta": {}}
    return {"data": get_sky_mirror_manager().cancel(class_name, pause=False), "error": None, "meta": {}}


@router.post("/sky/mirror/cancel-all")
async def cancel_all_mirror_jobs():
    return {"data": get_sky_mirror_manager().cancel_all(), "error": None, "meta": {}}


@router.get("/sky/mirror/logs/{class_name}")
async def get_mirror_logs(class_name: str):
    return {"data": get_sky_mirror_manager().logs(class_name), "error": None, "meta": {}}


@router.get("/sky/mirror/failures/{class_name}")
async def get_mirror_failures(class_name: str):
    return {"data": get_sky_mirror_manager().failures(class_name), "error": None, "meta": {}}


@router.post("/sky/mirror/verify/{class_name}")
async def verify_mirror_class(class_name: str):
    return {"data": get_sky_mirror_manager().verify(class_name), "error": None, "meta": {}}


@router.post("/sky/mirror/promote/{class_name}")
async def promote_mirror_class(class_name: str):
    return {"data": get_sky_mirror_manager().promote(class_name), "error": None, "meta": {}}


@router.post("/sky/mirror/scan")
async def run_mirror_scanner():
    return {"data": get_sky_mirror_manager().run_scanner(), "error": None, "meta": {}}


@router.get("/sky/mirror/stream")
async def mirror_stream(once: int = 0):
    async def event_generator():
        emitted = 0
        while True:
            payload = get_sky_mirror_manager().status()
            yield f"data: {json.dumps(payload, sort_keys=True)}\n\n"
            emitted += 1
            if once:
                break
            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

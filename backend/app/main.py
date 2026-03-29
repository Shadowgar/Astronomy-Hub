from fastapi import FastAPI
from fastapi import Request
from fastapi.responses import JSONResponse
import logging
import time
import uuid

from .core.logging import (
    clear_request_id,
    configure_logging,
    get_request_id,
    get_logger,
    log_event,
    log_exception,
    set_request_id,
)

from .routes import assets, alerts, conditions, health, location, objects, passes, scene, scopes, targets


app = FastAPI(title="astronomy-hub-backend")
configure_logging()
logger = get_logger("backend.app")


@app.middleware("http")
async def request_logging_middleware(request, call_next):
    request_id = str(uuid.uuid4())
    set_request_id(request_id)
    route = request.url.path
    method = request.method
    start = time.perf_counter()

    log_event(
        logger,
        logging.INFO,
        "request.start",
        route=route,
        method=method,
        request_id=request_id,
    )

    try:
        response = await call_next(request)
        duration_ms = int((time.perf_counter() - start) * 1000)
        log_event(
            logger,
            logging.INFO,
            "request.end",
            route=route,
            method=method,
            status_code=response.status_code,
            duration_ms=duration_ms,
            request_id=request_id,
        )
        return response
    finally:
        clear_request_id()


@app.get("/")
async def root():
    return {"status": "ok", "service": "astronomy-hub-backend"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = get_request_id()
    log_exception(
        logger,
        "request.exception",
        route=request.url.path,
        method=request.method,
        request_id=request_id,
    )
    return JSONResponse(
        status_code=500,
        content={
            "data": None,
            "error": {
                "code": "internal_error",
                "message": "internal server error",
                "request_id": request_id,
            },
            "meta": {},
        },
    )


app.include_router(health.router, prefix="/api/v1")
app.include_router(conditions.router, prefix="/api/v1")
app.include_router(scene.router, prefix="/api/v1")
app.include_router(scopes.router, prefix="/api/v1")
app.include_router(objects.router, prefix="/api/v1")
app.include_router(targets.router, prefix="/api/v1")
app.include_router(passes.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(location.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")

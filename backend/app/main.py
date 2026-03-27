from fastapi import FastAPI

from .routes import health
from .routes import conditions
from .routes import scene


app = FastAPI(title="astronomy-hub-backend")


@app.get("/")
async def root():
    """Minimal root status for the canonical FastAPI entrypoint.

    This endpoint is intentionally lightweight and contains no business
    logic; it exists only to establish the canonical `app` object for
    future Uvicorn-based startup.
    """
    return {"status": "ok", "service": "astronomy-hub-backend"}


# register isolated routers (additive; routes are intentionally minimal)
app.include_router(health.router)
app.include_router(conditions.router)
app.include_router(scene.router)

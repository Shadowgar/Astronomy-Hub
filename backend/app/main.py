from fastapi import FastAPI

from .routes import health
from .routes import conditions
from .routes import scene


app = FastAPI(title="astronomy-hub-backend")


@app.get("/")
async def root():
    return {"status": "ok", "service": "astronomy-hub-backend"}


app.include_router(health.router, prefix="/api/v1")
app.include_router(conditions.router, prefix="/api/v1")
app.include_router(scene.router, prefix="/api/v1")
from fastapi import FastAPI

from .routes import conditions, health, scene, scopes


app = FastAPI(title="astronomy-hub-backend")


@app.get("/")
async def root():
    return {"status": "ok", "service": "astronomy-hub-backend"}


app.include_router(health.router, prefix="/api/v1")
app.include_router(conditions.router, prefix="/api/v1")
app.include_router(scene.router, prefix="/api/v1")
app.include_router(scopes.router, prefix="/api/v1")

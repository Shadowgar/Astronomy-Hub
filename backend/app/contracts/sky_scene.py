from typing import Any, Literal

from pydantic import BaseModel, Field


class SkySceneObserver(BaseModel):
    label: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    elevation_ft: float | None = None
    elevation_m: float | None = None

    class Config:
        extra = "forbid"


class SkySceneState(BaseModel):
    projection: Literal["stereographic"]
    center_alt_deg: float = Field(..., ge=-90.0, le=90.0)
    center_az_deg: float = Field(..., ge=0.0, le=360.0)
    fov_deg: float = Field(..., gt=0.0, le=180.0)
    stars_ready: bool = False

    class Config:
        extra = "forbid"


class SkySceneInputContext(BaseModel):
    lat: float | None = None
    lon: float | None = None
    elevation_ft: float | None = None
    as_of: str | None = None

    class Config:
        extra = "forbid"


class SkySceneContract(BaseModel):
    scope: Literal["sky"]
    engine: Literal["sky_engine"]
    filter: Literal["visible_now"]
    timestamp: str
    observer: SkySceneObserver
    scene_state: SkySceneState
    objects: list[dict[str, Any]] = Field(default_factory=list)
    degraded: bool = False
    missing_sources: list[str] = Field(default_factory=list)
    input_context: SkySceneInputContext

    class Config:
        extra = "forbid"
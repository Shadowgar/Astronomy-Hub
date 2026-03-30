from typing import List, Optional, Literal

from pydantic import BaseModel, Field


# Canonical Phase 1 contracts (minimal, authoritative shapes)


Phase1Type = Literal["satellite", "planet", "deep_sky"]


class Position(BaseModel):
    # approximate position when applicable
    azimuth: Optional[float] = None
    elevation: Optional[float] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

    class Config:
        extra = "forbid"


class Visibility(BaseModel):
    is_visible: bool
    visibility_window_start: Optional[str] = None
    visibility_window_end: Optional[str] = None

    class Config:
        extra = "forbid"


class SceneObjectSummary(BaseModel):
    id: str
    name: str
    type: Phase1Type
    engine: str
    summary: str
    time_relevance: str
    reason_for_inclusion: str
    detail_route: str
    position: Optional[Position] = None
    visibility: Optional[Visibility] = None
    relevance_score: Optional[float] = Field(None, ge=0.0)

    class Config:
        extra = "forbid"


class ObjectDetail(BaseModel):
    id: str
    name: str
    type: Phase1Type
    engine: str
    summary: str
    description: Optional[str] = None
    position: Optional[Position] = None
    visibility: Optional[Visibility] = None
    media: Optional[List[dict]] = None
    related_objects: Optional[List[dict]] = None

    class Config:
        extra = "forbid"


class SceneContract(BaseModel):
    scope: Literal["above_me"]
    engine: str
    filter: str
    timestamp: str
    objects: List[SceneObjectSummary]

    class Config:
        extra = "forbid"

from pydantic import BaseModel, Field
from typing import Optional


class DarknessWindow(BaseModel):
    start: str
    end: str

    class Config:
        extra = "forbid"


class Conditions(BaseModel):
    location_label: str
    cloud_cover_pct: int = Field(ge=0, le=100)
    moon_phase: str
    darkness_window: DarknessWindow
    observing_score: str
    summary: str
    last_updated: str

    class Config:
        extra = "forbid"

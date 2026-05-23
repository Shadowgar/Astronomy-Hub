from pydantic import BaseModel


class Target(BaseModel):
    name: str
    category: str
    direction: str
    elevation_band: str
    best_time: str
    difficulty: str
    reason: str

    class Config:
        extra = "forbid"

from typing import Literal
from pydantic import BaseModel, conlist

Vector = conlist(float, min_items=3, max_items=3)

class Sample(BaseModel):
    epoch: str
    position_au: Vector

class Shape(BaseModel):
    model: str
    mean_radius_km: float
    units: Literal['km']
    source: str

class Orientation(BaseModel):
    status: Literal['unavailable']
    source: None

class Surface(BaseModel):
    available: Literal[False]
    reason: str

class Body(BaseModel):
    catalog: Literal['Solar System (JPL)']
    source_id: Literal['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']
    model: Literal['sun','planet']
    name: str
    ephemeris_target: str
    position_reference: str
    position_au: Vector
    trajectory: conlist(Sample, max_items=129)
    body_fixed_frame: None
    shape: Shape
    orientation: Orientation
    surface: Surface

class Source(BaseModel):
    id: str
    release: str
    sha256: str

class SolarSnapshot(BaseModel):
    schema_version: str = 'oras.solar.v1'
    epoch: str
    time_scale: str
    origin: str
    frame: Literal['ICRF']
    units: Literal['AU']
    km_per_au: float
    corrections: str
    source: Source
    trajectory_model: str
    bodies: conlist(Body,min_items=9,max_items=9)

    class Config:
        fields = {'schema_version': 'schema'}

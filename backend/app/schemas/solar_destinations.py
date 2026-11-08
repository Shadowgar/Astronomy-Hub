"""Optional, independently qualified Solar destinations; no planet-source coupling."""
from typing import Literal
from pydantic import BaseModel, Field, confloat, conlist
from backend.app.schemas.planetary_systems import BodyOrientation, Coverage

Vector = conlist(confloat(allow_inf_nan=False), min_items=3, max_items=3)

class State(BaseModel):
    position_au: Vector
    velocity_au_s: Vector

class Sample(State):
    epoch: str
    jd_tdb: float

class Track(BaseModel):
    id: str
    samples: conlist(Sample, min_items=2, max_items=5000)
    step_seconds: int
    max_sampled_error_km: confloat(ge=0, lt=1)
    interpolation: Literal['cubic-hermite'] = 'cubic-hermite'

class Identity(BaseModel):
    catalog: Literal['JPL-SPK','JPL-SBDB']
    source_id: str
    model: str
    reference: str

class BodySource(BaseModel):
    id: str
    url: str
    sha256: str
    solution: str
    uncertainty: str

class Body(BaseModel):
    id: str
    name: str
    classification: Literal['dwarf-planet','asteroid','comet']
    identity: Identity
    status: Literal['qualified','unavailable']
    reason: str | None
    radius_km: confloat(gt=0) | None
    radius_source: str | None
    state: State | None
    coverage: Coverage
    sampled_coverage: Coverage | None
    source: BodySource
    orientation_available: bool
    surface_orientation_status: str
    eccentricity: confloat(ge=0) | None = None

class Source(BaseModel):
    id: Literal['jpl_solar_destinations_local']
    release: str
    sha256: str
    url: str

class Destinations(BaseModel):
    schema_version: Literal['oras.solar-destinations.v1'] = Field(alias='schema')
    epoch: str
    jd_tdb: float
    frame: Literal['ICRF']
    origin: Literal['Sun center (10)']
    units: Literal['AU; AU/s']
    corrections: Literal['geometric; no light-time or aberration']
    source: Source
    bodies: list[Body]
    tracks: list[Track]
    orientations: dict[str,BodyOrientation]
    pluto_barycenter: State | None
    qualification: str

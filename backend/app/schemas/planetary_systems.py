from typing import Literal
from pydantic import BaseModel, Field, conlist, confloat, conint

Vector = conlist(confloat(allow_inf_nan=False), min_items=3, max_items=3)


class Parent(BaseModel):
    id: str
    name: str
    naif_id: str
    radius_km: confloat(gt=0)
    radius_source: str
    material: str


class Surface(BaseModel):
    available: bool
    destination: str | None


class Satellite(BaseModel):
    id: str
    name: str
    naif_id: str
    radius_km: confloat(gt=0) | None
    radius_source: str | None
    status: Literal['qualified','unavailable']
    reason: str | None
    surface: Surface


class System(BaseModel):
    id: str
    name: str
    parent: Parent
    status: Literal['qualified','unavailable']
    reason: str | None
    satellites: list[Satellite]


class SystemCatalog(BaseModel):
    schema_version: Literal['oras.planetary-systems.v1'] = Field(alias='schema')
    systems: list[System]


class State(BaseModel):
    position_km: Vector
    velocity_km_s: Vector


class Sample(State):
    epoch: str
    jd_tdb: float


class Track(BaseModel):
    id: str
    samples: conlist(Sample, min_items=2, max_items=5000)
    step_seconds: conint(ge=600, le=3600) | None = None


class Coverage(BaseModel):
    start: str
    end: str


class Time(BaseModel):
    input_scale: Literal['UTC']
    evaluation_scale: Literal['TDB']
    jd_tdb: float


class SourceSeries(BaseModel):
    target_id: str
    center_id: str
    target_header: str
    center_header: str
    source_sha256: str
    source_url: str


class Source(BaseModel):
    id: str
    release: str
    sha256: str
    url: str
    coverage_start_jd_tdb: float | None = None
    coverage_end_jd_tdb: float | None = None
    series: list[SourceSeries] = Field(default_factory=list)
    transition: str | None = None


class Sampling(BaseModel):
    step_seconds: conint(ge=600, le=3600)
    interpolation: Literal['cubic-hermite']
    max_position_error_km: confloat(ge=0, le=1)
    qualification_points_per_segment: conint(ge=1, le=3)
    time_fraction: str
    qualification: str


class SystemSnapshot(BaseModel):
    schema_version: Literal['oras.planetary-system.v1'] = Field(alias='schema')
    system_id: str
    epoch: str
    time: Time
    parent: Parent
    satellites: list[Satellite]
    origin: str
    frame: Literal['ICRF']
    units: Literal['km']
    corrections: Literal['geometric; no light-time or aberration']
    coverage: Coverage
    sampled_coverage: Coverage
    source: Source
    tracks: list[Track]
    sun_track: Track
    state: dict[str,State]
    sampling: Sampling

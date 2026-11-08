"""Mission-specific historical contract; never extends present-day Solar packs."""
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field, conlist

Vector = conlist(float, min_items=3, max_items=3)
Quality = Literal['reconstructed', 'predicted', 'mission-design', 'mixed']


class Coverage(BaseModel):
    start: str
    end: str


class MissionSegment(Coverage):
    id: str
    quality: Quality
    label: str
    target_ids: List[str]


class MissionEvent(BaseModel):
    id: str
    label: str
    epoch: str
    precision: str
    target_id: Optional[str] = None
    source_url: str
    notes: str = ''
    view_epoch: Optional[str] = None
    view_epoch_label: Optional[str] = None
    available: bool


class MissionEntry(BaseModel):
    id: str
    name: str
    naif_id: str
    summary: str
    status: Literal['qualified', 'unavailable']
    representation: Literal['flagship', 'trajectory-only', 'catalogued']
    default_epoch: Optional[str]
    events: List[MissionEvent]
    segments: List[MissionSegment]
    targets: List[Dict[str,str]]
    limitations: List[str]


class MissionCatalog(BaseModel):
    schema_: Literal['oras.mission-catalog.v1'] = Field(alias='schema')
    release_id: str
    missions: List[MissionEntry]


class State(BaseModel):
    position: Vector
    velocity: Vector


class Craft(State):
    id: str
    naif_id: str


class Body(Craft):
    name: str
    appearance_id: str
    radius_km: float
    representation: str = 'reference-body'


class Sample(State):
    epoch: str
    jd_tdb: float


class BodySamples(BaseModel):
    id: str
    samples: List[Sample]


class Samples(Coverage):
    step_seconds: Optional[float]
    craft: List[Sample]
    bodies: List[BodySamples]


class Point(BaseModel):
    epoch: str
    position: Vector


class Track(Coverage):
    segment_id: str
    quality: Quality
    source_label: str
    points: List[Point]
    max_knot_chord_deviation_km: float


class Interpolation(BaseModel):
    method: Literal['cubic-hermite'] = 'cubic-hermite'
    max_sampled_position_error_km: float
    max_sampled_velocity_error_km_s: float
    physical_uncertainty: str


class Attitude(BaseModel):
    status: Literal['unavailable']
    description: str


class MissionState(BaseModel):
    schema_: Literal['oras.mission-state.v1'] = Field(alias='schema')
    mission_id: str
    epoch: str
    jd_tdb: float
    frame: Literal['ICRF']
    origin: Literal['sun']
    position_units: Literal['AU']
    velocity_units: Literal['AU/s']
    segment_id: str
    quality: Quality
    source_label: str
    craft: Craft
    bodies: List[Body]
    tracks: List[Track]
    coverage: List[MissionSegment]
    samples: Samples
    interpolation: Interpolation
    attitude: Attitude


class MissionTrajectory(BaseModel):
    schema_: Literal['oras.mission-trajectory.v1'] = Field(alias='schema')
    mission_id: str
    frame: Literal['ICRF']
    origin: Literal['sun']
    position_units: Literal['AU']
    tracks: List[Track]
    coverage: List[MissionSegment]
    point_count: int

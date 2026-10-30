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


class MotionSample(BaseModel):
    epoch: str
    jd_tdb: float
    position_au: Vector
    velocity_au_s: Vector


class MotionTrack(BaseModel):
    id: Literal['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']
    ephemeris_target: str
    position_reference: str
    samples: conlist(MotionSample,min_items=2,max_items=385)


class Coverage(BaseModel):
    start: str
    end: str


class MotionSampling(BaseModel):
    step_seconds: int
    interpolation: Literal['cubic-hermite']
    max_position_error_km: float
    qualification_points_per_segment: Literal[3]
    time_fraction: str
    qualification: str


class EarthOrientationSample(BaseModel):
    epoch: str
    quaternion: conlist(float,min_items=4,max_items=4)


class EarthOrientation(BaseModel):
    from_frame: Literal['ICRF']
    to_frame: Literal['ITRS']
    quaternion_order: Literal['xyzw']
    interpolation: Literal['shortest-slerp']
    model: str
    polar_motion: str
    accuracy: str
    max_sampled_interpolation_error_arcsec: float
    samples: conlist(EarthOrientationSample,min_items=2,max_items=385)


class SolarMotion(BaseModel):
    schema_version: Literal['oras.solar-motion.v1']
    epoch: str
    origin: Literal['Sun center (10)']
    frame: Literal['ICRF']
    units: Literal['AU,AU/s']
    time_scale: str
    corrections: str
    coverage: Coverage
    sampled_coverage: Coverage
    source: Source
    tracks: conlist(MotionTrack,min_items=9,max_items=9)
    sampling: MotionSampling
    earth_orientation: EarthOrientation

    class Config:
        fields = {'schema_version': 'schema'}

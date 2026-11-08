from typing import Literal
from pydantic import BaseModel, Field, conlist

Vector = conlist(float, min_items=3, max_items=3)
Matrix = conlist(Vector, min_items=3, max_items=3)


class Body(BaseModel):
    catalog: Literal['Solar System (JPL)']
    source_id: Literal['moon']
    model: Literal['moon']
    name: Literal['Moon']
    naif_id: Literal['301']
    position_reference: Literal['Moon center (301)']


class Time(BaseModel):
    input_scale: Literal['UTC']
    evaluation_scale: Literal['TDB']
    jd_tdb: float


class Frame(BaseModel):
    inertial: Literal['ICRF']
    body_fixed: Literal['MOON_ME_DE440_ME421']
    naif_frame_id: Literal['31009']
    icrf_to_body_fixed: Matrix


class Shape(BaseModel):
    model: Literal['reference sphere']
    radii_m: Vector
    source: str


class Coordinates(BaseModel):
    latitude: str
    longitude: str
    height: str


class Illumination(BaseModel):
    direction_body_fixed: Vector
    corrections: str
    source: Literal['JPL DE442s']


class Capabilities(BaseModel):
    orientation: Literal[True]
    globe: Literal[True]
    terrain: Literal[False]
    terrain_reason: str


class Source(BaseModel):
    id: str
    url: str
    sha256: str


class Coverage(BaseModel):
    start: str
    end: str


class PlanetSnapshot(BaseModel):
    schema_version: Literal['oras.planet-view.v1'] = Field(alias='schema')
    body: Body
    epoch: str
    time: Time
    frame: Frame
    shape: Shape
    coordinates: Coordinates
    illumination: Illumination
    capabilities: Capabilities
    sources: list[Source]
    coverage: Coverage
    uncertainty: str

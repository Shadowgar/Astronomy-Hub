"""Public tonight.v1 boundary; timestamps are UTC ISO 8601 strings."""

from typing import Literal

from pydantic import BaseModel

from backend.app.schemas.response_envelope import ResponseEnvelope


class Window(BaseModel):
    start: str
    end: str


class Identity(BaseModel):
    catalog: str
    source_id: str
    model: str


class Opportunity(BaseModel):
    peak_time: str
    peak_altitude_deg: float
    peak_azimuth_deg: float
    dark_duration_minutes: float
    planning_altitude_duration_minutes: float
    dark_horizon_windows: list[Window]
    above_horizon_windows: list[Window]
    first_above_horizon: str
    last_above_horizon: str
    moon_separation_at_peak_deg: float | None
    moon_altitude_at_peak_deg: float | None


class Ranking(BaseModel):
    policy_version: Literal["tonight-opportunity.v1"]
    rank_reason: str


class Target(Identity):
    name: str
    type: str
    category: Literal["solar-system", "deep-sky", "stars"]
    ra: float
    dec: float
    opportunity: Opportunity
    ranking: Ranking
    sky_engine_url: str


class Twilight(BaseModel):
    sun_altitude_deg: float
    windows: list[Window]
    dusk: str | None
    dawn: str | None


class Moon(BaseModel):
    time: str
    altitude_deg: float
    illumination_fraction: float
    source: str


class Night(BaseModel):
    night_date: str
    timezone: str
    interval_start: str
    interval_end: str
    status: Literal["available", "no_astronomical_darkness", "ephemeris_unavailable"]
    twilight: dict[str, Twilight]
    astronomical_darkness: list[Window]
    dark_duration_minutes: float
    moon: Moon | None


class ForecastHour(BaseModel):
    time: str
    cloud_cover_pct: float | None = None
    visibility_m: float | None = None
    precipitation_probability_pct: float | None = None
    temperature_c: float | None = None
    humidity_pct: float | None = None
    wind_kmh: float | None = None
    dew_point_c: float | None = None
    weather_code: float | None = None


class Forecast(BaseModel):
    status: Literal["available", "partial", "unavailable", "stale"]
    provider: str
    fetched_at: str | None
    generated_at: str | None
    coverage_start: str | None
    coverage_end: str | None
    hours: list[ForecastHour]


class TonightData(BaseModel):
    night: Night
    targets: list[Target]
    top_opportunities: list[Identity]
    forecast: Forecast


class TonightResponse(ResponseEnvelope):
    data: TonightData

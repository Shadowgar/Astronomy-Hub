"""Bounded heliophysics facts and observations; no inferred 3-D boundary."""
from datetime import datetime
import math
from typing import List, Literal, Optional, Union

from pydantic import BaseModel, Field, confloat, conint, conlist, constr, root_validator, validator

Text = constr(min_length=1, max_length=2400)
ShortText = constr(min_length=1, max_length=300)
Finite = confloat(allow_inf_nan=False)
Positive = confloat(gt=0, allow_inf_nan=False)
NonNegative = confloat(ge=0, allow_inf_nan=False)
Vector = conlist(Finite, min_items=3, max_items=3)
Strings = conlist(Text, max_items=32)
Hash = constr(regex=r'^[0-9a-f]{64}$')
ProductId = Literal['ibex-ena-map', 'imap-magnetic-field']


class Contract(BaseModel):
    class Config:
        extra = 'forbid'
        allow_inf_nan = False


def utc(value):
    stamp = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if not value.endswith('Z') or stamp.utcoffset().total_seconds() != 0:
        raise ValueError('Explicit UTC required')
    return value


class Source(Contract):
    id: ShortText
    title: Text
    url: Text
    publisher: ShortText
    rights: Text


class ObservationMetadata(Contract):
    publisher: ShortText
    instrument: ShortText
    product: ShortText
    version: ShortText
    observation_start: ShortText
    observation_end: ShortText
    frame: ShortText
    units: ShortText
    energy: Text
    projection: Text
    calibration: Text
    coverage: Text
    rights: Text
    attribution: Text
    source_urls: conlist(Text, min_items=1, max_items=16)
    source_sha256: conlist(Hash, min_items=1, max_items=16)
    limitations: Strings


class AngularMap(Contract):
    longitude_deg: conlist(Finite, min_items=1, max_items=360)
    latitude_deg: conlist(Finite, min_items=1, max_items=180)
    flux: conlist(conlist(Optional[Finite], max_items=360), max_items=180)
    uncertainty: conlist(conlist(Optional[NonNegative], max_items=360), max_items=180)
    mask: conlist(conlist(bool, max_items=360), max_items=180)

    @root_validator(skip_on_failure=True)
    def dimensions_and_coverage(cls, values):
        lon, lat = values.get('longitude_deg', []), values.get('latitude_deg', [])
        if (not lon or not lat or any(not 0 <= x < 360 for x in lon)
                or any(not -90 <= x <= 90 for x in lat)
                or any(a >= b for a, b in zip(lon, lon[1:]))
                or any(a >= b for a, b in zip(lat, lat[1:]))):
            raise ValueError('Invalid angular bin centers')
        for name in ('flux', 'uncertainty', 'mask'):
            rows = values.get(name, [])
            if len(rows) != len(lat) or any(len(row) != len(lon) for row in rows):
                raise ValueError('Angular product dimensions differ')
        for row, uncertainties, mask in zip(values['flux'], values['uncertainty'], values['mask']):
            for flux, error, excluded in zip(row, uncertainties, mask):
                if excluded != (flux is None) or excluded != (error is None):
                    raise ValueError('Missing angular measurements must be masked')
        return values


class TimeSeries(Contract):
    time_utc: conlist(ShortText, min_items=1, max_items=4096)
    value: conlist(Optional[NonNegative], min_items=1, max_items=4096)
    minimum: conlist(Optional[NonNegative], min_items=1, max_items=4096)
    maximum: conlist(Optional[NonNegative], min_items=1, max_items=4096)
    count: conlist(conint(strict=True, ge=0, le=1000000), min_items=1, max_items=4096)
    rejected_count: conlist(conint(strict=True, ge=0, le=1000000), min_items=1, max_items=4096)
    quality_bitmask: conlist(conint(strict=True, ge=0, le=4294967295), min_items=1, max_items=4096)

    @root_validator(skip_on_failure=True)
    def samples(cls, values):
        times = values.get('time_utc', [])
        stamps = [datetime.fromisoformat(utc(t).replace('Z', '+00:00')) for t in times]
        if any(a >= b for a, b in zip(stamps, stamps[1:])):
            raise ValueError('Observation times must increase')
        if any(len(values.get(key, [])) != len(times) for key in ('value', 'minimum', 'maximum', 'count', 'rejected_count', 'quality_bitmask')):
            raise ValueError('Observation array lengths differ')
        for index, count in enumerate(values['count']):
            low, value, high = (values[key][index] for key in ('minimum', 'value', 'maximum'))
            if count == 0:
                if any(x is not None for x in (low, value, high)):
                    raise ValueError('Empty bins must remain missing')
            elif any(x is None for x in (low, value, high)) or not low <= value <= high:
                raise ValueError('Invalid observation variability envelope')
        return values


class ObservationProduct(Contract):
    schema_: Literal['oras.heliophysics-observation.v1'] = Field(alias='schema')
    id: ProductId
    kind: Literal['angular-map', 'time-series']
    metadata: ObservationMetadata
    data: Union[AngularMap, TimeSeries]

    @root_validator(skip_on_failure=True)
    def product_identity(cls, values):
        identity, kind, data = values.get('id'), values.get('kind'), values.get('data')
        if identity == 'ibex-ena-map' and (kind != 'angular-map' or not isinstance(data, AngularMap)):
            raise ValueError('IBEX product must be an angular map')
        if identity == 'imap-magnetic-field' and (kind != 'time-series' or not isinstance(data, TimeSeries)):
            raise ValueError('IMAP product must be a time series')
        return values


class ObservationEntry(Contract):
    id: ProductId
    status: Literal['qualified', 'unavailable']
    reason: Text
    metadata: Optional[ObservationMetadata] = None


class ObservedCrossing(Contract):
    date: constr(regex=r'^\d{4}-\d{2}-\d{2}$')
    precision: Literal['day']
    distance_au: Positive
    approximate: Literal[True]
    evidence_class: Literal['measured-observation']
    source_ids: Strings


class CrossingGeometry(Contract):
    epoch: ShortText
    jd_tdb: Positive
    naif_id: Literal['-31', '-32']
    frame: Literal['ICRF']
    origin: Literal['sun']
    position: Vector
    velocity: Vector
    position_units: Literal['AU']
    velocity_units: Literal['AU/s']
    distance_au: Positive
    sun_direction: Vector
    quality: Literal['predicted']
    source_label: Text
    source_manifest_sha256: Hash
    physical_uncertainty: Text

    _utc = validator('epoch', allow_reuse=True)(utc)

    @root_validator(skip_on_failure=True)
    def consistent_geometry(cls, values):
        position, direction = values.get('position'), values.get('sun_direction')
        radius = values.get('distance_au')
        if position is not None and direction is not None and radius is not None:
            if not math.isclose(math.hypot(*position), radius, rel_tol=1e-12):
                raise ValueError('Distance is not the source vector norm')
            if any(not math.isclose(d, -p / radius, abs_tol=1e-12) for p, d in zip(position, direction)):
                raise ValueError('Sun direction must point from the spacecraft to the origin')
        return values


class Crossing(Contract):
    id: Literal['voyager1-heliopause', 'voyager2-heliopause']
    mission_id: Literal['voyager1', 'voyager2']
    name: ShortText
    observed: ObservedCrossing
    position_status: Literal['qualified', 'unavailable']
    position_unavailable_reason: Optional[Text] = None
    geometry: Optional[CrossingGeometry]
    epoch_note: Text
    interpretation: Text
    mission_url: ShortText

    @root_validator(skip_on_failure=True)
    def availability(cls, values):
        geometry = values.get('geometry')
        if (values.get('position_status') == 'qualified') != (geometry is not None):
            raise ValueError('Crossing geometry availability differs')
        if geometry is not None:
            identity = values.get('mission_id')
            if geometry.naif_id != {'voyager1': '-31', 'voyager2': '-32'}[identity]:
                raise ValueError('Crossing spacecraft identity differs')
            observed = values.get('observed')
            if observed and not geometry.epoch.startswith(observed.date + 'T'):
                raise ValueError('Geometry must belong to its historical crossing date')
        return values


class Comparison(Contract):
    mode: Literal['separate-historical-events']
    simultaneous: Literal[False]
    description: Text


class HeliosphereComponent(Contract):
    id: ShortText
    name: ShortText
    evidence_class: Literal['illustrative']
    description: Text


class ModelLiterature(Contract):
    id: ShortText
    title: Text
    url: Text
    assumptions: Text
    limitations: Text
    status: Literal['literature-only']


class Heliosphere(Contract):
    representation: Literal['illustrative']
    scientific_model_status: Literal['not-qualified']
    components: conlist(HeliosphereComponent, min_items=5, max_items=5)
    model_literature: conlist(ModelLiterature, min_items=1, max_items=8)
    limitations: Strings


class CometExample(Contract):
    name: ShortText
    source_url: Text
    orbit_status: Literal['not-admitted']
    description: Text


class OortCloud(Contract):
    evidence_class: Literal['theoretical']
    inner_extent_au: conlist(Positive, min_items=2, max_items=2)
    outer_extent_au: conlist(Positive, min_items=2, max_items=2)
    source_ids: Strings
    limitations: Strings
    comet_examples: conlist(CometExample, max_items=8)


class ScaleConstants(Contract):
    au_km: Literal[149597870.7]
    light_speed_km_s: Literal[299792.458]
    julian_year_days: Literal[365.25]


class BeyondContext(Contract):
    schema_: Literal['oras.beyond-context.v1'] = Field(alias='schema')
    frame: Literal['ICRF']
    origin: Literal['sun']
    units: Literal['AU']
    constants: ScaleConstants
    comparison: Comparison
    crossings: conlist(Crossing, min_items=2, max_items=2)
    heliosphere: Heliosphere
    oort: OortCloud
    sources: conlist(Source, min_items=1, max_items=16)
    observations: conlist(ObservationEntry, min_items=2, max_items=2)

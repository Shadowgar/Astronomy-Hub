"""Finite source catalog; approximate symbols are separate from precise destinations."""
from typing import Literal
from pydantic import BaseModel, Field, StrictStr, confloat, conint, conlist, constr, root_validator

Number=confloat(allow_inf_nan=False)
Digest=constr(regex=r'^[a-f0-9]{64}$')


class Elements(BaseModel):
    epoch_jd_tdb:Number
    a_au:Number|None
    e:confloat(ge=0,allow_inf_nan=False)
    q_au:Number|None
    i_rad:Number|None
    om_rad:Number|None
    w_rad:Number|None
    ma_rad:Number|None
    n_rad_day:Number|None


class Coverage(BaseModel):
    start_jd_tdb:Number
    end_jd_tdb:Number


class Uncertainty(BaseModel):
    condition_code:StrictStr|None
    data_arc_days:confloat(ge=0,allow_inf_nan=False)|None
    observations_used:conint(ge=0)|None
    sigma_e:confloat(ge=0,allow_inf_nan=False)|None
    sigma_a_au:confloat(ge=0,allow_inf_nan=False)|None


class PopulationBody(BaseModel):
    catalog:Literal['JPL SBDB']
    source_id:constr(strict=True,regex=r'^\d+$',max_length=30)
    designation:constr(strict=True,min_length=1,max_length=100)
    name:constr(strict=True,min_length=1,max_length=200)
    iau_name:StrictStr|None
    population:Literal['asteroid-belt','trans-neptunian','comets']
    object_class:Literal['asteroid','trans-neptunian-object','comet']
    orbit_class:constr(strict=True,min_length=3,max_length=3)
    dynamical_subclass:None
    orbit_domain:Literal['elliptical','near-parabolic','parabolic','hyperbolic']
    solution_id:StrictStr
    diameter_km:confloat(gt=0,allow_inf_nan=False)|None
    absolute_magnitude:Number|None
    elements:Elements
    uncertainty:Uncertainty
    representation:Literal['symbolic-approximate','catalog-only']
    unavailable_reason:StrictStr|None
    coverage:Coverage|None

    @root_validator
    def bounded_representation(cls,value):
        e=value.get('elements');coverage=value.get('coverage')
        if e is None:return value
        domain='hyperbolic' if e.e>1 else 'parabolic' if e.e==1 else 'near-parabolic' if e.e>=.98 else 'elliptical'
        if value.get('orbit_domain')!=domain:raise ValueError('Orbit domain does not match source eccentricity')
        if value.get('representation')=='symbolic-approximate':
            import math
            if value.get('population')=='comets' or any(v is None for v in e.dict().values()) or not (0<=e.e<.98 and 0<e.a_au<=300 and e.q_au>0 and 0<=e.i_rad<=math.pi and 0<e.n_rad_day<2*math.pi):
                raise ValueError('Unqualified approximate orbit')
            if not coverage or coverage.start_jd_tdb!=e.epoch_jd_tdb-180 or coverage.end_jd_tdb!=e.epoch_jd_tdb+180 or value.get('unavailable_reason') is not None:
                raise ValueError('Approximation coverage mismatch')
        elif coverage is not None or not value.get('unavailable_reason'):
            raise ValueError('Catalog-only object must not imply position coverage')
        return value


class PopulationModel(BaseModel):
    kind:Literal['two-body-osculating-symbols']
    max_days_from_epoch:Literal[180]
    max_eccentricity_exclusive:Literal[0.98]
    max_semimajor_axis_au:Literal[300]
    ecliptic_obliquity_arcsec:Literal[84381.448]
    population_wide_accuracy_qualified:Literal[False]
    disclosure:constr(min_length=20)


class Source(BaseModel):
    url:constr(regex=r'^https://ssd(?:-api)?\.jpl\.nasa\.gov/')
    sha256:Digest
    bytes:conint(gt=0,le=16*1024*1024)
    acquired_utc:StrictStr


class Comparison(BaseModel):
    source_id:StrictStr
    designation:StrictStr
    population:Literal['asteroid-belt','trans-neptunian']
    jd_tdb:Number
    position_au:conlist(Number,min_items=3,max_items=3)
    velocity_au_s:conlist(Number,min_items=3,max_items=3)
    error_km:confloat(ge=0,le=5e6,allow_inf_nan=False)
    velocity_error_km_s:confloat(ge=0,allow_inf_nan=False)


class Qualification(BaseModel):
    reference:StrictStr
    max_comparison_error_km:confloat(ge=0,le=5e6,allow_inf_nan=False)
    max_velocity_error_km_s:confloat(ge=0,allow_inf_nan=False)
    comparisons:conlist(Comparison,min_items=5,max_items=160)
    reference_files:list[StrictStr]


class Group(BaseModel):
    id:StrictStr
    population:Literal['asteroid-belt','trans-neptunian','comets']
    available:conint(gt=0)
    included:conint(gt=0,le=16384)
    limit:conint(gt=0,le=16384)
    selection:dict[str,str|int]


class PopulationPack(BaseModel):
    schema_version:Literal['oras.solar-populations.v1']=Field(alias='schema')
    release:StrictStr
    acquired_utc:StrictStr
    catalog:Literal['JPL SBDB']
    origin:Literal['Sun center (10)']
    element_frame:Literal['ECLIPJ2000']
    output_frame:Literal['ICRF']
    time_scale:Literal['TDB']
    position_units:Literal['AU']
    velocity_units:Literal['AU/s']
    body_count:conint(gt=0,le=25856)
    groups:conlist(Group,min_items=4,max_items=4)
    model:PopulationModel
    selection:StrictStr
    sources:dict[str,Source]
    terms:dict[str,StrictStr]
    qualification:Qualification
    bodies:conlist(PopulationBody,min_items=1,max_items=25856)
    pack_sha256:Digest|None=None

    @root_validator
    def count_and_identity(cls,value):
        bodies=value.get('bodies',[])
        if len(bodies)!=value.get('body_count') or len({b.source_id for b in bodies})!=len(bodies):raise ValueError('Population count or duplicate identity mismatch')
        return value

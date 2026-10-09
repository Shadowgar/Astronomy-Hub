"""Bounded renderer transport, not a competing astronomy/Above Me contract."""
import asyncio
import time
from collections import OrderedDict

import httpx
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel, Field

router = APIRouter()
from ..services import earth_aircraft_cache as shared_aircraft

class AircraftRecord(BaseModel):
    class Config:
        allow_inf_nan = False
    hex: str = Field(max_length=16)
    flight: str | None = Field(default=None, max_length=32)
    lat: float | None = Field(default=None, ge=-90, le=90)
    lon: float | None = Field(default=None, ge=-180, le=180)
    alt_geom: float | None = None
    alt_baro: float | str | None = None
    seen: float | None = Field(default=None, ge=0)
    seen_pos: float | None = Field(default=None, ge=0)
    gs: float | None = None
    track: float | None = None
    baro_rate: float | None = None
    geom_rate: float | None = None
    category: str | None = Field(default=None, max_length=4)

class AircraftFeed(BaseModel):
    class Config:
        allow_inf_nan = False
    now: float
    ac: list[AircraftRecord] = Field(max_items=2000)
    cached: bool = False

# Local coalescing supplements the cross-worker Redis dispatch budget.
_cache: OrderedDict = OrderedDict()
_lock = asyncio.Lock()
_inflight: dict[tuple[float, float], asyncio.Task] = {}

async def fetch_aircraft(point: tuple[float, float]) -> AircraftFeed:
    async with httpx.AsyncClient(timeout=8, follow_redirects=False) as client:
        async with client.stream('GET', f'https://api.adsb.lol/v2/point/{point[0]}/{point[1]}/100') as response:
            response.raise_for_status()
            body = bytearray()
            async for chunk in response.aiter_bytes():
                body.extend(chunk)
                if len(body) > 2_000_000:
                    raise ValueError('response exceeds cap')
            return AircraftFeed.parse_raw(body)

async def read_and_cache(point: tuple[float, float]) -> AircraftFeed:
    payload = None
    limited = False
    try:
        async def acquire():
            cached = await shared_aircraft.claim(point)
            if cached is not None:
                if cached.get('unavailable'):
                    raise ValueError('source unavailable')
                return AircraftFeed.parse_obj(cached).copy(update={'cached': True})
            try:
                acquired = await fetch_aircraft(point)
            except (httpx.HTTPError, ValueError, TimeoutError) as error:
                await shared_aircraft.retain(point, None, shared_aircraft.retry_seconds(error))
                raise
            acquired.cached = False
            await shared_aircraft.retain(point, acquired)
            return acquired
        payload = await asyncio.wait_for(acquire(), timeout=8)
        return payload
    except shared_aircraft.AircraftBudgetError:
        limited = True
        raise
    except (httpx.HTTPError, ValueError, TimeoutError):
        raise ValueError('source unavailable') from None
    finally:
        async with _lock:
            if not limited:
                _cache[point] = (time.monotonic() + (30 if payload is not None else 60), payload)
            while len(_cache) > 64:
                _cache.popitem(last=False)
            _inflight.pop(point, None)

async def read_aircraft(lat: float, lon: float) -> AircraftFeed:
    point = (round(lat, 1), round(lon, 1))
    async with _lock:
        cached = _cache.get(point)
        if cached and time.monotonic() < cached[0]:
            if cached[1] is None:
                raise ValueError('source unavailable')
            return cached[1].copy(update={'cached': True})
        task = _inflight.get(point)
        if task is None:
            if len(_inflight) >= 64:
                raise ValueError('source unavailable')
            task = asyncio.create_task(read_and_cache(point))
            # Retrieve errors even if all HTTP callers disconnect from the shared task.
            task.add_done_callback(lambda done: None if done.cancelled() else done.exception())
            _inflight[point] = task
    return await asyncio.shield(task)

@router.get('/earth/aircraft', response_model=AircraftFeed)
async def aircraft(response: Response, lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180)):
    response.headers['Content-License'] = 'https://opendatacommons.org/licenses/odbl/1-0/'
    try:
        return await read_aircraft(lat, lon)
    except shared_aircraft.AircraftBudgetError as error:
        raise HTTPException(status_code=429, detail='Regional aircraft acquisition budget busy', headers={'Retry-After':str(error.retry_after)}) from None
    except ValueError:
        raise HTTPException(status_code=503, detail='Aircraft source unavailable') from None

# Normalized event/surface contracts, separate from astronomy discovery.
from ..services.earth_events import EventFeed, RadarFeed, read_feed, retain_radar_snapshot, read_radar_image

@router.get('/earth/earthquakes',response_model=EventFeed)
async def earthquakes(response:Response):
    response.headers['Content-License']='https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits'
    try:return (await read_feed('earthquakes'))[0]
    except ValueError:raise HTTPException(503,'Earthquake source unavailable') from None

@router.get('/earth/fire-perimeters',response_model=EventFeed)
async def fire_perimeters(response:Response):
    response.headers['Content-License']='https://data-nifc.opendata.arcgis.com/datasets/nifc::wfigs-current-interagency-fire-perimeters/about'
    try:return (await read_feed('fire-perimeters'))[0]
    except ValueError:raise HTTPException(503,'Fire perimeter source unavailable') from None

@router.get('/earth/weather-radar',response_model=RadarFeed)
async def radar():
    try:return retain_radar_snapshot(await read_feed('weather-radar'))
    except ValueError:raise HTTPException(503,'Radar source unavailable') from None

@router.get('/earth/radar-image')
async def radar_image(time:str=Query(max_length=40)):
    try:
        image=read_radar_image(time)
        return Response(image,media_type='image/png',headers={'Cache-Control':'no-store','Content-License':'https://www.weather.gov/disclaimer'})
    except ValueError:raise HTTPException(503,'Radar image unavailable') from None

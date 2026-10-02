"""Bounded renderer transport, not a competing astronomy/Above Me contract."""
import asyncio
import time
from collections import OrderedDict

import httpx
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel, Field

router = APIRouter()

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

# One coalesced request per coarse point, bounded cache, success/failure TTL.
_cache: OrderedDict = OrderedDict()
_lock = asyncio.Lock()

async def read_aircraft(lat: float, lon: float) -> AircraftFeed:
    point = (round(lat, 1), round(lon, 1))
    async with _lock:
        cached = _cache.get(point)
        if cached and time.monotonic() < cached[0]:
            if cached[1] is None:
                raise ValueError('source unavailable')
            return cached[1]
        try:
            async with httpx.AsyncClient(timeout=8, follow_redirects=False) as client:
                async with client.stream('GET', f'https://api.adsb.lol/v2/point/{point[0]}/{point[1]}/100') as response:
                    response.raise_for_status()
                    body = bytearray()
                    async for chunk in response.aiter_bytes():
                        body.extend(chunk)
                        if len(body) > 2_000_000:
                            raise ValueError('response exceeds cap')
                    payload = AircraftFeed.parse_raw(body)
        except (httpx.HTTPError, ValueError):
            _cache[point] = (time.monotonic() + 60, None)
            while len(_cache) > 64:
                _cache.popitem(last=False)
            raise ValueError('source unavailable') from None
        _cache[point] = (time.monotonic() + 30, payload)
        while len(_cache) > 64:
            _cache.popitem(last=False)
        return payload

@router.get('/earth/aircraft', response_model=AircraftFeed)
async def aircraft(response: Response, lat: float = Query(ge=-90, le=90), lon: float = Query(ge=-180, le=180)):
    response.headers['Content-License'] = 'https://opendatacommons.org/licenses/odbl/1-0/'
    try:
        return await read_aircraft(lat, lon)
    except ValueError:
        raise HTTPException(status_code=503, detail='Aircraft source unavailable') from None

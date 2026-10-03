"""Bounded public Earth feeds. Provider snapshots never follow scene time."""
import asyncio
import json
import math
import struct
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Literal

import httpx
from pydantic import BaseModel, Field

USGS = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
WFIGS = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query'
RADAR = 'https://nowcoast.noaa.gov/geoserver/observations/weather_radar/ows'
CADENCE = {'earthquakes':60, 'fire-perimeters':300, 'weather-radar':240}
BOUNDS = {'west':-130.0, 'south':20.0, 'east':-60.0, 'north':55.0}

class DTO(BaseModel):
    class Config:
        extra = 'forbid'
        allow_inf_nan = False

class EventRecord(DTO):
    id: str = Field(min_length=1, max_length=160)
    name: str = Field(min_length=1, max_length=160)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    occurredAt: str | None = None
    updatedAt: str | None = None
    magnitude: float | None = Field(default=None, ge=2.5, le=10)
    depthKm: float | None = None
    acres: float | None = Field(default=None, ge=0)
    containedPct: float | None = Field(default=None, ge=0, le=100)
    polygons: list[list[list[list[float]]]] | None = None

class EventFeed(DTO):
    schemaVersion: Literal[1] = 1
    kind: Literal['earthquakes','fire-perimeters']
    temporalMode: Literal['EVENT_FEED','CURRENT_SNAPSHOT']
    source: str
    observedAt: str | None
    fetchedAt: str
    records: list[EventRecord] = Field(max_items=500)
    limited: bool = False

class RadarFeed(DTO):
    schemaVersion: Literal[1] = 1
    product: Literal['radar'] = 'radar'
    temporalMode: Literal['CURRENT_SNAPSHOT'] = 'CURRENT_SNAPSHOT'
    source: str = 'NOAA/NWS nowCOAST'
    latest: str
    times: list[str] = Field(min_items=1,max_items=1)
    bounds: dict[str,float]
    tileSize: Literal[256] = 256
    maxLevel: Literal[6] = 6
    tilingScheme: Literal['geographic'] = 'geographic'
    fetchedAt: str


def iso(value):
    return value.astimezone(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')

def epoch(value):
    if not number(value): return None
    try:return iso(datetime.fromtimestamp(value/1000,timezone.utc))
    except (OverflowError,ValueError,OSError):return None

def number(value):return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value)
def text(value):return value[:160] if isinstance(value,str) and value.strip() else None

def collection(payload):
    if not isinstance(payload,dict) or payload.get('type')!='FeatureCollection' or not isinstance(payload.get('features'),list):raise ValueError('Malformed collection')
    if len(payload['features'])>10000:raise ValueError('Record cap exceeded')
    return payload['features']

def normalize_quakes(payload, now=None):
    now=now or datetime.now(timezone.utc);rows=collection(payload)
    metadata=payload.get('metadata');generated=epoch(metadata.get('generated')) if isinstance(metadata,dict) else None
    if not generated or abs(now.timestamp()-datetime.fromisoformat(generated.replace('Z','+00:00')).timestamp())>900:raise ValueError('Stale feed')
    records=[];ids=set();valid_rows=0
    for row in rows:
        try:
            p=row['properties'];g=row['geometry'];coords=g['coordinates'];identifier=row['id']
            if not isinstance(p,dict) or not isinstance(g,dict) or not isinstance(coords,list):continue
            if g['type']!='Point' or not isinstance(identifier,str) or not identifier or len(identifier)>160 or identifier in ids:continue
            if len(coords)<2 or not all(number(x) for x in coords[:2]) or abs(coords[0])>180 or abs(coords[1])>90 or not number(p.get('mag')) or not 0<=p['mag']<=10:continue
            if not epoch(p.get('time')):continue
            valid_rows+=1
            if p['mag']<2.5:continue
            occurred=epoch(p.get('time'))
            if not occurred or not -300<=now.timestamp()-p['time']/1000<=86400:continue
            record=EventRecord(id=identifier,name=text(p.get('place')) or identifier,lat=coords[1],lon=coords[0],magnitude=p['mag'],depthKm=coords[2] if len(coords)>2 and number(coords[2]) else None,occurredAt=occurred,updatedAt=epoch(p.get('updated')))
            records.append(record);ids.add(identifier)
        except (KeyError,TypeError,ValueError,IndexError,AttributeError):continue
    if rows and not valid_rows:raise ValueError('Malformed events')
    records.sort(key=lambda r:(r.magnitude,r.occurredAt),reverse=True)
    return EventFeed(kind='earthquakes',temporalMode='EVENT_FEED',source='U.S. Geological Survey',observedAt=generated,fetchedAt=iso(now),records=records[:500],limited=len(records)>500)

def polygons(geometry):
    if not isinstance(geometry,dict):raise ValueError('Missing geometry')
    shape=geometry.get('coordinates');kind=geometry.get('type')
    result=[shape] if kind=='Polygon' else shape if kind=='MultiPolygon' else None
    if not isinstance(result,list) or not 1<=len(result)<=32:raise ValueError('Invalid polygon count')
    total=0
    for rings in result:
        if not isinstance(rings,list) or not 1<=len(rings)<=16:raise ValueError('Invalid rings')
        for ring in rings:
            if not isinstance(ring,list) or not 4<=len(ring)<=5000 or ring[0][:2]!=ring[-1][:2]:raise ValueError('Invalid ring')
            total+=len(ring)
            for point in ring:
                if not isinstance(point,list) or len(point)<2 or not all(number(x) for x in point[:2]) or abs(point[0])>180 or abs(point[1])>90:raise ValueError('Invalid coordinates')
    if total>10000:raise ValueError('Vertex cap')
    return [[[point[:2] for point in ring] for ring in rings] for rings in result]

def normalize_fires(payload,now=None):
    now=now or datetime.now(timezone.utc);rows=collection(payload);records=[];ids=set();vertices=0
    for row in rows[:100]:
        try:
            p=row['properties'];identifier=p.get('attr_UniqueFireIdentifier') or p.get('poly_IRWINID') or row.get('id')
            if not isinstance(identifier,str) or not identifier or len(identifier)>160 or identifier in ids:continue
            shape=polygons(row['geometry']);points=[point for rings in shape for ring in rings for point in ring]
            if vertices+len(points)>25000:continue
            # Derived geometry bounds centre is a Focus anchor, not an incident location.
            record=EventRecord(id=identifier,name=text(p.get('poly_IncidentName')) or identifier,lat=(min(v[1] for v in points)+max(v[1] for v in points))/2,lon=(min(v[0] for v in points)+max(v[0] for v in points))/2,updatedAt=epoch(p.get('poly_DateCurrent')),polygons=shape,acres=p.get('poly_GISAcres') if number(p.get('poly_GISAcres')) else None,containedPct=p.get('attr_PercentContained') if number(p.get('attr_PercentContained')) else None)
            records.append(record);ids.add(identifier);vertices+=len(points)
        except (KeyError,TypeError,ValueError,IndexError,AttributeError):continue
    if rows and not records:raise ValueError('No valid perimeters')
    return EventFeed(kind='fire-perimeters',temporalMode='CURRENT_SNAPSHOT',source='NIFC/WFIGS',observedAt=max((r.updatedAt for r in records if r.updatedAt),default=None),fetchedAt=iso(now),records=records,limited=True)

def normalize_radar(body,now=None):
    now=now or datetime.now(timezone.utc)
    if len(body)>524288 or b'<!DOCTYPE' in body.upper() or b'<!ENTITY' in body.upper():raise ValueError('Invalid XML')
    try:
        root=ET.fromstring(body);ns={'w':'http://www.opengis.net/wms'}
        layer=next(l for l in root.findall('.//w:Layer',ns) if l.findtext('w:Name',namespaces=ns)=='conus_base_reflectivity_mosaic')
        dimension=next(d for d in layer.findall('w:Dimension',ns) if d.get('name')=='time')
        stamp=datetime.fromisoformat(dimension.attrib['default'].replace('Z','+00:00'))
        if stamp.tzinfo is None or not -300<=now.timestamp()-stamp.timestamp()<=1800:raise ValueError('Stale radar')
        latest=iso(stamp)
        return RadarFeed(latest=latest,times=[latest],bounds=BOUNDS,fetchedAt=iso(now))
    except (ET.ParseError,KeyError,StopIteration):raise ValueError('Invalid radar metadata') from None

async def transport(url,params=None,cap=4000000):
    async with httpx.AsyncClient(timeout=8,follow_redirects=False) as client:
        async with client.stream('GET',url,params=params,headers={'User-Agent':'Astronomy-Hub Earth context'}) as response:
            response.raise_for_status();body=bytearray()
            async for chunk in response.aiter_bytes():
                if len(body)+len(chunk)>cap:raise ValueError('Payload cap')
                body.extend(chunk)
            return bytes(body)

async def acquire(kind):
    if kind=='earthquakes':return normalize_quakes(json.loads(await transport(USGS))),None
    if kind=='fire-perimeters':
        params={'where':'1=1','outFields':'poly_IncidentName,poly_DateCurrent,poly_GISAcres,poly_IRWINID,attr_UniqueFireIdentifier,attr_PercentContained','outSR':'4326','f':'geojson','resultRecordCount':'100','maxAllowableOffset':'0.001','orderByFields':'poly_DateCurrent DESC'}
        return normalize_fires(json.loads(await transport(WFIGS,params))),None
    if kind!='weather-radar':raise ValueError('Unknown provider')
    manifest=normalize_radar(await transport(RADAR,{'service':'WMS','version':'1.3.0','request':'GetCapabilities'},524288))
    png=await transport(RADAR,{'service':'WMS','version':'1.1.1','request':'GetMap','layers':'conus_base_reflectivity_mosaic','styles':'weather_radar_base_reflectivity','format':'image/png','transparent':'true','srs':'EPSG:4326','bbox':'-130,20,-60,55','width':'2048','height':'1024','time':manifest.latest})
    if len(png)<24 or png[:8]!=b'\x89PNG\r\n\x1a\n' or struct.unpack('>II',png[16:24])!=(2048,1024):raise ValueError('Invalid radar image')
    return manifest,png

_cache={};_inflight={}
def reset_cache():_cache.clear()
async def refresh(kind):
    payload=None
    try:
        payload=await asyncio.wait_for(acquire(kind),8);return payload
    except (ValueError,TypeError,httpx.HTTPError,TimeoutError):raise ValueError('Source unavailable') from None
    finally:
        _cache[kind]=(time.monotonic()+(CADENCE[kind] if payload else 60),payload);_inflight.pop(kind,None)

async def read_feed(kind):
    if kind not in CADENCE:raise ValueError('Unknown provider')
    cached=_cache.get(kind)
    if cached and time.monotonic()<cached[0]:
        if cached[1] is None:raise ValueError('Source unavailable')
        return cached[1]
    task=_inflight.get(kind)
    if task is None:
        task=asyncio.create_task(refresh(kind));_inflight[kind]=task
        task.add_done_callback(lambda done:None if done.cancelled() else done.exception())
    return await asyncio.shield(task)

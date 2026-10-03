"""Declared fixtures; these tests do not qualify live providers."""
import asyncio
from datetime import datetime, timezone
import pytest
from app.services import earth_events as events
NOW = datetime(2026, 10, 3, 19, 0, tzinfo=timezone.utc)
MS = int(NOW.timestamp()*1000)
def quake(identifier='us1'):
    return {'id':identifier,'geometry':{'type':'Point','coordinates':[-80,42,10]},'properties':{'mag':3.5,'place':'Fixture event','time':MS-10000,'updated':MS}}
def feed(rows): return {'type':'FeatureCollection','metadata':{'generated':MS},'features':rows}
def fire(identifier='fire1'):
    return {'id':identifier,'geometry':{'type':'Polygon','coordinates':[[[-80,42],[-79.9,42],[-79.9,42.1],[-80,42]]]},'properties':{'attr_UniqueFireIdentifier':identifier,'poly_IncidentName':'Fixture perimeter','poly_DateCurrent':MS,'poly_GISAcres':10,'attr_PercentContained':20}}
def test_quake_fields_ids_time_and_empty():
    result=events.normalize_quakes(feed([quake()]),NOW)
    assert result.records[0].id=='us1' and result.records[0].depthKm==10
    assert result.temporalMode=='EVENT_FEED' and result.observedAt.endswith('Z')
    assert events.normalize_quakes(feed([]),NOW).records==[]
@pytest.mark.parametrize('payload',[{}, {'features':[]},feed([{'id':'broken'}]),feed([dict(quake(),id='')])])
def test_quake_malformed(payload):
    with pytest.raises(ValueError):events.normalize_quakes(payload,NOW)
def test_quake_cap_filter_and_no_fabricated_identity():
    rows=[quake(str(i)) for i in range(600)];result=events.normalize_quakes(feed(rows),NOW)
    assert len(result.records)==500 and result.limited
    missing=quake();missing.pop('id')
    with pytest.raises(ValueError):events.normalize_quakes(feed([missing]),NOW)
def test_fire_polygons_facts_time_empty_and_cap():
    result=events.normalize_fires(feed([fire()]),NOW)
    assert len(result.records[0].polygons)==1 and result.records[0].acres==10
    assert result.temporalMode=='CURRENT_SNAPSHOT' and result.limited
    assert events.normalize_fires(feed([]),NOW).records==[]
    assert len(events.normalize_fires(feed([fire(str(i)) for i in range(101)]),NOW).records)==100
@pytest.mark.parametrize('mutator',[lambda row:row.update(geometry={'type':'Point','coordinates':[-80,42]}),lambda row:row['geometry'].update(coordinates=[[[float('nan'),42],[-80,42],[-79,42],[-80,42]]]),lambda row:row['geometry'].update(coordinates=[[[-80,42],[-79,42],[-79,43],[-80,43]]])])
def test_fire_malformed_geometry(mutator):
    row=fire();mutator(row)
    with pytest.raises(ValueError):events.normalize_fires(feed([row]),NOW)
def test_radar_explicit_source_time_not_scene_time():
    xml=b'<WMS_Capabilities xmlns="http://www.opengis.net/wms"><Capability><Layer><Layer><Name>conus_base_reflectivity_mosaic</Name><Dimension name="time" default="2026-10-03T18:56:00Z">2026-10-03T18:56:00Z</Dimension></Layer></Layer></Capability></WMS_Capabilities>'
    result=events.normalize_radar(xml,NOW)
    assert result.latest=='2026-10-03T18:56:00.000Z' and result.product=='radar'
@pytest.mark.parametrize('xml',[b'',b'<x/>',b'<!DOCTYPE x [<!ENTITY a "x">]><x/>'])
def test_radar_malformed(xml):
    with pytest.raises(ValueError):events.normalize_radar(xml,NOW)
def test_stale_generation_rejected():
    with pytest.raises(ValueError):events.normalize_quakes(feed([quake()]),datetime(2026,10,4,tzinfo=timezone.utc))
def test_independent_coalescing_failure_cache_and_retry(monkeypatch):
    async def scenario():
        events.reset_cache();calls=[];gate=asyncio.Event()
        async def acquire(key):
            calls.append(key)
            if key=='earthquakes':await gate.wait()
            return events.normalize_quakes(feed([]),NOW),None
        monkeypatch.setattr(events,'acquire',acquire)
        a=asyncio.create_task(events.read_feed('earthquakes'));b=asyncio.create_task(events.read_feed('earthquakes'))
        await asyncio.sleep(0);await asyncio.sleep(0)
        await events.read_feed('fire-perimeters');assert calls.count('earthquakes')==1
        gate.set();await asyncio.gather(a,b);assert calls.count('fire-perimeters')==1
        await events.read_feed('earthquakes');assert len(calls)==2
        events.reset_cache()
        async def fail(key):raise ValueError('upstream 429')
        monkeypatch.setattr(events,'acquire',fail)
        with pytest.raises(ValueError):await events.read_feed('earthquakes')
        with pytest.raises(ValueError):await events.read_feed('earthquakes')
        events.reset_cache();monkeypatch.setattr(events,'acquire',acquire)
        assert await events.read_feed('earthquakes')
    asyncio.run(scenario())
@pytest.mark.parametrize('path',['earthquakes','fire-perimeters','weather-radar'])
def test_routes_fail_closed_without_upstream_details(monkeypatch,path):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.routes import earth
    app=FastAPI();app.include_router(earth.router,prefix='/api')
    async def unavailable(kind):raise ValueError('private upstream 403/429/5xx')
    monkeypatch.setattr(earth,'read_feed',unavailable)
    result=TestClient(app).get('/api/earth/'+path)
    assert result.status_code==503 and 'private' not in result.text

def test_image_refuses_timestamp_mismatch_and_unbounded_time(monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.routes import earth
    app=FastAPI();app.include_router(earth.router,prefix='/api');client=TestClient(app)
    async def read(kind):return type('Manifest',(),{'latest':'2026-10-03T19:00:00.000Z'})(),b'fixture png'
    monkeypatch.setattr(earth,'read_feed',read)
    assert client.get('/api/earth/radar-image?time=wrong').status_code==503
    assert client.get('/api/earth/radar-image?time='+'x'*41).status_code==422
    result=client.get('/api/earth/radar-image?time=2026-10-03T19:00:00.000Z')
    assert result.status_code==200 and result.headers['content-type']=='image/png'

@pytest.mark.parametrize('payload',[feed([{'properties':[],'geometry':{},'id':'x'}]),feed([None]),{'type':'FeatureCollection','metadata':None,'features':[]}])
def test_malformed_nested_provider_data_is_controlled(payload):
    with pytest.raises(ValueError):events.normalize_quakes(payload,NOW)

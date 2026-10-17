"""Submitted Photon search. No autocomplete, paid fallback or invented locations.

The pinned God's Eye Photon adapter establishes source/coordinate conventions;
this bounded FastAPI transport retains multiple candidates for explicit choice.
Public courtesy endpoint: https://github.com/komoot/photon#demo-server
"""
import asyncio
import json
import math
import os
import time
from collections import OrderedDict

import httpx

SOURCE='Photon / OpenStreetMap'
ATTRIBUTION_URL='https://www.openstreetmap.org/copyright'
PHOTON_URL='https://photon.komoot.io/api/'

class SearchBusy(ValueError):pass


def text(value,limit=240):
    return value.strip()[:limit] if isinstance(value,str) else ''


def normalize_feature(feature):
    if not isinstance(feature,dict):return None
    geometry=feature.get('geometry');props=feature.get('properties')
    if not isinstance(geometry,dict)or not isinstance(props,dict)or geometry.get('type')!='Point':return None
    coordinates=geometry.get('coordinates')
    if not isinstance(coordinates,list)or len(coordinates)!=2:return None
    lon,lat=coordinates
    if any(isinstance(v,bool)or not isinstance(v,(int,float))or not math.isfinite(v)for v in [lat,lon])or abs(lat)>90 or abs(lon)>180:return None
    osm_type=props.get('osm_type');osm_id=props.get('osm_id')
    if osm_type not in ['N','W','R']or isinstance(osm_id,bool)or not isinstance(osm_id,(str,int))or not str(osm_id).isdigit():return None
    street=' '.join(filter(None,[text(props.get('housenumber'),40),text(props.get('street'))]))
    name=text(props.get('name'))or street
    if not name:return None
    details=[]
    for part in [street,*[text(props.get(k))for k in ['district','city','county','state','postcode','country']]]:
        if part and part!=name and part not in details:details.append(part)
    return {'id':f'osm:{osm_type}:{osm_id}','name':name,'description':', '.join(details)[:1000],
            'kind':text(props.get('type'),64)or text(props.get('osm_value'),64)or 'place','lat':lat,'lon':lon}


async def fetch_photon(query):
    async with httpx.AsyncClient(timeout=6,follow_redirects=False)as client:
        async with client.stream('GET',PHOTON_URL,params={'q':query,'limit':5,'lang':'en'},
            headers={'User-Agent':'Astronomy-Hub/1.0 (+https://github.com/Shadowgar/Astronomy-Hub)','Accept':'application/json'})as response:
            response.raise_for_status();body=bytearray()
            async for chunk in response.aiter_bytes():
                body.extend(chunk)
                if len(body)>250000:raise ValueError('provider payload cap')
            return json.loads(body)


class PlaceSearch:
    """One local backend worker: at most one upstream start/second, no queue.

    Multi-worker/public deployment requires shared admission; R2-A is a disposable
    single-worker preview. Same-query callers share work, cancellation is isolated.
    """
    def __init__(self):
        self.cache=OrderedDict();self.inflight={};self.next_allowed=0.;self.backoff_until=0.;self.lock=asyncio.Lock()

    async def read(self,query):
        query=query.strip();key=query.casefold();now=time.monotonic()
        if os.getenv('EARTH_PLACE_SEARCH_ENABLED','1')!='1':raise ValueError('provider disabled')
        async with self.lock:
            cached=self.cache.get(key)
            if cached and now<cached[0]:
                self.cache.move_to_end(key)
                if cached[1]is None:raise ValueError('provider unavailable')
                return cached[1]
            self.cache.pop(key,None)
            task=self.inflight.get(key)
            if task is None:
                if self.inflight or now<max(self.next_allowed,self.backoff_until):raise SearchBusy('search admission busy')
                self.next_allowed=now+1.1
                task=asyncio.create_task(self.acquire(query,key));self.inflight[key]=task
                task.add_done_callback(lambda done:None if done.cancelled()else done.exception())
        return await asyncio.shield(task)

    async def acquire(self,query,key):
        rows=None
        try:
            payload=await asyncio.wait_for(fetch_photon(query),timeout=7)
            if not isinstance(payload,dict)or not isinstance(payload.get('features'),list):raise ValueError('invalid provider shape')
            rows=[];seen=set()
            for feature in payload['features'][:5]:
                item=normalize_feature(feature)
                if item and item['id']not in seen:rows.append(item);seen.add(item['id'])
            if payload['features']and not rows:
                rows=None
                raise ValueError('invalid provider candidates')
            return rows
        except httpx.HTTPStatusError as error:
            if error.response.status_code in [429,503]:
                retry=error.response.headers.get('Retry-After','60')
                self.backoff_until=time.monotonic()+max(60,min(300,int(retry)if retry.isdigit()else 60))
            raise ValueError('provider unavailable')from None
        except (httpx.HTTPError,ValueError,TimeoutError):raise ValueError('provider unavailable')from None
        finally:
            self.cache[key]=(time.monotonic()+(3600 if rows else 60),rows)
            self.cache.move_to_end(key)
            while len(self.cache)>64:self.cache.popitem(last=False)
            self.inflight.pop(key,None)

service=PlaceSearch()
async def search_places(query):return await service.read(query)

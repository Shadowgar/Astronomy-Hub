import asyncio,json,logging,time,contextlib
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services import earth_search as s
rows=[];started=time.monotonic();calls=[];actual=s.fetch_photon
class Trace(logging.Handler):
 def emit(self,record):
  event=record.getMessage().split(' ',1)[0]
  rows.append({'elapsedMs':round((time.monotonic()-started)*1000),'event':event})
h=logging.getLogger('httpcore');h.setLevel(logging.DEBUG);h.addHandler(Trace())
async def traced(q):
 calls.append({'query':q,'elapsedMs':round((time.monotonic()-started)*1000)})
 try:
  value=await actual(q);calls[-1]['outcome']='payload';calls[-1]['features']=len(value.get('features',[]))if isinstance(value,dict)else None;return value
 except BaseException as e:
  calls[-1]['exceptionClass']=type(e).__name__
  if hasattr(e,'response'):calls[-1]['observedUpstreamStatus']=e.response.status_code
  raise
s.fetch_photon=traced;s.service=s.PlaceSearch();results=[]
with TestClient(app)as c:
 for phase in ['fresh isolated service','same-query cached retry; no upstream retry']:
  at=time.monotonic();r=c.get('/api/earth/search',params={'q':'Springfield'});results.append({'phase':phase,'status':r.status_code,'elapsedMs':round((time.monotonic()-at)*1000),'body':r.json(),'upstreamStarts':len(calls)})
print('QUALIFICATION_RESULT '+json.dumps({'kind':'live Photon via actual FastAPI route in isolated process, no provider mocks','calls':calls,'httpcoreEvents':rows,'results':results,'cacheKeyCount':len(s.service.cache),'backoffActive':s.service.backoff_until>time.monotonic()}))

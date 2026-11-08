"""Isolated qualification entrypoint; production never imports this module.

Replay exact normalized API candidates recorded from genuine R2-A Photon/OSM
responses. This seam deliberately does not represent raw Photon transport or
normalization coverage. The unchanged real FastAPI route supplies validation,
response schema, attribution, errors and headers; the browser selects results.
"""
import hashlib
import json
import os
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
RECORDING=ROOT/'tests/fixtures/earth/r2a-search-recording.json'
RECORDING_SHA='466515b1c87c217f909c9740981360a8ac3b77bd1a4fc7bbd5dd12738e3b517f'


def require_qualification(environment):
    if environment.get('ORAS_RECORDED_SEARCH_QUALIFICATION')!='1':
        raise RuntimeError('Recorded search is qualification-only; explicit opt-in required')


class RecordedSearch:
    def __init__(self,path=RECORDING):
        raw=Path(path).read_bytes()
        if hashlib.sha256(raw).hexdigest()!=RECORDING_SHA:raise ValueError('Original R2-A recording hash mismatch')
        proof=json.loads(raw);run=proof['runs'][0]
        if proof['status']!='PASS'or run['status']!='PASS':raise ValueError('Recording must be a genuine passed source journey')
        self.rows={row['query']:row['results']for row in run['responses']}
        self.calls=[]

    async def read(self,query):
        from backend.app.services.earth_search import SearchBusy
        self.calls.append(query)
        if query=='R2 no-results fixture':return []
        if query=='R2 busy fixture':raise SearchBusy('Declared qualification admission refusal')
        if query not in self.rows:raise ValueError('Declared qualification unavailable or unknown query')
        return self.rows[query]

    def identity(self):
        return {'mode':'recorded-normalized-r2a','recordingSha256':RECORDING_SHA,
                'originalR2aCommit':'27f34a94198f2061c0a5083a68beebd567c7d87f',
                'seam':'normalized search service results; real FastAPI route and browser; no live Photon claim',
                'queries':list(self.rows),'calls':self.calls}


def main():
    require_qualification(os.environ)
    from fastapi import FastAPI
    import uvicorn
    from backend.app.main import app as hub
    from backend.app.routes import earth
    recording=RecordedSearch()
    # Process-local test substitution; no production route or settings are edited.
    earth.search_places=recording.read
    qualification=FastAPI(docs_url=None,redoc_url=None,openapi_url=None)
    qualification.add_api_route('/__qualification__/search-recording',recording.identity,methods=['GET'])
    qualification.mount('/',hub)
    uvicorn.run(qualification,host='0.0.0.0',port=8000)


if __name__=='__main__':main()

"""Explicit, bounded SPK acquisition; never called by the application.

Copy original type-2 Chebyshev records using strict HTTP ranges, retaining
upstream comments and per-range hashes. This is an excerpt, not an orbit fit.
The output directory must be new/empty. No active release is changed.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen

from jplephem.daf import DAF
from jplephem.excerpter import write_excerpt
from jplephem.spk import SPK

FIRST, LAST = 2460676.5, 2462502.5  # 2025-01-01 through 2030-01-01, TDB
NAIF = 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/'
SOURCES = {
    'mars': ('mar099s.bsp', [4,10,401,402,499]),
    'jupiter': ('jup365.bsp', [5,10,501,502,503,504,599]),
    'saturn': ('sat441.bsp', [6,10,602,606,699]),
    'uranus': ('https://ssd.jpl.nasa.gov/ftp/eph/satellites/bsp/ura182.bsp', [701,702,703,704,705,799]),
    'neptune': ('nep098_part-1.bsp', [8,10,801,899]),
    'uranus_solar': (NAIF + 'spk/satellites/ura184_part-1.bsp', [7]),
    'reference_sun': (NAIF + 'spk/planets/de441_part-2.bsp', [10]),
}
PCK_URL = NAIF + 'pck/pck00011.tpc'
PCK_SHA256 = '3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1'


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def encode(obj):
    return (json.dumps(obj,sort_keys=True,separators=(',',':'),allow_nan=False)+'\n').encode()


class ByteBudget:
    def __init__(self, limit):
        self.limit, self.consumed = limit, 0

    def reserve(self, count):
        if count < 0 or self.consumed + count > self.limit:
            raise ValueError('Source acquisition byte budget exhausted')
        self.consumed += count


class RangeSource:
    def __init__(self, url, budget, block_size=0):
        self.url, self.budget, self.block_size = url, budget, block_size
        self.offset, self.version, self.total = 0, None, None
        self.ranges, self.cache = [], []

    def seek(self, offset, whence=0):
        if whence != 0 or offset < 0:
            raise ValueError('Only absolute nonnegative source seeks are supported')
        self.offset = offset

    def read(self, size):
        if not 0 < size <= 4*1024*1024:
            raise ValueError('Source range must be between 1 byte and 4 MiB')
        start, end = self.offset, self.offset + size - 1
        for cache_start, raw in self.cache:
            if cache_start <= start and end < cache_start + len(raw):
                self.offset += size
                return raw[start-cache_start:end-cache_start+1]
        request_end = max(end,start+self.block_size-1)
        if self.total is not None:
            request_end = min(request_end,self.total-1)
        count = request_end-start+1
        self.budget.reserve(count)
        headers = {'Range':f'bytes={start}-{request_end}'}
        if self.version and self.version[1]:
            headers['If-Unmodified-Since'] = self.version[1]
        with urlopen(Request(self.url,headers=headers),timeout=60) as response:
            if response.status != 206:
                raise ValueError('Server must return HTTP 206; refusing whole-file response')
            match = re.fullmatch(r'bytes (\d+)-(\d+)/(\d+)',response.headers.get('Content-Range',''))
            if not match or tuple(map(int,match.groups()[:2])) != (start,request_end):
                raise ValueError('Unexpected Content-Range')
            total = int(match[3])
            version = (response.headers.get('ETag'),response.headers.get('Last-Modified'),total)
            if self.version is not None and version != self.version:
                raise ValueError('Remote source version changed during acquisition')
            if not version[0] and not version[1]:
                raise ValueError('Source must publish a version validator')
            raw=response.read(count+1)
            if len(raw) != count:
                raise ValueError('Partial or oversized range response')
            self.version,self.total=version,total
        self.ranges.append(dict(start=start,end=request_end,bytes=count,sha256=digest(raw),
                                etag=version[0],last_modified=version[1],full_source_bytes=total))
        if size < self.block_size:
            self.cache.append((start,raw))
        self.offset += size
        return raw[:size]

    def close(self):
        pass


def acquire(output, max_bytes=64*1024*1024, reuse=None):
    output=Path(output)
    output.mkdir(parents=True,exist_ok=True)
    if any(output.iterdir()):
        raise ValueError('Output directory must be new or empty; active releases are immutable')
    budget=ByteBudget(max_bytes)
    previous=json.loads((Path(reuse)/'manifest.json').read_text()) if reuse else None
    manifest=dict(schema='oras.planetary-system-spk-release.v1',release='jpl-systems-2025-2030-v3',
        first_jd_tdb=FIRST,last_jd_tdb=LAST,frame='ICRF',corrections='NONE',time_scale='TDB',
        acquired_utc=datetime.now(timezone.utc).isoformat(),budget_bytes=max_bytes,sources={})
    for identity,(name,targets) in SOURCES.items():
        url=name if name.startswith('https://') else NAIF+'spk/satellites/'+name
        prior=previous['sources'].get(identity) if previous else None
        if prior and prior['url']==url and prior['targets']==targets:
            raw=(Path(reuse)/prior['file']).read_bytes()
            if digest(raw)!=prior['sha256'] or len(raw)!=prior['bytes']:
                raise ValueError('Changed reuse source')
            (output/prior['file']).write_bytes(raw)
            manifest['sources'][identity]=dict(prior,acquired_utc=previous['acquired_utc'])
            print(identity,'reused verified excerpt',len(raw),flush=True)
            continue
        remote=RangeSource(url,budget,65536)
        source=SPK(DAF(remote))
        summaries=[(name,values) for name,values in source.daf.summaries()
                   if values[2] in targets and values[0]/86400+2451545<=FIRST and values[1]/86400+2451545>=LAST]
        if {v[2] for _,v in summaries} != set(targets) or any(v[4]!=1 or v[5]!=2 for _,v in summaries):
            raise ValueError('Required target set, J2000 frame, type-2 records or full coverage missing')
        filename=identity+'-2025-2030.bsp'
        with (output/filename).open('w+b') as destination:
            write_excerpt(source,destination,FIRST,LAST,summaries)
        raw=(output/filename).read_bytes()
        manifest['sources'][identity]=dict(file=filename,url=url,sha256=digest(raw),bytes=len(raw),
            targets=targets,ranges=remote.ranges,source_full_sha256=None,
            transformation='Original type-2 polynomial records copied; only DAF layout, comments and declared coverage narrowed. Full upstream file not downloaded or hashed.')
        manifest['acquired_bytes']=budget.consumed
        (output/'acquisition.partial.json').write_bytes(encode(manifest))
        print(identity,len(raw),budget.consumed,flush=True)
    remote=RangeSource(PCK_URL,budget)
    raw=remote.read(131226)
    if digest(raw)!=PCK_SHA256:
        raise ValueError('Unqualified PCK source version')
    (output/'pck00011.tpc').write_bytes(raw)
    manifest['orientation']=dict(file='pck00011.tpc',url=PCK_URL,sha256=PCK_SHA256,bytes=len(raw),ranges=remote.ranges)
    manifest['acquired_bytes_this_run']=budget.consumed
    manifest['acquired_bytes']=sum(row['bytes'] for source in manifest['sources'].values() for row in source['ranges'])+sum(row['bytes'] for row in remote.ranges)
    (output/'manifest.json').write_bytes(encode(manifest))
    (output/'acquisition.partial.json').unlink(missing_ok=True)
    print('manifest_sha256',digest(encode(manifest)),'acquired_bytes',budget.consumed,flush=True)
    return manifest


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--max-bytes',type=int,default=64*1024*1024)
    parser.add_argument('--reuse',type=Path,help='Reuse matching digest-verified excerpt files from a previous immutable release')
    args=parser.parse_args()
    acquire(args.output,args.max_bytes,args.reuse)

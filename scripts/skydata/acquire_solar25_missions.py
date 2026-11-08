"""Bounded, offline-only acquisition of immutable mission trajectory releases.

Horizons spacecraft requests select mission-compatible center ephemerides. A
compatible target state is constructed from craft@Sun minus craft@target, never
from a contemporary small-body solution. Voyager encounter reconstructions use
the original NAIF spacecraft and matching target kernels through CSPICE.
No application path calls this script or an upstream provider.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import numpy as np
from skyfield.api import load

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'data/source-cache/solar25-missions'
HORIZONS = 'https://ssd.jpl.nasa.gov/api/horizons.api'
NAIF = 'https://naif.jpl.nasa.gov/pub/naif/VOYAGER/kernels/spk/'
NH_ARCHIVE='https://naif.jpl.nasa.gov/pub/naif/pds/data/nh-j_p_ss-spice-6-v1.0/nhsp_1000/data/spk/'
EXCERPTS={
    'jup230-1979.bsp':('https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/satellites/a_old_versions/jup230.bsp',2443905.5,2444086.5,{5,10,599,501,502,503,504}),
    'nh-jup260-2007.bsp':(NH_ARCHIVE+'jup260.bsp',2454140.5,2454180.5,{599}),
    'nh-de413-2007.bsp':(NH_ARCHIVE+'de413.bsp',2454140.5,2454180.5,{5,10}),
}
MAX_BYTES = 128 * 1024 * 1024
MAX_RESPONSE = 16 * 1024 * 1024
TS = load.timescale(builtin=True)

MISSIONS = {
    'voyager1': ('Voyager 1', '-31', 'Jupiter, Saturn and interstellar space'),
    'voyager2': ('Voyager 2', '-32', 'Jupiter, Saturn, Uranus, Neptune and interstellar space'),
    'cassini': ('Cassini–Huygens', '-82', 'Cassini orbiter at Saturn; Huygens trajectory is not supplied'),
    'newhorizons': ('New Horizons', '-98', 'Jupiter, Pluto–Charon and Arrokoth'),
    'pioneer10': ('Pioneer 10', '-23', 'Jupiter and the outward journey'),
    'pioneer11': ('Pioneer 11', '-24', 'Jupiter, Saturn and the outward journey'),
    'juno': ('Juno', '-61', 'Jupiter orbiter'),
    'dawn': ('Dawn', '-203', 'Vesta and Ceres'),
    'near': ('NEAR Shoemaker', '-93', 'Mathilde and Eros'),
    'rosetta': ('Rosetta', '-226', 'Comet 67P/Churyumov–Gerasimenko'),
}
# Mean radii are display dimensions, independent of spacecraft trajectory. The
# planetary values reuse the repository's qualified IAU/PCK body definitions.
TARGETS = {
    'earth': ('Earth', '399', 6371.0084), 'jupiter': ('Jupiter', '599', 69911.),
    'saturn': ('Saturn', '699', 58232.), 'uranus': ('Uranus', '799', 25362.),
    'neptune': ('Neptune', '899', 24622.), 'pluto': ('Pluto', '999', 1188.3),
    'charon': ('Charon', '901', 606.), 'titan': ('Titan', '606', 2574.73),
    'enceladus': ('Enceladus', '602', 252.1),
    # Horizons mission center radii are11x10x3.5km; use the largest reference
    # semiaxis for camera exclusion, not an invented mean radius/resolved shape.
    'arrokoth': ('Arrokoth', '2486958', 11.),
    'vesta': ('Vesta', '2000004', 262.7), 'ceres': ('Ceres', '2000001', 469.7),
    'eros': ('Eros', '2000433', 8.4), '67p': ('67P/Churyumov–Gerasimenko', '1000012', 2.),
}


def encode(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False) + '\n').encode()


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def jd(utc):
    stamp = datetime.fromisoformat(utc.replace('Z', '+00:00'))
    if stamp.tzinfo is None:
        raise ValueError('UTC timestamp requires an explicit offset')
    return float(TS.from_datetime(stamp).tdb)


def utc(value):
    return TS.tdb_jd(float(value)).utc_iso(places=6)


def hermite(a, b, u):
    """Position and time derivative of cubic Hermite in km and km/s."""
    dt = (b[0] - a[0]) * 86400
    p0, p1, v0, v1 = a[1:4], b[1:4], a[4:7], b[4:7]
    p = (2*u**3-3*u*u+1)*p0 + (u**3-2*u*u+u)*dt*v0 + (-2*u**3+3*u*u)*p1 + (u**3-u*u)*dt*v1
    v = (6*u*u-6*u)*p0/dt + (3*u*u-4*u+1)*v0 + (-6*u*u+6*u)*p1/dt + (3*u*u-2*u)*v1
    return np.concatenate((p, v))


def parse_vectors(raw, target_id, center_id, requested):
    doc = json.loads(raw)
    if 'error' in doc:
        raise ValueError('Horizons rejected the source request: ' + str(doc['error'])[:200])
    text = doc.get('result', '')
    def header(label):
        match = re.search(r'^' + re.escape(label) + r'\s*:\s*(.*)$', text, re.M)
        if not match:
            raise ValueError('Missing source header: ' + label)
        return match[1].strip()
    target, center = header('Target body name'), header('Center body name')
    if not re.search(r'\(' + re.escape(str(target_id)) + r'\)', target) or not re.search(r'\(' + re.escape(str(center_id)) + r'\)', center):
        raise ValueError('Source identity or center mismatch')
    if (header('Reference frame'), header('Output units'), header('Output type')) != ('ICRF', 'KM-S', 'GEOMETRIC cartesian states') or not re.search(r'^\s*JDTDB,', text, re.M):
        raise ValueError('Unqualified source frame, units, correction or timescale')
    if '$$SOE' not in text or '$$EOE' not in text:
        raise ValueError('Missing source vectors')
    rows = []
    for line in text.split('$$SOE', 1)[1].split('$$EOE', 1)[0].strip().splitlines():
        fields = [x.strip() for x in line.split(',')]
        rows.append([float(fields[0]), *[float(x) for x in fields[2:8]]])
    values = np.asarray(rows, dtype=float)
    if values.shape != (len(requested), 7) or not np.isfinite(values).all() or not np.allclose(values[:, 0], requested, rtol=0, atol=1e-9):
        raise ValueError('Incomplete or invalid source epochs')
    return values, {'target': target, 'center': center}


class Acquisition:
    def __init__(self, cache=CACHE, limit=MAX_BYTES):
        if not 0 < limit <= MAX_BYTES:
            raise ValueError('Acquisition budget exceeds approved ceiling')
        self.cache, self.limit = Path(cache), limit
        self.cache.mkdir(parents=True, exist_ok=True)
        self.ledger = self.cache/'source-ledger.json'
        self.sources = json.loads(self.ledger.read_bytes()) if self.ledger.exists() else {}
        self.range_ledger=self.cache/'range-budget.json'
        retained_ranges=sum(row['bytes'] for receipt in self.cache.glob('*.receipt.json') for row in json.loads(receipt.read_bytes()).get('ranges',[]))
        self.range_bytes=max(retained_ranges,json.loads(self.range_ledger.read_bytes())['consumed'] if self.range_ledger.exists() else 0)
        self.bytes = sum(row['bytes'] for row in self.sources.values())+self.range_bytes
        if self.bytes > self.limit:
            raise ValueError('Retained source ledger already exceeds acquisition budget')
        self.range_ledger.write_bytes(encode({'consumed':self.range_bytes}))

    def reserve_range(self,count):
        if count<0 or self.bytes+count>self.limit:
            raise ValueError('Source aggregate acquisition budget exhausted before range transfer')
        self.bytes+=count;self.range_bytes+=count
        self.range_ledger.write_bytes(encode({'consumed':self.range_bytes}))

    def fetch(self, url, name=None, limit=MAX_RESPONSE, request_body=None):
        name = name or digest(url.encode()+(request_body or b'')) + '.json'
        if Path(name).name != name or not 0 < limit <= MAX_RESPONSE:
            raise ValueError('Invalid acquisition bound or filename')
        path = self.cache / name
        if path.exists():
            raw = path.read_bytes()
            if len(raw) > limit:
                raise ValueError('Cached source exceeds response ceiling')
        else:
            lock_path = ROOT / 'output/playwright/solar-system-2.4/jpl-api.lock'
            lock_path.parent.mkdir(parents=True, exist_ok=True)
            with lock_path.open('a') as lock:
                fcntl.flock(lock, fcntl.LOCK_EX)
                for attempt in range(3):
                    try:
                        request=Request(url,data=request_body,headers={'Content-Type':'multipart/form-data; boundary=ORASMissionSourceBoundary'} if request_body else {})
                        with urlopen(request, timeout=90) as response:
                            length = response.headers.get('Content-Length')
                            if length is not None and int(length) > min(limit, self.limit-self.bytes):
                                raise ValueError('Response exceeds acquisition budget')
                            raw = response.read(min(limit, self.limit-self.bytes) + 1)
                        break
                    except (HTTPError, URLError) as exc:
                        if attempt == 2 or isinstance(exc,HTTPError) and exc.code not in (429,500,502,503,504):
                            raise
                        time.sleep(2*(attempt+1))
                if len(raw) > min(limit, self.limit-self.bytes):
                    raise ValueError('Response exceeds acquisition budget')
                path.write_bytes(raw)
        if name not in self.sources:
            if self.bytes + len(raw) > self.limit:
                raise ValueError('Source aggregate budget exhausted')
            self.bytes += len(raw)
            self.sources[name] = dict(file=name, url=url, bytes=len(raw), sha256=digest(raw),
                publisher='NASA/JPL', terms='https://ssd.jpl.nasa.gov/disclaimer.html')
            if request_body:
                request_file=name+'.request.txt'
                (self.cache/request_file).write_bytes(request_body)
                self.sources[name].update(request_file=request_file,request_sha256=digest(request_body))
            self.ledger.write_bytes(encode(self.sources))
        elif self.sources[name]['url'] != url or self.sources[name]['sha256'] != digest(raw):
            raise ValueError('Source cache identity changed')
        return raw


class HorizonsProvider:
    def __init__(self, acquisition, craft, targets):
        self.acquisition, self.craft, self.targets = acquisition, craft, targets
        self.cache, self.headers = {}, {}

    def evaluate(self, epochs):
        missing = sorted(set(float(t) for t in epochs) - self.cache.keys())
        # Keep GET URLs bounded below typical proxy request-line limits.
        for offset in range(0, len(missing), 500):
            times = missing[offset:offset+500]
            states = {}
            for key, center in [('craft', '10')] + [(name, TARGETS[name][1]) for name in self.targets]:
                args = dict(format='json', COMMAND=self.craft, OBJ_DATA='NO', MAKE_EPHEM='YES', EPHEM_TYPE='VECTORS',
                    CENTER='500@'+center, TLIST="'"+' '.join(format(t, '.12f') for t in times)+"'", TIME_TYPE='TDB', OUT_UNITS='KM-S',
                    REF_PLANE='FRAME', REF_SYSTEM='ICRF', VEC_TABLE='2', VEC_CORR='NONE', CSV_FORMAT='YES')
                # Horizons silently truncates a long single TLIST input line.
                # Its documented batch list syntax admits one quoted epoch per
                # continuation line; still verify every returned epoch/count.
                settings='!$$SOF\n'+'\n'.join(key+"='"+str(value).strip("'")+"'" for key,value in args.items() if key not in ('format','TLIST'))+'\nTLIST=\n'+'\n'.join("'"+format(t,'.12f')+"'" for t in times)+'\n'
                boundary='ORASMissionSourceBoundary'
                body=('--'+boundary+'\r\nContent-Disposition: form-data; name="format"\r\n\r\njson\r\n--'+boundary+'\r\nContent-Disposition: form-data; name="input"; filename="mission.txt"\r\nContent-Type: text/plain\r\n\r\n'+settings+'\r\n--'+boundary+'--\r\n').encode()
                raw = self.acquisition.fetch('https://ssd.jpl.nasa.gov/api/horizons_file.api',request_body=body)
                values, headers = parse_vectors(raw, self.craft, center, times)
                if key in self.headers and self.headers[key] != headers:
                    raise ValueError('Provider changed source solution during acquisition')
                self.headers[key] = headers
                states[key] = values[:, 1:]
            # Both requests carry the spacecraft-specific merged ephemeris.
            source = re.search(r'\{source:\s*([^}]+)\}', self.headers['craft']['center'])
            if not source:
                raise ValueError('Missing native source chain')
            for name in self.targets:
                native = re.search(r'\{source:\s*([^}]+)\}', self.headers[name]['center'])
                if not native or native[1] != source[1]:
                    raise ValueError('Target is not part of the native spacecraft center chain')
                states[name] = states['craft'] - states[name]
            for i, t in enumerate(times):
                self.cache[t] = {name: state[i] for name, state in states.items()}
        return [self.cache[float(t)] for t in epochs]


class SpiceProvider:
    def __init__(self, acquisition, craft, targets, files):
        import spiceypy as spice
        self.spice, self.craft, self.targets = spice, craft, targets
        spice.kclear()
        for name in files:
            if name in EXCERPTS:
                # This original-coefficient excerpt is acquired by source_excerpt.
                path = acquisition.cache / name
                if not path.is_file():
                    source_excerpt(acquisition,name)
            else:
                acquisition.fetch((NH_ARCHIVE if name.startswith('nh_') else NAIF)+name, name)
                path = acquisition.cache / name
            spice.furnsh(str(path))
        self.headers = {'kernels': files, 'frame': 'J2000/ICRF', 'corrections': 'NONE', 'time_scale': 'TDB'}

    def evaluate(self, epochs):
        result = []
        for t in epochs:
            et = (float(t)-2451545.)*86400
            result.append({name: np.asarray(self.spice.spkezr(str(identity), et, 'J2000', 'NONE', '10')[0])
                for name, identity in [('craft', self.craft)] + [(name, TARGETS[name][1]) for name in self.targets]})
        return result


def source_excerpt(acquisition,name='jup230-1979.bsp'):
    """Copy only selected original coefficient records, with strict range receipts."""
    from jplephem.daf import DAF
    from jplephem.excerpter import write_excerpt
    from jplephem.spk import SPK
    spec = importlib.util.spec_from_file_location('system_spk_builder', Path(__file__).with_name('acquire_system_spk.py'))
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    class SharedBudget(module.ByteBudget):
        def reserve(self,count):
            if count<0 or self.consumed+count>self.limit:
                raise ValueError('Excerpt acquisition budget exhausted before range transfer')
            acquisition.reserve_range(count)
            self.consumed+=count
    budget = SharedBudget(min(8*1024*1024, acquisition.limit-acquisition.bytes))
    url,first,last,targets=EXCERPTS[name]
    remote = module.RangeSource(url, budget, 16384)
    source = SPK(DAF(remote))
    summaries = [(name,v) for name,v in source.daf.summaries() if v[2] in targets and v[0]/86400+2451545<=first and v[1]/86400+2451545>=last]
    if {v[2] for _,v in summaries} != targets or any(v[4]!=1 or v[5] not in (2,3) for _,v in summaries):
        raise ValueError('Incompatible Jupiter source chain')
    path = acquisition.cache / name
    with path.open('w+b') as stream:
        write_excerpt(source, stream, first, last, summaries)
        # DAF readers require complete 1024-byte physical records. jplephem's
        # excerpt writer can leave the last record short; CSPICE then sees zeros
        # in the final segment metadata even though jplephem can read it.
        stream.seek(0,2)
        stream.write(b'\0'*(-stream.tell()%1024))
    path.with_suffix('.receipt.json').write_bytes(encode(dict(url=url, bytes=path.stat().st_size, sha256=digest(path.read_bytes()), ranges=remote.ranges)))


def adaptive(provider, first, last, max_step, position_tolerance, velocity_tolerance, min_step=30/86400):
    """Quarter/midpoint source checks, then retain only independently checked knots.

    Tolerances are sampled numerical residuals, not a physical orbit covariance.
    Every source subdivision is checked; a discontinuity that cannot meet the
    bound becomes an explicit gap instead of an invented smooth maneuver.
    """
    boundaries = np.linspace(first, last, max(1, math.ceil((last-first)/max_step))+1)
    pending = list(zip(boundaries[:-1], boundaries[1:]))
    accepted, rejected = [], []
    while pending:
        epochs = sorted(set(t for a,b in pending for t in (a, a+(b-a)*.25, (a+b)/2, a+(b-a)*.75, b)))
        states = dict(zip(epochs, provider.evaluate(epochs)))
        following = []
        for a, b in pending:
            ep, ev = 0., 0.
            for name in states[a]:
                start = np.array([a, *states[a][name]])
                end = np.array([b, *states[b][name]])
                for u in (.25,.5,.75):
                    t = (a+b)/2 if u == .5 else a+(b-a)*u
                    residual = hermite(start,end,(t-a)/(b-a))-states[t][name]
                    ep, ev = max(ep,float(np.linalg.norm(residual[:3]))), max(ev,float(np.linalg.norm(residual[3:])))
            if ep <= position_tolerance and ev <= velocity_tolerance:
                accepted.append((a,b,states[a],states[b],ep,ev))
            elif b-a <= min_step:
                rejected.append(dict(start=utc(a),end=utc(b),reason='Source discontinuity exceeds sampled interpolation limits'))
            else:
                middle = (a+b)/2
                following.extend(((a,middle),(middle,b)))
        pending = following
    accepted.sort(key=lambda row:row[0])
    groups = []
    for row in accepted:
        if not groups or groups[-1][-1][1] != row[0]:
            groups.append([])
        groups[-1].append(row)
    payloads = []
    for rows in groups:
        names = rows[0][2]
        payloads.append(dict(states={name:[[r[0],*r[2][name]] for r in rows]+[[rows[-1][1],*rows[-1][3][name]]] for name in names},
            position_errors_km=[r[4] for r in rows], velocity_errors_km_s=[r[5] for r in rows]))
    return payloads, rejected


def segment(identity, label, start, end, quality, targets=(), *, kernels=None, step=7., tolerance=10., velocity=.001):
    return dict(id=identity,label=label,start=start,end=end,quality=quality,targets=list(targets),kernels=kernels,
        step=step,tolerance=tolerance,velocity=velocity)


def mission_specs():
    v1 = [('jupiter',2443905.5,2443951.5,['vgr1_jup230.bsp','jup230-1979.bsp']),
          ('saturn',2444458.5,2444563.5,['vgr1_sat337.bsp','sat337.bsp'])]
    v2 = [('jupiter',2444029.2083333335,2444075.5,['vgr2_jup230.bsp','jup230-1979.bsp']),
          ('saturn',2444763.5,2444869.5,['vgr2_sat337.bsp','sat337.bsp']),
          ('uranus',2446299.5,2446475.5,['vgr2.ura182.bsp']),
          ('neptune',2447478.5,2447801.,['vgr2_nep097.bsp'])]
    specs={}
    for identity,start,cut,encounters in [('voyager1','1977-09-05T15:00:00Z','1981-01-01T00:00:00Z',v1),('voyager2','1977-08-20T16:00:00Z','1989-08-29T08:00:00Z',v2)]:
        # Separate mission-design cruise and reconstructed encounters. The small
        # source changes at boundaries are not joined into one smooth trajectory.
        intervals=[(jd(start),jd(cut),'mission-design','Early mission-design cruise'),
                   (jd(cut),jd('1993-01-01T00:00:00Z'),'mixed','Tracking-fit interval; last two-way tracking during 1992'),
                   (jd('1993-01-01T00:00:00Z'),jd('2030-01-01T00:00:00Z'),'predicted','Outward prediction from tracking through 1992')]
        rows=[]
        for first,last,quality,label in intervals:
            cursor=first
            for target,a,b,kernels in encounters:
                if b<=cursor or a>=last: continue
                if a>cursor: rows.append(segment('cruise-'+str(len(rows)),label,utc(cursor),utc(min(a,last)),quality))
                cursor=max(cursor,b)
            if cursor<last: rows.append(segment('cruise-'+str(len(rows)),label,utc(cursor),utc(last),quality))
        for target,a,b,kernels in encounters:
            rows.append(segment(target+'-encounter',target.title()+' reconstructed encounter',utc(a+1e-7),utc(b-1e-7),'reconstructed',[target],kernels=kernels,step=.5,tolerance=.05,velocity=.00005))
        specs[identity]=rows
    specs['cassini']=[
        segment('cruise','Historical cruise (mixed mission source solutions)','1997-10-15T10:00:00Z','2004-06-25T00:00:00Z','mixed'),
        segment('arrival','Saturn arrival and first orbital arc','2004-06-25T00:00:00Z','2004-07-08T00:00:00Z','mixed',['saturn'],step=.25,tolerance=.05,velocity=.00005),
        segment('titan','Titan Ta encounter','2004-10-24T00:00:00Z','2004-10-29T00:00:00Z','reconstructed',['saturn','titan'],step=.125,tolerance=.05,velocity=.00005),
        segment('enceladus','Enceladus E2 encounter','2005-07-12T00:00:00Z','2005-07-16T00:00:00Z','reconstructed',['saturn','enceladus'],step=.125,tolerance=.05,velocity=.00005),
        segment('enceladus-e21','Enceladus E21 plume encounter','2015-10-26T00:00:00Z','2015-10-30T00:00:00Z','reconstructed',['saturn','enceladus'],step=.125,tolerance=.05,velocity=.00005),
        segment('grand-finale','First Grand Finale orbit','2017-04-23T00:00:00Z','2017-04-30T00:00:00Z','reconstructed',['saturn','titan'],step=.125,tolerance=.05,velocity=.00005),
        segment('end','Final Saturn approach; trajectory ends before atmospheric destruction','2017-09-10T00:00:00Z','2017-09-15T10:30:00Z','reconstructed',['saturn'],step=.125,tolerance=.05,velocity=.00005),
    ]
    specs['newhorizons']=[
        segment('launch-cruise','Launch and Jupiter transfer (historical mission prediction)','2006-01-19T20:00:00Z','2007-02-23T00:00:00Z','predicted'),
        segment('jupiter','Jupiter gravity assist: PDS reconstructed NH/JUP260/DE413','2007-02-23T00:00:00Z','2007-03-05T00:00:00Z','reconstructed',['jupiter'],kernels=['nh_recon_e2j_v1.bsp','nh-jup260-2007.bsp','nh-de413-2007.bsp'],step=.25,tolerance=.05,velocity=.00005),
        segment('pluto-cruise','Cruise to Pluto (historical mission predictions)','2007-03-05T00:00:00Z','2014-12-09T00:00:00Z','predicted'),
        segment('pluto','Pluto–Charon post-encounter reconstruction, PLU060','2014-12-09T00:00:00Z','2015-09-27T00:00:00Z','reconstructed',['pluto','charon'],step=.25,tolerance=.05,velocity=.00005),
        segment('kuiper-cruise','Reconstructed outbound cruise','2015-09-28T00:00:00Z','2018-12-26T00:00:00Z','reconstructed'),
        segment('arrokoth','Arrokoth OD159 target / reconstructed mission trajectory','2018-12-26T00:00:00Z','2019-01-07T00:00:00Z','reconstructed',['arrokoth'],step=.25,tolerance=.05,velocity=.00005),
        segment('outbound','Extended Kuiper Belt prediction (OD151/165/166)','2019-02-08T00:00:00Z','2030-01-01T00:00:00Z','predicted'),
    ]
    specs['pioneer10']=[segment('historical-cruise','General historical trajectory only; PN10/DE118 dynamical mismatch limits precision','1972-03-04T00:00:00Z','1980-01-01T00:00:00Z','mixed')]
    specs['pioneer11']=[segment('historical-cruise','General historical trajectory only; PN11/DE118 dynamical mismatch limits precision','1973-04-07T00:00:00Z','1980-01-01T00:00:00Z','mixed')]
    specs['juno']=[segment('jupiter-arrival','Reconstructed Jupiter arrival','2016-07-02T00:00:00Z','2016-07-08T00:00:00Z','reconstructed',['jupiter'],step=.125,tolerance=.05,velocity=.00005)]
    specs['dawn']=[
        segment('vesta','Vesta arrival interval, mission-specific archived Vesta solution','2011-07-14T00:00:00Z','2011-07-20T00:00:00Z','reconstructed',['vesta'],step=.125,tolerance=.02,velocity=.00002),
        segment('ceres','Ceres arrival interval, mission-specific archived Ceres solution','2015-03-05T00:00:00Z','2015-03-10T00:00:00Z','reconstructed',['ceres'],step=.125,tolerance=.02,velocity=.00002)]
    specs['near']=[segment('eros','Eros insertion interval, archived eros80/DE403 mission geometry','2000-02-12T00:00:00Z','2000-02-18T00:00:00Z','reconstructed',['eros'],step=.0625,tolerance=.005,velocity=.000005)]
    specs['rosetta']=[segment('67p','Comet arrival interval, ESA RORB/CORB mission geometry','2014-08-04T00:00:00Z','2014-08-10T00:00:00Z','mixed',['67p'],step=.0625,tolerance=.005,velocity=.000005)]
    return specs


def acquire(output, identities=None, max_bytes=MAX_BYTES):
    output=Path(output)
    output.mkdir(parents=True,exist_ok=True)
    if (output/'manifest.json').exists():
        raise ValueError('Completed releases are immutable; choose a new output directory')
    acquisition=Acquisition(limit=max_bytes)
    specs=mission_specs()
    manifest=dict(schema='oras.mission-release.v1',release_id='solar-missions-'+output.name.removeprefix('release-'),frame='ICRF',origin='sun',
        units='km,km/s',time_scale='TDB',corrections='NONE',created_utc=datetime.now(timezone.utc).isoformat(),missions={},sources={})
    for identity in identities or specs:
        name,craft,summary=MISSIONS[identity]
        metadata_url=HORIZONS+'?'+urlencode(dict(format='json',COMMAND="'"+craft+"'",MAKE_EPHEM="'NO'",OBJ_DATA="'YES'"))
        acquisition.fetch(metadata_url,identity+'-metadata.json',1024*1024)
        segments=[];gaps=[]
        for spec in specs[identity]:
            cache_path=acquisition.cache/(identity+'-'+spec['id']+'-adaptive.json')
            if cache_path.exists():
                previous=json.loads(cache_path.read_bytes())
                if previous['spec']!=spec: raise ValueError('Changed cached specification')
                payloads,rejected,headers=previous['payloads'],previous['gaps'],previous['headers']
            else:
                provider=SpiceProvider(acquisition,craft,spec['targets'],spec['kernels']) if spec['kernels'] else HorizonsProvider(acquisition,craft,spec['targets'])
                payloads,rejected=adaptive(provider,jd(spec['start']),jd(spec['end']),spec['step'],spec['tolerance'],spec['velocity'])
                headers=provider.headers
                cache_path.write_bytes(encode(dict(spec=spec,payloads=payloads,gaps=rejected,headers=headers)))
            for index,payload in enumerate(payloads):
                meta={k:v for k,v in spec.items() if k not in ('start','end','kernels','step','tolerance','velocity','targets')}
                meta.update(id=spec['id']+('-'+str(index) if len(payloads)>1 else ''),start=utc(payload['states']['craft'][0][0]),end=utc(payload['states']['craft'][-1][0]),
                    target_ids=spec['targets'],headers=headers,position_tolerance_km=spec['tolerance'],velocity_tolerance_km_s=spec['velocity'],
                    max_sampled_position_error_km=max(payload['position_errors_km']),max_sampled_velocity_error_km_s=max(payload['velocity_errors_km_s']))
                segments.append(dict(meta,**payload))
            gaps+=rejected
            print(identity,spec['id'],'knots',sum(len(p['states']['craft']) for p in payloads),'gaps',len(rejected),'source bytes',acquisition.bytes,flush=True)
        segments.sort(key=lambda row:row['start'])
        raw=encode(dict(segments=segments,gaps=gaps))
        filename=identity+'.json';(output/filename).write_bytes(raw)
        manifest['missions'][identity]=dict(name=name,naif_id=craft,summary=summary,file=filename,bytes=len(raw),sha256=digest(raw),
            segments=[{k:v for k,v in row.items() if k not in ('states','position_errors_km','velocity_errors_km_s')} for row in segments],gaps=gaps)
        (output/'acquisition.partial.json').write_bytes(encode(manifest))
    manifest['sources']=acquisition.sources
    manifest['excerpts']={name:json.loads((acquisition.cache/name).with_suffix('.receipt.json').read_bytes()) for name in EXCERPTS if (acquisition.cache/name).with_suffix('.receipt.json').exists()}
    manifest['source_bytes']=acquisition.bytes
    if manifest['source_bytes']>max_bytes: raise ValueError('Retained source acquisition exceeds aggregate budget')
    manifest['targets']={name:dict(name=row[0],naif_id=row[1],appearance_id=name,radius_km=row[2]) for name,row in TARGETS.items()}
    manifest['targets']['arrokoth']['representation']='symbolic reference bound;11km Horizons maximum semiaxis, not a resolved shape'
    (output/'manifest.json').write_bytes(encode(manifest));(output/'acquisition.partial.json').unlink(missing_ok=True)
    print('manifest_sha256',digest(encode(manifest)),'source_bytes',manifest['source_bytes'],flush=True)
    return manifest


def verify(output, report_path):
    """Fresh non-knot/non-quarter references; never substitutes self interpolation.

    Each interval is compared at golden-ratio fractions to fresh Horizons states
    or direct CSPICE evaluation of original archived coefficients. The resulting
    report and raw source receipts are independent of the admitted state arrays.
    """
    from backend.app.services import mission_exploration as runtime_service
    import spiceypy as spice
    acquisition=Acquisition();specs=mission_specs();results=[];failures=[]
    directory=Path(output)
    for identity in specs:
        runtime=runtime_service.load_runtime(identity,directory)
        for spec in specs[identity]:
            provider=SpiceProvider(acquisition,MISSIONS[identity][1],spec['targets'],spec['kernels']) if spec['kernels'] else HorizonsProvider(acquisition,MISSIONS[identity][1],spec['targets'])
            for seg in runtime.segments:
                owner=max((s for s in specs[identity] if seg['id']==s['id'] or seg['id'].startswith(s['id']+'-')),key=lambda s:len(s['id']))
                if owner['id']!=spec['id']:continue
                knots=seg['states']['craft']
                indices=sorted(set(int(i) for i in np.linspace(0,len(knots)-2,min(9,len(knots)-1))))
                times=[float(knots[i,0]+(knots[i+1,0]-knots[i,0])*u) for i in indices for u in (.3819660112501051,.6180339887498949)]
                truth=provider.evaluate(times);ep,ev=0.,0.;bad=set()
                for ti,(t,reference) in enumerate(zip(times,truth)):
                    for name,state in reference.items():
                        sampled=runtime_service.evaluate(seg['states'][name],t)
                        dp=np.asarray(sampled['position'])*runtime_service.AU_KM-state[:3]
                        dv=np.asarray(sampled['velocity'])*runtime_service.AU_KM-state[3:]
                        ep=max(ep,float(np.linalg.norm(dp)));ev=max(ev,float(np.linalg.norm(dv)))
                        if np.linalg.norm(dp)>spec['tolerance']+1e-5 or np.linalg.norm(dv)>spec['velocity']+1e-9:bad.add(indices[ti//2])
                if ep>spec['tolerance']+1e-5 or ev>spec['velocity']+1e-9:
                    failures.append(dict(mission=identity,segment=seg['id'],cells=sorted(bad),max_position_residual_km=ep,max_velocity_residual_km_s=ev))
                results.append(dict(mission=identity,segment=seg['id'],epochs_tdb=times,positions_checked=len(times)*len(truth[0]),max_position_residual_km=ep,max_velocity_residual_km_s=ev,
                    position_guard_km=spec['tolerance']+1e-5,velocity_guard_km_s=spec['velocity']+1e-9,reference='Original NAIF/PDS SPKs via CSPICE' if spec['kernels'] else 'Fresh Horizons mission-native queries',headers=provider.headers))
        print('independent references',identity,flush=True)
    lsk_url='https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls'
    acquisition.fetch(lsk_url,'naif0012.tls',65536);spice.kclear();spice.furnsh(str(acquisition.cache/'naif0012.tls'))
    time_checks=[]
    for stamp in ['1979-03-05T12:05:26Z','1989-08-25T03:56:36Z','2004-07-01T12:00:00Z','2015-07-14T11:49:57Z','2016-12-31T23:59:59Z','2017-01-01T00:00:00Z','2026-11-07T00:00:00Z']:
        independent=float(spice.str2et(stamp.removesuffix('Z')))
        derived=(jd(stamp)-2451545.)*86400
        error=abs(derived-independent)
        if error>.003:raise ValueError('UTC/TDB comparison exceeds3milliseconds')
        time_checks.append(dict(utc=stamp,cspice_et=independent,skyfield_et=derived,error_seconds=error))
    report=dict(schema='oras.mission-independent-references.v1',manifest_sha256=digest((directory/'manifest.json').read_bytes()),
        method='Golden-ratio fractions are neither retained knots nor the quarter/midpoint acquisition checks. Position and velocity independently queried from the named native source. Guards are sampled numerical limits, not continuous bounds or physical ephemeris uncertainty.',
        runtime_results=results,failures=failures,utc_tdb=time_checks,source_bytes_including_validation=acquisition.bytes,sources=acquisition.sources)
    Path(report_path).write_bytes(encode(report));print('reference report',report_path,'positions',sum(row['positions_checked'] for row in results),flush=True)
    return report


def repair_release(original,output,report_path):
    """Refine only independently failing source cells into a new immutable pack."""
    original,output=Path(original),Path(output)
    output.mkdir(parents=True,exist_ok=True)
    if any(output.iterdir()):raise ValueError('Repair output must be new and empty')
    old_raw=(original/'manifest.json').read_bytes();manifest=json.loads(old_raw);report=json.loads(Path(report_path).read_bytes())
    if report['manifest_sha256']!=digest(old_raw):raise ValueError('Reference report belongs to a different release')
    acquisition=Acquisition();specs=mission_specs()
    failures={(row['mission'],row['segment']):row['cells'] for row in report['failures']}
    for identity,meta in manifest['missions'].items():
        raw=(original/meta['file']).read_bytes()
        if digest(raw)!=meta['sha256']:raise ValueError('Changed original release data')
        payload=json.loads(raw);updated=[]
        for seg in payload['segments']:
            cells=failures.get((identity,seg['id']))
            if cells is None:updated.append(seg);continue
            spec=max((s for s in specs[identity] if seg['id']==s['id'] or seg['id'].startswith(s['id']+'-')),key=lambda s:len(s['id']))
            provider=SpiceProvider(acquisition,MISSIONS[identity][1],spec['targets'],spec['kernels']) if spec['kernels'] else HorizonsProvider(acquisition,MISSIONS[identity][1],spec['targets'])
            states={k:np.asarray(v) for k,v in seg['states'].items()};times=states['craft'][:,0];intervals=[]
            for i in range(len(times)-1):
                if i not in cells:
                    intervals.append((times[i],times[i+1],{n:v[i,1:] for n,v in states.items()},{n:v[i+1,1:] for n,v in states.items()},seg['position_errors_km'][i],seg['velocity_errors_km_s'][i]))
                    continue
                # Source midpoint becomes a new knot. Quarter samples of these
                # halves are fresh independent epochs relative to the old cell.
                groups,gaps=adaptive(provider,float(times[i]),float(times[i+1]),float(times[i+1]-times[i])/2,spec['tolerance'],spec['velocity'])
                payload['gaps']+=gaps
                for group in groups:
                    for j in range(len(group['states']['craft'])-1):
                        intervals.append((group['states']['craft'][j][0],group['states']['craft'][j+1][0],{n:np.asarray(v[j][1:]) for n,v in group['states'].items()},{n:np.asarray(v[j+1][1:]) for n,v in group['states'].items()},group['position_errors_km'][j],group['velocity_errors_km_s'][j]))
            runs=[]
            for row in intervals:
                if not runs or runs[-1][-1][1]!=row[0]:runs.append([])
                runs[-1].append(row)
            for index,run in enumerate(runs):
                item={k:v for k,v in seg.items() if k not in ('states','position_errors_km','velocity_errors_km_s')}
                item.update(id=seg['id'] if len(runs)==1 else seg['id']+'-repair'+str(index),start=utc(run[0][0]),end=utc(run[-1][1]),
                    states={n:[[r[0],*r[2][n]] for r in run]+[[run[-1][1],*run[-1][3][n]]] for n in states},
                    position_errors_km=[r[4] for r in run],velocity_errors_km_s=[r[5] for r in run],max_sampled_position_error_km=max(r[4] for r in run),max_sampled_velocity_error_km_s=max(r[5] for r in run))
                updated.append(item)
            print('refined',identity,seg['id'],'cells',cells,flush=True)
        payload['segments']=updated;raw=encode(payload);(output/meta['file']).write_bytes(raw)
        meta.update(bytes=len(raw),sha256=digest(raw),segments=[{k:v for k,v in s.items() if k not in ('states','position_errors_km','velocity_errors_km_s')} for s in updated],gaps=payload['gaps'])
    manifest.update(release_id='solar-missions-'+output.name.removeprefix('release-'),created_utc=datetime.now(timezone.utc).isoformat(),sources=acquisition.sources,source_bytes=acquisition.bytes,
        refinement=dict(previous_manifest_sha256=digest(old_raw),reference_report_sha256=digest(Path(report_path).read_bytes()),changed_cells=report['failures']))
    (output/'manifest.json').write_bytes(encode(manifest))
    print('refined_manifest_sha256',digest(encode(manifest)),flush=True)
    return manifest


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--missions',nargs='+',choices=MISSIONS)
    parser.add_argument('--max-bytes',type=int,default=MAX_BYTES)
    parser.add_argument('--verify-report',type=Path,help='Verify an existing pinned release against fresh independent source epochs; no release mutation')
    parser.add_argument('--repair-from',type=Path,help='Original immutable release to refine into a new --output directory')
    parser.add_argument('--repair-report',type=Path,help='Independent failed-cell reference report for --repair-from')
    args=parser.parse_args()
    if args.repair_from:
        if not args.repair_report:parser.error('--repair-from requires --repair-report')
        repair_release(args.repair_from,args.output,args.repair_report)
    elif args.verify_report:verify(args.output,args.verify_report)
    else:acquire(args.output,args.missions,args.max_bytes)

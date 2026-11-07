"""Bounded explicit SBDB acquisition and independently checked symbolic population.

The application never queries upstream. Raw responses, observed timestamps and
hashes are retained; source frame/epoch/identity are not inferred from file times.
No comet is sent through the limited elliptical population propagator.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import math
from pathlib import Path
import re
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API='https://ssd-api.jpl.nasa.gov/sbdb_query.api'
FIELDS='spkid,pdes,full_name,name,prefix,class,orbit_id,epoch,equinox,e,a,q,i,om,w,ma,n,H,diameter,condition_code,data_arc,n_obs_used,sigma_e,sigma_a'
MAX_BYTES=32*1024*1024
MAX_DAYS=180
EPSILON=math.radians(84381.448/3600)
AU_KM=149597870.7
QUERIES={
 'main-belt':dict(**{'sb-class':'IMB,MBA,OMB','sb-ns':'n'},sort='H',limit=16384),
 'trans-neptunian':dict(**{'sb-class':'TNO'},sort='H',limit=8192),
 'comets-numbered':dict(**{'sb-kind':'c','sb-ns':'n','sb-xfrag':'true'},sort='pdes',limit=1024),
 'comets-unbound':dict(**{'sb-class':'PAR,HYP','sb-kind':'c','sb-xfrag':'true'},sort='pdes',limit=256),
}
POPULATIONS={'main-belt':'asteroid-belt','trans-neptunian':'trans-neptunian','comets-numbered':'comets','comets-unbound':'comets'}


def encode(value):
    return (json.dumps(value,sort_keys=True,separators=(',',':'),allow_nan=False)+'\n').encode()


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def finite(value,optional=False):
    if value is None and optional:return None
    result=float(value)
    if not math.isfinite(result):raise ValueError('Nonfinite source number')
    return result


def normalize_body(row,population):
    if row['equinox']!='J2000':raise ValueError('Unqualified source equinox')
    source_id=str(row['spkid'])
    if not re.fullmatch(r'\d+',source_id):raise ValueError('Invalid SPK identity')
    epoch,e=finite(row['epoch']),finite(row['e'])
    if e<0:raise ValueError('Negative eccentricity')
    elements=dict(epoch_jd_tdb=epoch,a_au=finite(row['a'],True),e=e,q_au=finite(row['q'],True),
                  **{k+'_rad':None if row[k] is None else math.radians(finite(row[k])) for k in ('i','om','w','ma')},
                  n_rad_day=None if row['n'] is None else math.radians(finite(row['n'])))
    domain='hyperbolic' if e>1 else 'parabolic' if e==1 else 'near-parabolic' if e>=.98 else 'elliptical'
    can_render=(population!='comets' and all(v is not None for v in elements.values()) and 0<=e<.98
                and 0<elements['a_au']<=300 and elements['q_au']>0 and 0<=elements['i_rad']<=math.pi
                and 0<elements['n_rad_day']<2*math.pi)
    if population=='comets':reason='Catalog orbit only; use a separately qualified source trajectory for comet positions.'
    elif not can_render:reason='Orbit outside this bounded elliptical population model; no approximate position is drawn.'
    else:reason=None
    diameter=finite(row['diameter'],True)
    if diameter is not None and diameter<=0:raise ValueError('Invalid source diameter')
    return dict(catalog='JPL SBDB',source_id=source_id,designation=str(row['pdes']),name=str(row['full_name']).strip(),
        iau_name=row['name'],population=population,object_class='comet' if population=='comets' else 'trans-neptunian-object' if population=='trans-neptunian' else 'asteroid',
        orbit_class=row['class'],dynamical_subclass=None,orbit_domain=domain,solution_id=str(row['orbit_id']),
        diameter_km=diameter,absolute_magnitude=finite(row['H'],True),elements=elements,
        uncertainty=dict(condition_code=row['condition_code'],data_arc_days=finite(row['data_arc'],True),
            observations_used=None if row['n_obs_used'] is None else int(row['n_obs_used']),
            sigma_e=finite(row['sigma_e'],True),sigma_a_au=finite(row['sigma_a'],True)),
        representation='symbolic-approximate' if can_render else 'catalog-only',unavailable_reason=reason,
        coverage=dict(start_jd_tdb=epoch-MAX_DAYS,end_jd_tdb=epoch+MAX_DAYS) if can_render else None)


def propagate(body,jd):
    """Heliocentric ICRF position AU and analytic velocity AU/s; never a mesh radius."""
    if body['representation']!='symbolic-approximate':raise ValueError('catalog-only orbit has no population position')
    e=body['elements'];coverage=body['coverage']
    if not math.isfinite(jd) or not coverage['start_jd_tdb']<=jd<=coverage['end_jd_tdb']:raise ValueError('Outside source-element policy coverage')
    eccentricity=e['e']
    if not 0<=eccentricity<.98 or not 0<e['a_au']<=300:raise ValueError('Unqualified elliptical domain')
    mean=math.remainder(e['ma_rad']+e['n_rad_day']*(jd-e['epoch_jd_tdb']),2*math.pi)
    # Monotonic bracket guards high-e Newton steps; e>=.98 is never admitted.
    lo,hi=-math.pi,math.pi;eccentric=mean
    for _ in range(48):
        residual=eccentric-eccentricity*math.sin(eccentric)-mean
        if abs(residual)<1e-14:break
        if residual>0:hi=eccentric
        else:lo=eccentric
        proposal=eccentric-residual/(1-eccentricity*math.cos(eccentric))
        eccentric=proposal if lo<proposal<hi else (lo+hi)/2
    if abs(eccentric-eccentricity*math.sin(eccentric)-mean)>1e-12:raise ValueError('Elliptical solve did not converge')
    a=e['a_au'];root=math.sqrt(1-eccentricity**2);rate=e['n_rad_day']/(1-eccentricity*math.cos(eccentric))/86400
    position=[a*(math.cos(eccentric)-eccentricity),a*root*math.sin(eccentric)]
    velocity=[-a*math.sin(eccentric)*rate,a*root*math.cos(eccentric)*rate]
    w,i,node=(e[k] for k in ('w_rad','i_rad','om_rad'))
    def rotate(v):
        x,y=v;px=x*math.cos(w)-y*math.sin(w);py=x*math.sin(w)+y*math.cos(w)
        ex=px*math.cos(node)-py*math.cos(i)*math.sin(node)
        ey=px*math.sin(node)+py*math.cos(i)*math.cos(node);ez=py*math.sin(i)
        return [ex,ey*math.cos(EPSILON)-ez*math.sin(EPSILON),ey*math.sin(EPSILON)+ez*math.cos(EPSILON)]
    return rotate(position),rotate(velocity)


def parse_reference(raw,body,epochs):
    target=re.search(r'^Target body name:\s*(.+)$',raw,re.M)
    if not target or not re.search(r'(?<!\w)'+re.escape(body['designation'])+r'(?!\w)',target.group(1)):
        raise ValueError('Reference target identity mismatch')
    for header in ('Center body name: Sun (10)','Reference frame : ICRF','Output units    : AU-D','Output type     : GEOMETRIC cartesian states','JDTDB'):
        if header not in raw:raise ValueError('Reference frame/center/time/units mismatch')
    if raw.count('$$SOE')!=1 or raw.count('$$EOE')!=1:raise ValueError('Missing reference vectors')
    samples=[]
    for line in raw.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines():
        fields=line.split(',');values=[finite(x) for x in [fields[0],*fields[2:8]]]
        if len(values)!=7:raise ValueError('Incomplete state')
        samples.append(dict(jd_tdb=values[0],position_au=values[1:4],velocity_au_s=[x/86400 for x in values[4:7]]))
    if [s['jd_tdb'] for s in samples]!=epochs:raise ValueError('Reference epoch set mismatch')
    return samples


def now():return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')


class Acquisition:
    def __init__(self,directory,max_bytes=MAX_BYTES):
        self.directory=Path(directory);self.directory.mkdir(parents=True,exist_ok=True)
        self.path=self.directory/'acquisition.json'
        self.receipt=json.loads(self.path.read_text()) if self.path.exists() else dict(schema='oras.solar-population-acquisition.v1',started_utc=now(),files={})
        if not 0<max_bytes<=MAX_BYTES:raise ValueError('Acquisition budget must be within the approved 32 MiB ceiling')
        if self.receipt.get('schema')!='oras.solar-population-acquisition.v1':raise ValueError('Unqualified acquisition receipt')
        self.limit=max_bytes;self.bytes=sum(r['bytes'] for r in self.receipt['files'].values())
        if self.bytes>self.limit:raise ValueError('Acquisition budget exhausted')
    def get(self,name,url):
        destination=self.directory/name;record=self.receipt['files'].get(name)
        if record:
            raw=destination.read_bytes()
            if record['url']!=url or digest(raw)!=record['sha256'] or len(raw)!=record['bytes']:raise ValueError('Changed acquisition receipt/source')
            if 'error' in json.loads(raw):raise ValueError('Retained upstream rejection is not reusable source data')
            return raw
        if destination.exists():raise ValueError('Unreceipted source exists; preserve and choose a new directory')
        remaining=self.limit-self.bytes
        if remaining<=0:raise ValueError('Acquisition budget exhausted')
        lock=Path('output/playwright/solar-system-2.4/jpl-api.lock');lock.parent.mkdir(parents=True,exist_ok=True)
        with lock.open('a') as held:
            fcntl.flock(held,fcntl.LOCK_EX)
            with urlopen(Request(url,headers={'User-Agent':'Astronomy-Hub/2.4 bounded scientific acquisition'}),timeout=60) as response:
                raw=response.read(min(16*1024*1024,remaining)+1)
            fcntl.flock(held,fcntl.LOCK_UN)
        self.bytes+=len(raw)
        if self.bytes>self.limit or len(raw)>16*1024*1024:raise ValueError('Source acquisition byte budget exceeded')
        parsed=json.loads(raw)
        destination.write_bytes(raw)
        self.receipt['files'][name]=dict(url=url,sha256=digest(raw),bytes=len(raw),acquired_utc=now())
        self.receipt['completed_utc']=now();self.path.write_bytes(encode(self.receipt))
        print(name,len(raw),'aggregate',self.bytes,flush=True)
        if 'error' in parsed:raise ValueError('Upstream rejected acquisition; response retained in '+name)
        return raw


def query_url(key):return API+'?'+urlencode(dict(fields=FIELDS,**QUERIES[key],**{'full-prec':'true'}))


def representative_bodies(bodies):
    selected={}
    for population in ('asteroid-belt','trans-neptunian'):
        group=[b for b in bodies if b['population']==population and b['representation']=='symbolic-approximate']
        for key in ('a_au','e','i_rad'):
            ordered=sorted(group,key=lambda b:b['elements'][key])
            for b in [ordered[0],ordered[-1],ordered[len(ordered)//2]]:selected[b['source_id']]=b
    for b in bodies:
        if b['designation'] in ('1','4','136199','136472','136108') and b['representation']=='symbolic-approximate':selected[b['source_id']]=b
    return list(selected.values())


def acquire_and_build(source_dir,output,max_bytes=MAX_BYTES):
    acquisition=Acquisition(source_dir,max_bytes);bodies=[];by_id={};groups=[]
    for key,query in QUERIES.items():
        data=json.loads(acquisition.get(key+'.json',query_url(key)))
        if data.get('signature',{}).get('version')!='1.0' or data.get('fields')!=FIELDS.split(','):raise ValueError('SBDB query API schema changed')
        if not 0<len(data['data'])<=query['limit']:raise ValueError('Unexpected source count')
        groups.append(dict(id=key,population=POPULATIONS[key],available=int(data['count']),included=len(data['data']),limit=query['limit'],selection=query))
        for raw in data['data']:
            if len(raw)!=len(data['fields']):raise ValueError('Incomplete source row')
            body=normalize_body(dict(zip(data['fields'],raw)),POPULATIONS[key])
            if body['source_id'] in by_id:
                if by_id[body['source_id']]!=body:raise ValueError('Source object changed across queries')
                continue
            by_id[body['source_id']]=body;bodies.append(body)
    comparisons=[];references=[]
    for body in representative_bodies(bodies):
        epoch=body['elements']['epoch_jd_tdb'];epochs=[epoch-180,epoch-90,epoch,epoch+90,epoch+180]
        command=body['designation']+';' if body['designation'].isdigit() else 'DES='+body['designation']+';'
        params=dict(format='json',COMMAND="'"+command+"'",EPHEM_TYPE='VECTORS',CENTER='500@10',REF_PLANE='FRAME',REF_SYSTEM='ICRF',OUT_UNITS='AU-D',VEC_CORR='NONE',VEC_TABLE='2',CSV_FORMAT='YES',TLIST="'"+' '.join(map(str,epochs))+"'")
        filename='horizons-'+body['source_id']+'-vectors.json';url='https://ssd.jpl.nasa.gov/api/horizons.api?'+urlencode(params)
        response=json.loads(acquisition.get(filename,url))
        if response.get('signature',{}).get('version') not in ('1.2','1.3'):raise ValueError('Horizons API version changed')
        for state in parse_reference(response['result'],body,epochs):
            p,v=propagate(body,state['jd_tdb'])
            comparisons.append(dict(source_id=body['source_id'],designation=body['designation'],population=body['population'],**state,
                error_km=math.dist(p,state['position_au'])*AU_KM,velocity_error_km_s=math.dist(v,state['velocity_au_s'])*AU_KM))
        references.append(filename)
    # This is a sanity admission ceiling over these samples, NOT population-wide accuracy.
    if max(c['error_km'] for c in comparisons)>5e6:raise ValueError('Representative orbit differences exceed the symbolic-layer ceiling; requalify domain')
    pack=dict(schema='oras.solar-populations.v1',release='sbdb-populations-20261103-v1',acquired_utc=acquisition.receipt['completed_utc'],
        catalog='JPL SBDB',origin='Sun center (10)',element_frame='ECLIPJ2000',output_frame='ICRF',time_scale='TDB',position_units='AU',velocity_units='AU/s',
        body_count=len(bodies),groups=groups,
        model=dict(kind='two-body-osculating-symbols',max_days_from_epoch=MAX_DAYS,max_eccentricity_exclusive=.98,max_semimajor_axis_au=300,ecliptic_obliquity_arcsec=84381.448,
            population_wide_accuracy_qualified=False,disclosure='Symbolic approximate positions from source osculating elements; perturbations omitted. ±180 days is an application policy, not a JPL validity guarantee. Representative comparisons do not establish accuracy for all objects/times. Comets and unsupported orbits have no population position.'),
        selection='Magnitude-ranked bounded IMB/MBA/OMB and TNO source subsets plus numbered and bounded parabolic/hyperbolic comet discovery. Biased catalog coverage, not complete populations or measured spatial density. No classical/resonant/scattered subclass is inferred from TNO.',
        sources=acquisition.receipt['files'],terms=dict(publisher='NASA/JPL Solar System Dynamics',url='https://ssd-api.jpl.nasa.gov/',attribution='NASA/JPL SSD SBDB and Horizons',restrictions='Public numerical source snapshot; no NASA/JPL endorsement. API availability and data are not guaranteed; no runtime/browser API scraping.'),
        qualification=dict(reference='JPL Horizons geometric heliocentric ICRF position/velocity states; source element epochs and ±90/180days; sampled comparisons only.',
            max_comparison_error_km=max(c['error_km'] for c in comparisons),max_velocity_error_km_s=max(c['velocity_error_km_s'] for c in comparisons),comparisons=comparisons,reference_files=references),bodies=bodies)
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    raw=encode(pack);manifest=dict(schema='oras.solar-population-release.v1',release=pack['release'],file='population.json',sha256=digest(raw),bytes=len(raw),body_count=len(bodies),acquisition_sha256=digest(acquisition.path.read_bytes()))
    for name,value in [('population.json',raw),('manifest.json',encode(manifest))]:
        path=output/name
        if path.exists() and path.read_bytes()!=value:raise ValueError('Refusing to overwrite immutable population release')
        path.write_bytes(value)
    print(json.dumps(dict(body_count=len(bodies),bytes=len(raw),manifest_sha256=digest(encode(manifest)),comparisons=len(comparisons),max_error_km=pack['qualification']['max_comparison_error_km'])),flush=True)
    return pack,manifest


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--source-dir',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--max-bytes',type=int,default=MAX_BYTES)
    args=parser.parse_args();acquire_and_build(args.source_dir,args.output,args.max_bytes)

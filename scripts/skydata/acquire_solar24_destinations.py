"""Bounded original PLU060 excerpts and source-vector destination release.

Explicit offline acquisition only; the application never calls a provider. Original
6-hour Horizons states independently check daily Hermite knots; no conic solver is
used, including for hyperbolic comets. Runtime source files stay read-only/mounted.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import fcntl
import hashlib
import importlib.util
import json
from pathlib import Path
import re
from urllib.parse import urlencode
from urllib.request import urlopen
import numpy as np
from jplephem.daf import DAF
from jplephem.excerpter import write_excerpt
from jplephem.spk import SPK

ROOT=Path(__file__).resolve().parents[2]
_spec=importlib.util.spec_from_file_location('system_spk_builder',Path(__file__).with_name('acquire_system_spk.py'))
_source=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_source)
FIRST,LAST=2460676.5,2462502.5
PLUTO_URL='https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/satellites/plu060.bsp'
HORIZONS='https://ssd.jpl.nasa.gov/api/horizons.api'
SBDB='https://ssd-api.jpl.nasa.gov/sbdb.api'
DESTINATIONS={
 'ceres':dict(command='1;',designation='1',name='Ceres',spkid='20000001',classification='dwarf-planet',pck_id='2000001'),
 'vesta':dict(command='4;',designation='4',name='Vesta',spkid='20000004',classification='asteroid',pck_id='2000004'),
 'eros':dict(command='433;',designation='433',name='Eros',spkid='20000433',classification='asteroid',pck_id='2000433'),
 'eris':dict(command='136199;',designation='136199',name='Eris',spkid='20136199',classification='dwarf-planet',pck_id=None),
 'halley':dict(command='DES=1P;CAP;',designation='1P',name='Halley',spkid='1000036',classification='comet',pck_id=None),
 '67p':dict(command='DES=67P;CAP;',designation='67P',name='Churyumov-Gerasimenko',spkid='1000012',classification='comet',pck_id=None),
 'borisov':dict(command='DES=2I;',designation='2019 Q4',name='Borisov',spkid='1003639',classification='comet',pck_id=None),
}
SHAPE_FRAMES={
 'eros':dict(file='eros_alex.tpc.txt',url='https://sbnarchive.psi.edu/pds4/non_mission/gaskell.ast-eros.shape-model/document/eros_alex.tpc.txt',sha256='0b410adcbd14bc6f678781524050b979714c7f64acd8693786f35acaa1363673',frame='PDS_GASKELL_EROS',model_id='pds-gaskell-eros-alex',model='PDS Gaskell Eros shape companion eros_alex rotation coefficients; TDB',accuracy='Companion source-fixed shape frame. Extrapolated reference rotation; contemporary prime-meridian accuracy is not independently established.'),
 'vesta':dict(file='dawn_vesta_grv221108_v1.tpc',url='https://naif.jpl.nasa.gov/pub/naif/DAWN/kernels/pck/dawn_vesta_grv221108_v1.tpc',sha256='bb17489f6d933124b502a3a9a5e3491a0d94ab34bb06a7addfa760bd8c681278',frame='IAU_VESTA',model_id='dawn-vesta-grv221108-v1',model='DAWN gravity team GRV221108 Vesta pole, prime meridian and periodic terms; TDB',accuracy='Shape-consistent Claudia double-prime meridian. Reference model extrapolation; not an independent contemporary orientation observation.'),
}
ERIS_RADIUS_URL='https://www.iac.es/es/ciencia-y-tecnologia/publicaciones/pluto-radius-and-high-albedo-dwarf-planet-eris-occultation'
PLUTO_SATELLITES={'nix':902,'hydra':903,'kerberos':904,'styx':905}

def encode(value):return (json.dumps(value,sort_keys=True,separators=(',',':'),allow_nan=False)+'\n').encode()
def digest(raw):return hashlib.sha256(raw).hexdigest()

def bounded_body(response,limit):
    length=response.headers.get('Content-Length')
    if length is not None and int(length)>limit:raise ValueError('Response exceeds acquisition budget')
    raw=response.read(limit+1)
    if len(raw)>limit:raise ValueError('Response exceeds acquisition budget')
    return raw

def parse_vectors(raw,expected_name,center_id='10'):
    document=json.loads(raw)
    if 'error' in document:raise ValueError('Horizons source rejected request: '+str(document['error'])[:120])
    text=document.get('result','')
    def header(label):
        match=re.search(r'^'+re.escape(label)+r'\s*:\s*(.*)$',text,re.M)
        if not match:raise ValueError('Missing source '+label)
        return match[1].strip()
    target,center=header('Target body name'),header('Center body name')
    if not re.search(r'(?<!\w)'+re.escape(expected_name)+r'(?!\w)',target,re.I) or not re.search(r'\('+re.escape(center_id)+r'\)',center):raise ValueError('Wrong source target or center')
    if header('Reference frame')!='ICRF' or header('Output units')!='KM-S':raise ValueError('Unqualified source frame or units')
    if header('Output type')!='GEOMETRIC cartesian states' or not re.search(r'^\s*JDTDB,',text,re.M):raise ValueError('Unqualified source correction or time scale')
    if '$$SOE' not in text or '$$EOE' not in text:raise ValueError('Missing vector table')
    rows=[]
    for line in text.split('$$SOE',1)[1].split('$$EOE',1)[0].strip().splitlines():
        fields=[x.strip() for x in line.split(',')]
        if len(fields)<8:raise ValueError('Malformed source vector')
        rows.append([float(fields[0]),*[float(x) for x in fields[2:8]]])
    values=np.asarray(rows,dtype=float)
    if values.ndim!=2 or values.shape[1]!=7 or len(values)<2 or not np.isfinite(values).all() or np.any(np.diff(values[:,0])<=0):raise ValueError('Invalid source samples')
    number=re.search(r'\((\d+)\)',target)
    record=re.search(r'Rec #:\s*(\d+)',text)
    return values,dict(target_header=target,center_header=center,target_id=number[1] if number else record[1] if record else None,center_id=center_id,frame='ICRF',units='km,km/s',time_scale='TDB',corrections='NONE')

def daily_knots(values):
    if len(values)<5 or (len(values)-1)%4 or not np.allclose(np.diff(values[:,0]),.25,rtol=0,atol=1e-10):raise ValueError('Daily validation requires complete6-hour source cadence')
    knots=values[::4];p0,p1=knots[:-1,1:4],knots[1:,1:4];v0,v1=knots[:-1,4:],knots[1:,4:]
    u=np.array([.25,.5,.75])[None,:,None];dt=(np.diff(knots[:,0])*86400)[:,None,None]
    calculated=(2*u**3-3*u*u+1)*p0[:,None,:]+(u**3-2*u*u+u)*dt*v0[:,None,:]+(-2*u**3+3*u*u)*p1[:,None,:]+(u**3-u*u)*dt*v1[:,None,:]
    truth=np.stack([values[offset:-1:4,1:4] for offset in (1,2,3)],axis=1)
    errors=np.linalg.norm(calculated-truth,axis=2).max(axis=1)
    if not np.isfinite(errors).all() or np.max(errors)>=1:raise ValueError('Source interpolation exceeds1km sampled threshold')
    return knots,errors

def bind_solution(headers,metadata,solution):
    """Horizons record numbers differ from SBDB SPKIDs; bind actual designation."""
    target=headers['target_header'];designation=metadata['designation']
    if designation.isdigit():pattern=r'^'+re.escape(designation)+r'\s'
    elif re.fullmatch(r'\d+P',designation):pattern=r'^'+re.escape(designation)+'/'
    else:pattern=r'\(C/'+re.escape(designation)+r'\)'
    if not re.search(pattern,target):raise ValueError('Horizons designation does not match SBDB')
    if not re.search(r'\{source:\s*JPL#'+re.escape(str(solution))+r'\}',target):raise ValueError('Horizons solution does not match SBDB')

def satellite_metadata(raw,identity,naif_id,source):
    values,headers=parse_vectors(raw,identity.title(),'999')
    if headers['target_id']!=str(naif_id):raise ValueError('Wrong Pluto satellite identity')
    match=re.search(r'Radius \(km\)\s*=\s*([0-9.]+)\s*\+-\s*([0-9.]+)',json.loads(raw)['result'])
    if not match:raise ValueError('Missing sourced satellite radius')
    radius,uncertainty=map(float,match.groups())
    if not 0<radius<100 or not 0<uncertainty<radius:raise ValueError('Invalid source radius')
    return dict(id=identity,name=identity.title(),naif_id=str(naif_id),radius_km=radius,radius_uncertainty_km=uncertainty,source=source,representation='reference-sphere',orientation_status='No qualified surface rotation or resolved shape; source mean-radius sphere only')

class Acquisition:
    def __init__(self,output,limit):
        if not 0<limit<=64*1024*1024:raise ValueError('Acquisition budget must fit the approved 64 MiB ceiling')
        self.output,self.limit,self.bytes=Path(output),limit,0
    def fetch(self,filename,url,limit=4*1024*1024):
        limit=min(limit,self.limit-self.bytes)
        if limit<=0:raise ValueError('Source acquisition byte budget exhausted')
        lock_path=ROOT/'output/playwright/solar-system-2.4/jpl-api.lock';lock_path.parent.mkdir(parents=True,exist_ok=True)
        with lock_path.open('a') as lock:
            fcntl.flock(lock,fcntl.LOCK_EX)
            with urlopen(url,timeout=90) as response:raw=bounded_body(response,limit)
        self.bytes+=len(raw);(self.output/filename).write_bytes(raw)
        return raw,dict(file=filename,url=url,bytes=len(raw),sha256=digest(raw),acquired_utc=datetime.now(timezone.utc).isoformat(),publisher='NASA/JPL',terms='https://ssd.jpl.nasa.gov/disclaimer.html')

def acquire_body(acquisition,identity,metadata):
    output=acquisition.output
    raw,sbdb_meta=acquisition.fetch(f'sbdb-{identity}.json',SBDB+'?'+urlencode({'sstr':metadata['designation'],'phys-par':'true','full-prec':'true'}),1024*1024)
    sbdb=json.loads(raw)
    if sbdb.get('object',{}).get('des')!=metadata['designation'] or metadata['spkid'] and sbdb['object']['spkid']!=metadata['spkid']:raise ValueError('SBDB identity mismatch')
    args=dict(format='json',COMMAND="'"+metadata['command']+"'",OBJ_DATA='YES',MAKE_EPHEM='YES',EPHEM_TYPE='VECTORS',CENTER="'500@10'",START_TIME="'JD"+str(FIRST)+"'",STOP_TIME="'JD"+str(LAST)+"'",STEP_SIZE="'6 h'",TIME_TYPE='TDB',OUT_UNITS='KM-S',REF_PLANE='FRAME',REF_SYSTEM='ICRF',VEC_TABLE='2',VEC_CORR='NONE',CSV_FORMAT='YES')
    raw,vectors_meta=acquisition.fetch(f'horizons-{identity}.json',HORIZONS+'?'+urlencode(args))
    values,headers=parse_vectors(raw,metadata['name']);bind_solution(headers,metadata,sbdb['object']['orbit_id']);knots,errors=daily_knots(values)
    if values[0,0]!=FIRST or values[-1,0]!=LAST:raise ValueError('Incomplete source coverage')
    payload=encode(dict(knots=knots.tolist(),segment_errors_km=errors.tolist()));filename=f'vectors-{identity}.json';(output/filename).write_bytes(payload)
    physical={entry['name']:entry for entry in sbdb.get('phys_par',[])}
    elements={entry['name']:entry for entry in sbdb.get('orbit',{}).get('elements',[])}
    return dict(metadata,spkid=sbdb['object']['spkid'],full_name=sbdb['object']['fullname'],orbit_class=sbdb['object']['orbit_class'],orbit_id=sbdb['object']['orbit_id'],eccentricity=float(elements['e']['value']),
      sbdb=sbdb_meta,source=vectors_meta,headers=headers,file=filename,bytes=len(payload),sha256=digest(payload),source_samples=len(values),knots=len(knots),step_seconds=86400,max_sampled_error_km=float(max(errors)),
      physical_parameters=physical,model='Horizons numerical solution; daily cubic-Hermite interpolation independently checked at6-hour source epochs. No two-body/conic propagation.',uncertainty='Sampled interpolation error is not physical orbit uncertainty; source-fit and non-gravitational comet uncertainty remain. Future UTC assumes installed leap-second table.')


def acquire(output,max_bytes=64*1024*1024,include_borisov=True):
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    if any(output.iterdir()):raise ValueError('Release directory must be new/empty; existing sources are immutable')
    acquisition=Acquisition(output,max_bytes)
    budget=_source.ByteBudget(max_bytes);remote=_source.RangeSource(PLUTO_URL,budget,65536);source=SPK(DAF(remote))
    targets={9,10,901,902,903,904,905,999}
    summaries=[(name,v) for name,v in source.daf.summaries() if v[2] in targets and v[0]/86400+2451545<=FIRST and v[1]/86400+2451545>=LAST]
    if {v[2] for _,v in summaries}!=targets or any(v[4]!=1 or v[5]!=2 for _,v in summaries):raise ValueError('PLU source target, frame, type or coverage mismatch')
    with (output/'plu060-2025-2030.bsp').open('w+b') as stream:write_excerpt(source,stream,FIRST,LAST,summaries)
    raw=(output/'plu060-2025-2030.bsp').read_bytes();acquisition.bytes=budget.consumed
    manifest=dict(schema='oras.solar-destinations-release.v1',release='solar24-2025-2030-v1',first_jd_tdb=FIRST,last_jd_tdb=LAST,frame='ICRF',time_scale='TDB',corrections='NONE',acquired_utc=datetime.now(timezone.utc).isoformat(),budget_bytes=max_bytes,
      pluto=dict(file='plu060-2025-2030.bsp',sha256=digest(raw),bytes=len(raw),url=PLUTO_URL,ranges=remote.ranges,full_source_sha256=None,targets=sorted(targets),transformation='Original type2 coefficients copied; DAF layout/comments/coverage narrowed, no orbit fit.'),bodies={})
    pck=ROOT/'data/runtime-packs/planetary-systems-spk/release-2025-2030-v3/pck00011.tpc';raw=pck.read_bytes()
    if digest(raw)!=_source.PCK_SHA256:raise ValueError('Changed existing PCK source')
    (output/'pck00011.tpc').write_bytes(raw);manifest['orientation']=dict(file='pck00011.tpc',sha256=digest(raw),bytes=len(raw),url=_source.PCK_URL,transformation='Byte-identical reuse of already-qualified2.3 PCK; no new network transfer')
    (output/'acquisition.partial.json').write_bytes(encode(manifest))
    print('Pluto original excerpt',manifest['pluto']['bytes'],'network',acquisition.bytes,flush=True)
    for identity,metadata in DESTINATIONS.items():
        if identity=='borisov' and not include_borisov:continue
        manifest['bodies'][identity]=acquire_body(acquisition,identity,metadata)
        manifest['acquired_bytes']=acquisition.bytes;(output/'acquisition.partial.json').write_bytes(encode(manifest))
        print(identity,'max checked error',manifest['bodies'][identity]['max_sampled_error_km'],'km; network',acquisition.bytes,flush=True)
    manifest['shape_frames']={}
    for identity,metadata in SHAPE_FRAMES.items():
        raw,source_meta=acquisition.fetch(metadata['file'],metadata['url'],65536)
        if digest(raw)!=metadata['sha256']:raise ValueError('Changed shape companion rotation source')
        manifest['shape_frames'][identity]=dict(metadata,source=source_meta)
    raw,source_meta=acquisition.fetch('eris-radius-source.html',ERIS_RADIUS_URL,1024*1024)
    if b'1,163' not in raw and b'1163' not in raw:raise ValueError('Eris radius reference changed')
    manifest['bodies']['eris']['radius_override']=dict(radius_km=1163,uncertainty_km=6,source=source_meta,model='Sicardy et al. 2011 stellar occultation; spherical effective radius')
    manifest['pluto_satellites']={}
    for identity,naif_id in PLUTO_SATELLITES.items():
        args=dict(format='json',COMMAND=str(naif_id),OBJ_DATA='YES',MAKE_EPHEM='YES',EPHEM_TYPE='VECTORS',CENTER='500@999',TLIST="'"+str(FIRST)+' '+str(LAST)+"'",TIME_TYPE='TDB',OUT_UNITS='KM-S',REF_PLANE='FRAME',REF_SYSTEM='ICRF',VEC_TABLE='2',VEC_CORR='NONE',CSV_FORMAT='YES')
        raw,source_meta=acquisition.fetch('physical-'+identity+'.json',HORIZONS+'?'+urlencode(args),65536)
        manifest['pluto_satellites'][identity]=satellite_metadata(raw,identity,naif_id,source_meta)
    manifest['acquired_bytes']=acquisition.bytes;(output/'manifest.json').write_bytes(encode(manifest));(output/'acquisition.partial.json').unlink()
    print('manifest_sha256',digest(encode(manifest)),'network_bytes',acquisition.bytes,flush=True)
    return manifest

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--max-bytes',type=int,default=64*1024*1024);parser.add_argument('--without-borisov',action='store_true');args=parser.parse_args();acquire(args.output,args.max_bytes,not args.without_borisov)

"""Normalize a bounded real SBDB population; no hand-registered asteroid elements.

Source acquisition is explicit, sequential and cached on disk. Normal operation is
offline: provide original responses, an explicit acquisition receipt and output path.
File timestamps never establish when source bytes were acquired.
"""
import argparse
import hashlib
import json
import math
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

QUERY = 'https://ssd-api.jpl.nasa.gov/sbdb_query.api?fields=spkid,full_name,pdes,epoch,e,a,i,om,w,ma,n,diameter&sb-class=MBA&sb-ns=n&full-prec=true&sort=-diameter&limit=2048'
EROS = 'https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=433&full-prec=true&phys-par=true'
EPSILON = math.radians(84381.448/3600)  # JPL asteroid elements use IAU1976.
AU_KM = 149597870.7
REFERENCE_DESIGNATIONS = ('1','4','2','433')
REFERENCE_JDS = (2461020.5,2461200.5,2461341.5,2461380.5)


def propagate(elements, jd):
    """Elliptical two-body approximation in heliocentric ICRF AU."""
    if not math.isfinite(jd) or abs(jd-elements['epoch_jd_tdb'])>180:
        raise ValueError('Outside bounded osculating approximation')
    e,a=elements['e'],elements['a_au']
    mean=math.remainder(elements['ma_rad']+elements['n_rad_day']*(jd-elements['epoch_jd_tdb']),2*math.pi)
    eccentric=mean
    for _ in range(16):
        delta=(eccentric-e*math.sin(eccentric)-mean)/(1-e*math.cos(eccentric))
        eccentric-=delta
        if abs(delta)<1e-14:break
    if abs(eccentric-e*math.sin(eccentric)-mean)>1e-12:
        raise ValueError('Kepler solve did not converge')
    x=a*(math.cos(eccentric)-e);y=a*math.sqrt(1-e*e)*math.sin(eccentric)
    w,i,node=(elements[k] for k in ('w_rad','i_rad','om_rad'))
    px=x*math.cos(w)-y*math.sin(w);py=x*math.sin(w)+y*math.cos(w)
    ex=px*math.cos(node)-py*math.cos(i)*math.sin(node)
    ey=px*math.sin(node)+py*math.cos(i)*math.cos(node);ez=py*math.sin(i)
    return [ex,ey*math.cos(EPSILON)-ez*math.sin(EPSILON),ey*math.sin(EPSILON)+ez*math.cos(EPSILON)]


def _body(row,population):
    elements=dict(epoch_jd_tdb=float(row['epoch']),a_au=float(row['a']),e=float(row['e']),
                  **{k+'_rad':math.radians(float(row[k])) for k in ('i','om','w','ma')},n_rad_day=math.radians(float(row['n'])))
    if not all(math.isfinite(n) for n in elements.values()) or not 0<=elements['e']<.8 or not 0<elements['a_au']<6 or elements['n_rad_day']<=0:
        raise ValueError('Unqualified elements')
    return dict(catalog='JPL SBDB',source_id=str(row['spkid']),designation=str(row['pdes']),name=row['full_name'].strip(),
                model='asteroid',population=population,diameter_km=float(row['diameter']),elements=elements)


def _source(path,url):
    raw=path.read_bytes()
    return dict(url=url,sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw))


def source_urls():
    return dict([('sbdb-main-belt.json',QUERY),('sbdb-eros.json',EROS)]+[
        (f'horizons-{des}.json','https://ssd.jpl.nasa.gov/api/horizons.api?'+urlencode(horizons_parameters(des)))
        for des in REFERENCE_DESIGNATIONS])


def _utc(value):
    if not isinstance(value,str) or not value.endswith('Z'):
        raise ValueError('Acquisition receipt requires explicit UTC timestamps')
    return datetime.fromisoformat(value[:-1]+'+00:00')


def validate_receipt(directory,receipt_path,complete=True):
    receipt=json.loads(receipt_path.read_text())
    urls=source_urls()
    if receipt.get('schema')!='oras.solar-small-body-acquisition.v1' or not isinstance(receipt.get('files'),dict):
        raise ValueError('Acquisition receipt schema unavailable')
    records=receipt['files'];started=_utc(receipt['started_utc'])
    completed=_utc(receipt['completed_utc']) if receipt.get('completed_utc') else None
    if not set(records)<=set(urls) or (complete and (set(records)!=set(urls) or completed is None)):
        raise ValueError('Complete acquisition receipt required')
    if completed is not None and completed<started:
        raise ValueError('Invalid acquisition completion time')
    for name,record in records.items():
        acquired=_utc(record['acquired_utc'])
        if acquired<started or (completed is not None and acquired>completed):
            raise ValueError('Acquisition timestamp outside receipt interval')
        expected=_source(directory/name,urls[name])
        if any(record.get(key)!=value for key,value in expected.items()):
            raise ValueError('Acquisition receipt does not match source URL/hash/size')
    return receipt


def parse_reference(raw,body):
    required=('Target body name: '+body['name'],'Center body name: Sun (10)','Reference frame : ICRF',
              'Output units    : AU-D','Output type     : GEOMETRIC cartesian states','JDTDB')
    if any(header not in raw for header in required):
        raise ValueError('Reference identity/frame/time/units/center mismatch')
    samples=[]
    for line in raw.split('$$SOE')[1].split('$$EOE')[0].strip().splitlines():
        fields=line.split(',');jd=float(fields[0]);position=list(map(float,fields[2:5]))
        if len(position)!=3 or not all(map(math.isfinite,[jd]+position)):
            raise ValueError('Non-finite reference state')
        samples.append((jd,position))
    if tuple(jd for jd,_ in samples)!=REFERENCE_JDS:
        raise ValueError('Incomplete reference epoch set')
    return samples


def build(directory,output,receipt_path):
    receipt=validate_receipt(directory,receipt_path)
    records=receipt['files']
    query=json.loads((directory/'sbdb-main-belt.json').read_text());eros=json.loads((directory/'sbdb-eros.json').read_text())
    if query['signature']['version']!='1.0' or eros['signature']['version']!='1.3' or eros['orbit']['equinox']!='J2000':
        raise ValueError('Source API/equinox version changed')
    bodies=[_body(dict(zip(query['fields'],r)),'main-belt-subset') for r in query['data']]
    erow={r['name']:r['value'] for r in eros['orbit']['elements']}
    erow.update(epoch=eros['orbit']['epoch'],spkid=eros['object']['spkid'],pdes=eros['object']['des'],full_name=eros['object']['fullname'],
                diameter=next(p['value'] for p in eros['phys_par'] if p['name']=='diameter'))
    bodies.append(_body(erow,'near-earth-destination'))
    if len(bodies)!=2049 or len(set(b['source_id'] for b in bodies))!=2049 or {b['elements']['epoch_jd_tdb'] for b in bodies}!={2461200.5}:
        raise ValueError('Source population/epoch changed; requalification required')
    comparisons=[];reference_sources=[]
    for des in REFERENCE_DESIGNATIONS:
        path=directory/f'horizons-{des}.json';response=json.loads(path.read_text())
        if response['signature']['version']!='1.2':
            raise ValueError('Horizons API version changed; requalification required')
        raw=response['result']
        body=next(b for b in bodies if b['designation']==des)
        for jd,position in parse_reference(raw,body):
            approximate=propagate(body['elements'],jd)
            error=math.sqrt(sum((a-b)**2 for a,b in zip(approximate,position)))*AU_KM
            comparisons.append(dict(source_id=body['source_id'],designation=des,jd_tdb=jd,position_au=position,error_km=error))
        reference_sources.append(records[path.name])
    pack=dict(schema='oras.solar-small-bodies.v1',origin='Sun center (10)',frame='ECLIPJ2000',units='AU,rad,day',time_scale='TDB',
        acquired_utc=receipt['completed_utc'],acquisition_receipt_sha256=hashlib.sha256(receipt_path.read_bytes()).hexdigest(),population_count=2048,population_available=query['count'],
        selection='First 2048 numbered MBA-class asteroids sorted by decreasing catalog diameter; biased incomplete subset, not a measured density field. Eros is a separate named near-Earth destination.',
        sources=[records['sbdb-main-belt.json'],records['sbdb-eros.json']],
        terms=dict(data='NASA/JPL SSD public numerical orbit data; JPL attribution retained.',policy_url='https://ssd-api.jpl.nasa.gov/',
                   delivery='One bounded server-side acquisition; local snapshot only. No browser request to JPL. API availability and data are not guaranteed.'),
        model=dict(kind='two-body-osculating',max_days_from_epoch=180,population_wide_accuracy_qualified=False,
                   output_frame='ICRF',ecliptic_obliquity_arcsec=84381.448,
                   disclosure='Approximate two-body motion from JPL osculating elements; perturbations omitted. Visible points are enlarged symbols, not asteroid size or density. Validity limited by policy to 180 days from element epoch; representative comparisons do not qualify every object or all times.'),
        qualification=dict(reference='Independent JPL Horizons geometric Sun-centered ICRF vectors, AU-D and TDB; four bodies at four epochs.',
                           max_comparison_error_km=max(r['error_km'] for r in comparisons),comparisons=comparisons,sources=reference_sources),bodies=bodies)
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(pack,separators=(',',':'),allow_nan=False)+'\n')
    return pack


def horizons_parameters(des):
    return dict(format='json',COMMAND=f'{des};',EPHEM_TYPE='VECTORS',CENTER='500@10',REF_PLANE='FRAME',REF_SYSTEM='ICRF',OUT_UNITS='AU-D',VEC_CORR='NONE',VEC_TABLE='2',CSV_FORMAT='YES',TLIST="'"+' '.join(map(str,REFERENCE_JDS))+"'")


def acquire(directory,receipt_path):
    directory.mkdir(parents=True,exist_ok=True)
    receipt_path.parent.mkdir(parents=True,exist_ok=True)
    now=lambda:datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
    if receipt_path.exists():
        receipt=validate_receipt(directory,receipt_path,complete=False)
    else:
        if any((directory/name).exists() for name in source_urls()):
            raise ValueError('Existing responses require an original acquisition receipt; file times are not evidence')
        receipt=dict(schema='oras.solar-small-body-acquisition.v1',started_utc=now(),completed_utc=None,files={})
    def save():
        temporary=receipt_path.with_suffix(receipt_path.suffix+'.tmp')
        temporary.write_text(json.dumps(receipt,indent=2)+'\n')
        temporary.replace(receipt_path)
    save()
    for name,url in source_urls().items():
        target=directory/name
        if name in receipt['files']:continue
        if target.exists():raise ValueError('Unreceipted response exists; preserve it and use a fresh acquisition directory')
        req=Request(url,headers={'User-Agent':'Astronomy-Hub/2.0 science-ingestion (+https://github.com/Shadowgar/Astronomy-Hub/issues)'})
        with urlopen(req,timeout=30) as response:raw=response.read(2_000_001)
        if len(raw)>2_000_000:raise ValueError('Bounded source size exceeded')
        data=json.loads(raw)
        if 'error' in data:raise ValueError('Source acquisition rejected')
        target.write_bytes(raw)
        receipt['files'][name]=dict(**_source(target,url),acquired_utc=now())
        receipt['completed_utc']=None
        save()
    if receipt['completed_utc'] is None:
        receipt['completed_utc']=now()
        save()
    return validate_receipt(directory,receipt_path)


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source-dir',type=Path,required=True);parser.add_argument('--receipt',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--acquire',action='store_true')
    args=parser.parse_args()
    if args.acquire:acquire(args.source_dir,args.receipt)
    pack=build(args.source_dir,args.output,args.receipt)
    print(json.dumps(dict(bodies=len(pack['bodies']),max_comparison_error_km=pack['qualification']['max_comparison_error_km'],bytes=args.output.stat().st_size)))

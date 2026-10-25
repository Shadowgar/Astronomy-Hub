"""Output-only independent comparison of actual browser samples and local SGP4."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import numpy as np
import skyfield
import sgp4
from skyfield.api import EarthSatellite, load, load_file, wgs84

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT/'visual.tle'
KERNEL = Path('/home/rocco/Astronomy-Hub/.worktrees/integration-main-20261005/data/runtime-packs/planetary-ephemeris/release/de442s.bsp')
SOURCE_HASH = '63c4c833d967c26c2b3d403de42c234ff6b920969639642a3bedce15225406e2'
FEED_HASH = '9f063125517b9a6cc990159009ec7e46b764dc6dd14afc7a4b44a651e5920185'

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def dt(s): return datetime.fromisoformat(s.replace('Z','+00:00'))
def iso(d): return d.isoformat().replace('+00:00','Z')
def unit(v):
    v=np.asarray(v,dtype=float)[:3]
    assert np.all(np.isfinite(v)) and np.linalg.norm(v)>0
    return v/np.linalg.norm(v)
def separation(a,b):
    a,b=unit(a),unit(b)
    return float(np.degrees(np.arctan2(np.linalg.norm(np.cross(a,b)),np.dot(a,b))))
def radec(v):
    v=unit(v)
    return {'ra_icrf_deg':float(np.degrees(np.arctan2(v[1],v[0]))%360),
            'dec_icrf_deg':float(np.degrees(np.arctan2(v[2],np.hypot(v[0],v[1]))))}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--proof',type=Path,required=True)
    parser.add_argument('--label',default=None)
    parser.add_argument('--current-utc',default=None)
    args=parser.parse_args()
    proof_path=args.proof.resolve()
    label=args.label or proof_path.parent.name
    assert label and all(c.isalnum() or c in '-_' for c in label)
    out=Path(__file__).resolve().parent/label
    out.mkdir(exist_ok=True)
    proof_bytes=proof_path.read_bytes()
    proof_hash=hashlib.sha256(proof_bytes).hexdigest()
    proof=json.loads(proof_bytes)
    assert sha(RAW)==SOURCE_HASH
    manifest=json.loads((KERNEL.parent/'manifest.json').read_text())
    assert sha(KERNEL)==manifest['sha256'] and KERNEL.stat().st_size==manifest['byte_size']
    lines=RAW.read_text().splitlines()
    records={str(int(lines[i+1][2:7])):{'name':lines[i].rstrip(),'tle':lines[i+1:i+3]} for i in range(0,len(lines),3)}
    assert len(records)==155
    ts=load.timescale(builtin=True)
    eph=load_file(str(KERNEL))
    results=[]
    for run in proof['runs']:
        samples=run.get('motionSamples',[])
        if not samples:
            continue
        feed=run['feed']['data']
        assert feed['sha256']==FEED_HASH
        assert feed['record_count']==155 and feed['transport']['sha256']==SOURCE_HASH
        record_id=str(run['id'])
        raw=records[record_id]
        sat=EarthSatellite(*raw['tle'],raw['name'],ts)
        observer_data=samples[0]['observer']
        assert all(s['observer']==observer_data for s in samples)
        site=wgs84.latlon(observer_data['lat'],observer_data['lon'],elevation_m=observer_data['elevationM'])
        observer=eph['earth']+site
        rows=[]
        captures=[(f'motionSamples[{i}]',s) for i,s in enumerate(samples)]
        captures += [(label,s) for label,s in [
            ('initial',run.get('initial')),
            ('pointBefore.state',run.get('pointBefore',{}).get('state')),
            ('pointAfter.state',run.get('pointAfter',{}).get('state'))] if s]
        for capture_label,s in captures:
            assert s['observer']==observer_data
            model=s['source']['model_data']; provenance=s['source']['provenance']
            assert s['source']['model']=='tle_satellite'
            assert str(model['source_id'])==record_id and model['tle']==raw['tle']
            assert provenance['source_sha256']==SOURCE_HASH
            t=ts.from_datetime(dt(s['utc']))
            geometric=(sat-site).at(t)
            assert not geometric.message
            astrometric=observer.at(t).observe(eph['earth']+sat)
            apparent=astrometric.apparent()
            native=unit(s['radec'])
            alt,az,dist=geometric.altaz()
            sunalt=float(observer.at(t).observe(eph['sun']).apparent().altaz()[0].degrees)
            lit=bool(sat.at(t).is_sunlit(eph))
            vectors={'native':native,'instantaneous_geometric':unit(geometric.position.au),
                     'retarded_astrometric':unit(astrometric.position.au),'retarded_apparent':unit(apparent.position.au)}
            rows.append({'capture':capture_label,'utc':s['utc'],'wall_utc':s['wallUtc'],'native_live_flag':s['live'],
                         'native_speed':s['speed'],'native_camera_lock':s['lock'],
                         'vectors_icrf_unit':{k:v.tolist() for k,v in vectors.items()},
                         'positions':{k:radec(v) for k,v in vectors.items()},
                         'native_residual_arcsec':{k:separation(native,v)*3600 for k,v in vectors.items() if k!='native'},
                         'skyfield_geometric_altitude_deg':float(alt.degrees),'skyfield_geometric_azimuth_deg':float(az.degrees),
                         'skyfield_range_km':float(dist.km),'observer_sun_altitude_deg':sunalt,
                         'sunlit':lit,'tle_age_days':float(t-sat.epoch),
                         'geometric_illumination_eligible':bool(alt.degrees>15 and sunalt<=-6 and lit and 0<=t-sat.epoch<=14)})
        frozen_rows=[r for r in rows if not r['capture'].startswith('motionSamples[')]
        rows=[r for r in rows if r['capture'].startswith('motionSamples[')]
        assert all(r['native_speed']==0 and not r['native_live_flag'] for r in frozen_rows)
        trajectory=[]
        for idx in range(1,len(rows)):
            first,last=rows[0],rows[idx]
            elapsed=(dt(last['utc'])-dt(first['utc'])).total_seconds()
            trajectory.append({'from_utc':first['utc'],'to_utc':last['utc'],'elapsed_native_seconds':elapsed,
                               'angular_displacement_from_first_deg':{k:separation(first['vectors_icrf_unit'][k],last['vectors_icrf_unit'][k]) for k in first['vectors_icrf_unit']},
                               'paused_duplicate_utc':elapsed==0 or last['utc']==rows[idx-1]['utc']})
        residuals={k:[row['native_residual_arcsec'][k] for row in rows] for k in rows[0]['native_residual_arcsec']}
        results.append({'viewport':[run['width'],run['height']],'browser_run_status':run['status'],
                        'browser_run_error':run.get('error'),'norad_id':record_id,'name':raw['name'],
                        'source_tle_exact':raw['tle'],'tle_epoch_utc':iso(sat.epoch.utc_datetime()),
                        'observer_from_native_samples':observer_data,'feed_sha256':feed['sha256'],
                        'samples':rows,'frozen_state_comparisons':frozen_rows,'trajectory':trajectory,
                        'residual_ranges_arcsec':{k:{'min':min(v),'max':max(v)} for k,v in residuals.items()},
                        'captured_native_angular_displacement_deg':run.get('angularDisplacementDeg'),
                        'captured_native_pixel_displacement':run.get('pointPixelDisplacement'),
                        'scope':'Independent trajectory comparison only; does not override parent browser status or qualify photometry/pixels.'})
    assert results,'No motion samples found; no comparison possible'
    now=dt(args.current_utc) if args.current_utc else datetime.now(timezone.utc)
    tnow=ts.from_datetime(now)
    site=wgs84.latlon(41.321903,-79.585394,elevation_m=432.816)
    sunalt=float((eph['earth']+site).at(tnow).observe(eph['sun']).apparent().altaz()[0].degrees)
    current_rows=[]
    for sid,raw in records.items():
        sat=EarthSatellite(*raw['tle'],raw['name'],ts)
        geo=sat.at(tnow)
        assert not geo.message
        alt,az,dist=(sat-site).at(tnow).altaz()
        lit=bool(geo.is_sunlit(eph))
        current_rows.append({'norad_id':sid,'original_norad_field':raw['tle'][0][2:7],'name':raw['name'],
                             'geometric_altitude_deg':float(alt.degrees),'geometric_azimuth_deg':float(az.degrees),
                             'range_km':float(dist.km),'sunlit':lit,'tle_age_days':float(tnow-sat.epoch),
                             'fresh_14d':bool(0<=tnow-sat.epoch<=14)})
    counts={'records':len(current_rows),'above_0':sum(r['geometric_altitude_deg']>0 for r in current_rows),
            'above_15':sum(r['geometric_altitude_deg']>15 for r in current_rows),
            'sunlit_any_altitude':sum(r['sunlit'] for r in current_rows),
            'sunlit_above_0':sum(r['sunlit'] and r['geometric_altitude_deg']>0 for r in current_rows),
            'sunlit_above_15':sum(r['sunlit'] and r['geometric_altitude_deg']>15 for r in current_rows),
            'fresh_14d':sum(r['fresh_14d'] for r in current_rows)}
    result={'classification':'MEASURED_COMPARISON_NO_NEW_PRECISION_GATE','proof':str(proof_path),
            'proof_sha256':proof_hash,'parent_browser_status':proof['status'],
            'source_unchanged_recorded_by_browser':proof.get('source_unchanged'),
            'raw_source_sha256':sha(RAW),'expected_final_native_feed_sha256':FEED_HASH,
            'kernel':{'path':str(KERNEL),'sha256':sha(KERNEL),'manifest':manifest},
            'libraries':{'skyfield':skyfield.__version__,'sgp4':sgp4.__version__,'numpy':np.__version__},
            'references':{'instantaneous_geometric':'(satellite - WGS84 observer).at(UTC), topocentric ICRF; no refraction',
                          'retarded_astrometric':'Barycentric observer.observe(Earth + satellite), including iterative light-time',
                          'retarded_apparent':'Skyfield astrometric.apparent(), adding standard apparent-place corrections'},
            'limits':['Native and reference samples share TLE input; agreement is implementation consistency, not independent physical tracking truth.',
                      'Residuals are measurements, not an invented acceptance tolerance or claimed source accuracy.',
                      'Native snapshot UTC/vector synchronization and native apparent-place conventions were not separately qualified by this helper.',
                      'Frozen speed0 states are compared separately without changing or normalizing the original advancing1x samples.',
                      'No native brightness, terrain, weather or pixel qualification is inferred from geometric eligibility.',
                      'Advancing native1x at a future simulation epoch is distinct from the actual current wall-clock sky.',
                      'A successful retained native phase does not make an overall failed browser run pass.'],
            'runs':results,'current_utc_inventory':{'utc':iso(now),'observer':{'lat':41.321903,'lon':-79.585394,'elevationM':432.816},
                     'observer_sun_altitude_deg':sunalt,'counts':counts,'records':current_rows}}
    assert proof_path.read_bytes()==proof_bytes,'Proof changed during comparison; rerun against stable evidence'
    (out/'comparison.json').write_text(json.dumps(result,indent=2)+'\n')
    report=['# Independent native/Skyfield trajectory comparison','',f'Parent browser status: **{proof["status"]}**. Scientific comparison uses retained motion samples only.',
            f'Input proof SHA256: `{proof_hash}`.', '',
            '| Viewport | NORAD | Samples | Native displacement ° | Geometric displacement ° | Native/geometric residual arcsec |',
            '|---|---|---:|---:|---:|---:|']
    for r in results:
        last=r['trajectory'][-1]['angular_displacement_from_first_deg']
        residual=r['residual_ranges_arcsec']['instantaneous_geometric']
        report.append(f'| {r["viewport"][0]}×{r["viewport"][1]} | {r["norad_id"]} | {len(r["samples"])} | {last["native"]:.6f} | {last["instantaneous_geometric"]:.6f} | {residual["min"]:.3f}–{residual["max"]:.3f} |')
    report+=['', 'Frozen speed0 states are independently compared without modifying advancing samples:', '',
             '| Viewport | Capture | UTC | Geometric residual arcsec | Apparent residual arcsec |', '|---|---|---|---:|---:|']
    for r in results:
        for s in r['frozen_state_comparisons']:
            report.append(f'| {r["viewport"][0]}×{r["viewport"][1]} | {s["capture"]} | {s["utc"]} | {s["native_residual_arcsec"]["instantaneous_geometric"]:.3f} | {s["native_residual_arcsec"]["retarded_apparent"]:.3f} |')
    report+=['',f'Current UTC inventory at **{iso(now)}**: {counts["above_0"]}/155 above0°, {counts["above_15"]}/155 above15°; {counts["sunlit_above_0"]} sunlit above0°, {counts["sunlit_above_15"]} sunlit above15°. Observer Sun altitude {sunalt:.3f}°. All {counts["fresh_14d"]}/155 elements within14days.',
             '', 'Residuals do not have a newly invented precision gate. Exact apparent/astrometric residuals, per-sample positions and trajectory displacement appear in `comparison.json`. No native brightness/pixel claim; future pass replay remains simulation. This does not change parent browser pass/fail status.']
    (out/'REPORT.md').write_text('\n'.join(report)+'\n')
    print(json.dumps({'output':str(out),'parent_browser_status':proof['status'],'comparisons':len(results),'samples':sum(len(r['samples']) for r in results),'runs':[{k:r[k] for k in ['viewport','norad_id','residual_ranges_arcsec','trajectory']} for r in results],'current_utc':iso(now),'current_counts':counts,'observer_sun_altitude_deg':sunalt},indent=2))

if __name__=='__main__': main()

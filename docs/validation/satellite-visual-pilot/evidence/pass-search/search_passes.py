"""Offline, output-only Skyfield eligibility search; no native photometry claim."""
from pathlib import Path
from datetime import datetime, timedelta, timezone
import hashlib
import json
import time
import numpy as np
import skyfield
import sgp4
from skyfield.api import EarthSatellite, load, load_file, wgs84

BASE = Path(__file__).resolve().parent
INPUT = BASE.parent / 'visual.tle'
KERNEL = Path('/home/rocco/Astronomy-Hub/.worktrees/integration-main-20261005/data/runtime-packs/planetary-ephemeris/release/de442s.bsp')
START = datetime(2026, 10, 25, 6, 35, tzinfo=timezone.utc)
STOP = START + timedelta(days=1)
OBSERVER = {'latitude_deg': 41.321903, 'longitude_deg': -79.585394, 'elevation_m': 432.816}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def iso(d):
    return d.isoformat().replace('+00:00', 'Z')

def main():
    started = time.monotonic()
    raw = INPUT.read_bytes()
    assert sha(INPUT) == '63c4c833d967c26c2b3d403de42c234ff6b920969639642a3bedce15225406e2'
    kernel_manifest = json.loads((KERNEL.parent/'manifest.json').read_text())
    assert sha(KERNEL) == kernel_manifest['sha256']
    assert KERNEL.stat().st_size == kernel_manifest['byte_size']
    lines = raw.decode('ascii').splitlines()
    assert len(lines) == 155 * 3
    ts = load.timescale(builtin=True)  # bundled tables; no network
    eph = load_file(str(KERNEL))      # exact local admitted kernel
    site = wgs84.latlon(OBSERVER['latitude_deg'], OBSERVER['longitude_deg'], elevation_m=OBSERVER['elevation_m'])
    observer = eph['earth'] + site
    dates = [START + timedelta(minutes=i) for i in range(1441)]
    times = ts.from_datetimes(dates)
    sun_alt = observer.at(times).observe(eph['sun']).apparent().altaz()[0].degrees
    windows = []
    current = []
    propagation_errors = []
    per_record = []
    satellites = {}

    def sample(sat, d):
        t = ts.from_datetime(d)
        top = (sat - site).at(t)
        alt, az, dist = top.altaz()  # no refraction
        ra, dec, _ = top.radec()    # geometric topocentric ICRF
        s_alt = observer.at(t).observe(eph['sun']).apparent().altaz()[0].degrees
        lit = bool(sat.at(t).is_sunlit(eph))
        age = float(t - sat.epoch)
        return {'utc': iso(d), 'altitude_deg': float(alt.degrees), 'azimuth_deg': float(az.degrees),
                'range_km': float(dist.km), 'ra_icrf_deg': float(ra.hours * 15), 'dec_icrf_deg': float(dec.degrees),
                'observer_sun_altitude_deg': float(s_alt), 'sunlit': lit, 'tle_age_days': age,
                'eligible': bool(alt.degrees > 15 and s_alt <= -6 and lit and 0 <= age <= 14)}

    for i in range(0, len(lines), 3):
        name, l1, l2 = lines[i:i+3]
        norad = l1[2:7]  # original fixed-width NORAD string, including leading zeroes
        assert norad == l2[2:7]
        sat = EarthSatellite(l1, l2, name.rstrip(), ts)
        satellites[norad] = sat
        geocentric = sat.at(times)
        if geocentric.message is not None:
            errors = [str(x) for x in np.atleast_1d(geocentric.message) if x]
            if errors:
                propagation_errors.append({'norad_id': norad, 'errors': sorted(set(errors))})
        alt, az, dist = (sat - site).at(times).altaz()
        lit = np.asarray(geocentric.is_sunlit(eph))
        age = times - sat.epoch
        eligible = (alt.degrees > 15) & (sun_alt <= -6) & lit & (age >= 0) & (age <= 14)
        per_record.append({'norad_id': norad, 'name': sat.name, 'eligible_minute_samples': int(np.sum(eligible)),
                           'epoch_utc': iso(sat.epoch.utc_datetime()), 'age_days_at_start': float(age[0]),
                           'age_days_at_stop': float(age[-1]), 'minimum_altitude_deg': float(np.min(alt.degrees)),
                           'maximum_altitude_deg': float(np.max(alt.degrees))})
        if eligible[0]:
            current.append({'norad_id': norad, 'name': sat.name, 'sample': sample(sat, START)})
        edges = np.diff(np.r_[False, eligible, False].astype(int))
        for left, right in zip(np.where(edges == 1)[0], np.where(edges == -1)[0]):
            peak = left + int(np.argmax(alt.degrees[left:right]))
            windows.append({'norad_id': norad, 'name': sat.name,
                            'tle_epoch_utc': iso(sat.epoch.utc_datetime()), 'tle_lines': [l1, l2],
                            'first_eligible_grid_utc': iso(dates[left]), 'last_eligible_grid_utc': iso(dates[right - 1]),
                            'eligible_grid_count': int(right-left), 'peak_grid_utc': iso(dates[peak]),
                            'peak_altitude_deg': float(alt.degrees[peak]),
                            'observer_sun_altitude_range_deg': [float(np.min(sun_alt[left:right])), float(np.max(sun_alt[left:right]))],
                            'sunlit_for_all_eligible_grid_samples': bool(np.all(lit[left:right])),
                            'samples': [sample(sat, dates[peak] + timedelta(seconds=s)) for s in (-30, 0, 30)]})
    # Prioritize sustained high morning passes, with station identifiers exposed separately.
    morning = [w for w in windows if w['first_eligible_grid_utc'] < '2026-10-25T13:00:00Z']
    ranked = sorted(morning or windows, key=lambda w: (-w['peak_altitude_deg'], -w['eligible_grid_count']))
    shortlist = []
    ids = set()
    for w in ranked:
        if w['norad_id'] not in ids:
            shortlist.append(w)
            ids.add(w['norad_id'])
        if len(shortlist) == 10:
            break
    station_windows = [w for w in windows if w['norad_id'] in ('25544', '48274', '20580')]
    result = {'classification': 'geometric_sunlit_dark_observer_candidate_search_only',
              'generated_utc': iso(datetime.now(timezone.utc)), 'elapsed_seconds': time.monotonic()-started,
              'input': {'path': str(INPUT), 'sha256': sha(INPUT), 'bytes': len(raw), 'records': 155},
              'kernel': {'path': str(KERNEL), 'sha256': sha(KERNEL), 'bytes': KERNEL.stat().st_size,
                         'manifest': kernel_manifest},
              'libraries': {'skyfield': skyfield.__version__, 'sgp4': sgp4.__version__, 'numpy': np.__version__},
              'observer': OBSERVER, 'start_utc': iso(START), 'stop_utc': iso(STOP), 'grid_seconds': 60,
              'timescale': 'Skyfield bundled timescale, no downloads',
              'thresholds': {'geometric_altitude_strictly_above_deg': 15, 'observer_sun_altitude_at_most_deg': -6,
                             'sunlit': 'Skyfield EarthSatellite.is_sunlit using local DE442s', 'tle_age_days': [0,14]},
              'limits': ['60-second sampling can miss short passes and does not determine exact rise/set/shadow boundaries.',
                         'Listed windows are first/last eligible sample times, not continuously certified intervals.',
                         'No terrain, refraction, weather, native visual magnitude, field-of-view or pixel-visibility admission.',
                         'Peak is maximum among eligible minute samples, not an optimized physical culmination.',
                         'TLE propagation is predictive; no external tracking truth or error bound is established.',
                         'Any replay at a listed future UTC is an explicitly simulated observation epoch, not current Live proof.'],
              'current_instant_candidates': current, 'propagation_errors': propagation_errors,
              'eligible_window_count': len(windows), 'eligible_record_count': sum(r['eligible_minute_samples'] > 0 for r in per_record),
              'shortlist': shortlist, 'required_identity_windows': station_windows, 'all_windows': windows, 'per_record': per_record}
    (BASE/'pass-search.json').write_text(json.dumps(result, indent=2)+'\n')
    rows = ['# Upcoming native-visibility candidates (geometry only)', '',
            f'Search: {iso(START)} through {iso(STOP)};155 records;60-second grid.',
            f'Current-instant eligible candidates: {len(current)}. Eligible records: {result["eligible_record_count"]}; sampled windows: {len(windows)}.',
            '', 'Native photometry and actual pixels must be checked independently. Future-epoch browser replay is simulation.', '',
            '| NORAD | Name | Eligible grid UTC window | Peak sample UTC | Altitude ° | Sun altitude ° |', '|---|---|---|---|---:|---:|']
    for w in shortlist:
        p = w['samples'][1]
        rows.append(f'| {w["norad_id"]} | {w["name"]} | {w["first_eligible_grid_utc"]}–{w["last_eligible_grid_utc"]} | {w["peak_grid_utc"]} | {p["altitude_deg"]:.3f} | {p["observer_sun_altitude_deg"]:.3f} |')
    rows += ['', 'See `pass-search.json` for original TLE lines, epochs/ages, kernel/source hashes, three geometric position samples per window, required ISS/CSS/HST identity windows and explicit limitations.']
    (BASE/'REPORT.md').write_text('\n'.join(rows)+'\n')
    print(json.dumps({'records':155, 'current_candidates':len(current), 'eligible_records':result['eligible_record_count'],
                      'sampled_windows':len(windows), 'propagation_errors':len(propagation_errors),
                      'shortlist': [{k:w[k] for k in ('norad_id','name','first_eligible_grid_utc','last_eligible_grid_utc','peak_grid_utc','peak_altitude_deg')} for w in shortlist],
                      'required_identity_windows': [{k:w[k] for k in ('norad_id','name','first_eligible_grid_utc','last_eligible_grid_utc','peak_grid_utc','peak_altitude_deg')} for w in station_windows]}, indent=2))

if __name__ == '__main__':
    main()

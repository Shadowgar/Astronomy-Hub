"""Read-only source/retained-proof investigation; writes only this output directory.

No new acceptance tolerance, runtime alteration, source update, or browser campaign.
"""
from pathlib import Path
from datetime import datetime
import ctypes as C
import hashlib
import json
import subprocess
import numpy as np
import erfa
import skyfield
import sgp4
from skyfield.api import EarthSatellite, load, wgs84
from skyfield.sgp4lib import TEME

OUT = Path(__file__).resolve().parent
REPO = Path('/home/rocco/Astronomy-Hub')
BASE = REPO/'.worktrees/sky-satellite-visual-pilot-1'
SOURCE = REPO/'vendor/stellarium-web-engine'
PIN_REPO = Path('/var/tmp/oras-phase-c/sky-reconstruction/upstream')
PIN = '023e3b26babf7ffddf45f39293230b14cfe96993'
PROOF = BASE/'output/satellite-visual-pilot/browser-qualified/proof.json'
COMPARISON = BASE/'docs/validation/satellite-visual-pilot/evidence/independent-motion/comparison.json'
FILES = ['src/modules/satellites.c', 'src/observer.c', 'src/frames.c', 'src/obj.c',
         'src/utils/vec.h', 'src/sgp4.cpp', 'src/sgp4.h',
         'ext_src/sgp4/SGP4.cpp', 'ext_src/sgp4/SGP4.h',
         'ext_src/erfa/erfa.c', 'src/algos/utctt.c', 'src/algos/deltat.c']
sha = lambda b: hashlib.sha256(b).hexdigest()
def unit(v): return v/np.linalg.norm(v)
def sep(a, b):
    a, b = unit(np.array(a)), unit(np.array(b))
    return float(np.degrees(np.arctan2(np.linalg.norm(np.cross(a,b)), np.dot(a,b)))*3600)
def native_delta_t(utc_mjd):
    y = erfa.epj(2400000.5, utc_mjd)
    assert y > 2016  # Exact branch of pinned deltat.c, not generalized.
    t = y - 2000
    dt2016 = 62.92 + .32217*16 + .005589*16*16
    return 62.92 + .32217*t + .005589*t*t - (dt2016-68.1024)

source_receipt = {}
for name in FILES:
    actual = (SOURCE/name).read_bytes()
    pinned = subprocess.check_output(['git','-C',str(PIN_REPO),'show',PIN+':'+name])
    assert actual == pinned, name
    source_receipt[name] = {'sha256': sha(actual), 'matches_pinned_git_object': True}
proof_bytes = PROOF.read_bytes()
comparison_bytes = COMPARISON.read_bytes()
proof = json.loads(proof_bytes)
comparison = json.loads(comparison_bytes)
assert sha(proof_bytes) == comparison['proof_sha256']
build = ['g++','-shared','-fPIC','-O2',str(SOURCE/'src/sgp4.cpp'),'-o',str(OUT/'libnative_sgp4.so')]
subprocess.run(build, check=True)
erfa_build = ['gcc','-shared','-fPIC','-O2',str(SOURCE/'ext_src/erfa/erfa.c'),'-lm','-o',str(OUT/'libnative_erfa.so')]
subprocess.run(erfa_build, check=True)
native_erfa = C.CDLL(str(OUT/'libnative_erfa.so'))
native_erfa.eraDat.argtypes = [C.c_int,C.c_int,C.c_int,C.c_double,C.POINTER(C.c_double)]
leap_status = []
for year in [2025,2026]:
    dat = C.c_double()
    status = native_erfa.eraDat(year,10,25,0.,C.byref(dat))
    leap_status.append({'year':year,'eraDat_status':status,'tai_minus_utc_seconds':dat.value})
lib = C.CDLL(str(OUT/'libnative_sgp4.so'))
ptr = C.POINTER(C.c_double)
lib.sgp4_twoline2rv.argtypes = [C.c_char_p,C.c_char_p,C.c_char,C.c_char,C.c_char,ptr,ptr,ptr]
lib.sgp4_twoline2rv.restype = C.c_void_p
lib.sgp4.argtypes = [C.c_void_p,C.c_double,ptr,ptr]
lib.sgp4.restype = C.c_int
ts = load.timescale(builtin=True)
rows = []
for run, prior in zip(proof['runs'], comparison['runs']):
    captures = [(f'motionSamples[{i}]',s) for i,s in enumerate(run['motionSamples'])]
    captures += [('initial',run['initial']),('pointBefore.state',run['pointBefore']['state']),('pointAfter.state',run['pointAfter']['state'])]
    prior_rows = {r['capture']:r for r in prior['samples']+prior['frozen_state_comparisons']}
    tle = prior['source_tle_exact']
    sat = EarthSatellite(*tle,ts=ts)
    args = [C.c_double() for _ in range(3)]
    rec = lib.sgp4_twoline2rv(tle[0].encode(),tle[1].encode(),b'c',b'm',b'i',*[C.byref(a) for a in args])
    for label, s in captures:
        assert s['source']['model_data']['tle'] == tle
        obs = s['observer']
        t = ts.from_datetime(datetime.fromisoformat(s['utc'].replace('Z','+00:00')))
        utc_mjd = (t.whole-2400000.5)+t.tai_fraction-t._leap_seconds()/86400
        p, v, error = sat._position_and_velocity_TEME_km(t)
        assert error is None
        npv, nvv = (C.c_double*3)(), (C.c_double*3)()
        assert lib.sgp4(rec,utc_mjd,npv,nvv) == 0
        native_p, native_v = np.array(npv), np.array(nvv)
        site = wgs84.latlon(obs['lat'],obs['lon'],elevation_m=obs['elevationM'])
        site_state = site.at(t)
        op, ov = site_state.position.km, site_state.velocity.km_per_s
        # Native ERFA's IYV=2020 rejects year>2025 as dubious; utctt.c
        # treats any warning as unknown leap seconds and makes UTC=UT1.
        dt = native_delta_t(utc_mjd)
        ntt = utc_mjd+dt/86400
        ntt += (native_delta_t(ntt)-dt)/86400
        pn = erfa.pn00a(2400000.5,ntt)
        rp, rn = pn[4], pn[6]
        # Exact effective matrix for SWE column-major mat3_mul(rn,rp)
        # on ERFA row-major outputs, followed by mat3_mul_vec3.
        native_rotation = rn.T@rp.T
        cirs = erfa.c2i06a(2400000.5,ntt)
        theta = erfa.era00(2400000.5,utc_mjd)
        sp = erfa.sp00(2400000.5,ntt)
        obs_pv = erfa.pvtob(np.radians(obs['lon']),np.radians(obs['lat']),obs['elevationM'],0,0,sp,theta)
        native_op, native_ov = cirs.T@obs_pv['p']/1000, cirs.T@obs_pv['v']/1000
        correct_rotation = TEME.rotation_at(t).T
        geometric = correct_rotation@p-op
        def apparent(q, velocity): return q-velocity*np.linalg.norm(q)/299792.458
        native_geom = native_rotation@native_p-native_op
        native_rebuilt = apparent(native_geom,native_v-native_ov)
        variants = {
            'reference_geometric': geometric,
            'reference_geometric_plus_native_relative_light': apparent(geometric,correct_rotation@v-ov),
            'native_rotation_only': native_rotation@native_p-op,
            'native_rotation_plus_native_light_correct_observer': apparent(native_rotation@native_p-op,native_v-ov),
            'native_observer_only': correct_rotation@p-native_op,
            'native_reconstructed_geometric': native_geom,
            'native_reconstructed_apparent': native_rebuilt,
            'native_reconstructed_with_rotated_velocity': apparent(native_geom,native_rotation@native_v-native_ov),
            'native_reconstructed_with_correct_TEME': apparent(correct_rotation@native_p-native_op,correct_rotation@native_v-native_ov),
        }
        native = np.array(s['radec'][:3])
        serialized_reconstruction = np.array([float(f'{x/149597870.7:.12f}') for x in native_rebuilt])
        # Diagnostic projected timing estimate, not a correction to evidence.
        qhat = unit(geometric)
        tangent = (correct_rotation@v-ov)/np.linalg.norm(geometric)
        tangent -= qhat*np.dot(qhat,tangent)
        best_dt = np.dot(unit(native)-qhat,tangent)/np.dot(tangent,tangent)
        timing_t = ts.tt_jd(t.whole,t.tt_fraction+best_dt/86400)
        timing_q = (sat-site).at(timing_t).position.km
        prior_row = prior_rows[label]
        rows.append({
            'viewport':[run['width'],run['height']], 'capture':label,'utc':s['utc'],
            'native_speed':s['speed'], 'native_live':s['live'], 'norad_id':prior['norad_id'],
            'native_vector_au':native.tolist(), 'range_km':float(np.linalg.norm(geometric)),
            'reconstructed_vector_au_serialized_12dp':serialized_reconstruction.tolist(),
            'reconstructed_serialized_vector_exactly_matches_capture':bool(np.array_equal(native,serialized_reconstruction)),
            'skyfield_dut1_seconds':float(t.dut1),'native_delta_t_seconds':float((ntt-utc_mjd)*86400),
            'skyfield_tt_minus_utc_seconds':float(t.delta_t+t.dut1),
            'equation_of_equinoxes_arcsec':float(erfa.ee00a(t.whole,t.tt_fraction)*206264.80624709636),
            'native_vs_skyfield_TEME_position_difference_m':float(np.linalg.norm(native_p-p)*1000),
            'native_vs_skyfield_TEME_velocity_difference_m_s':float(np.linalg.norm(native_v-v)*1000),
            'native_rotation_geocentric_error_m':float(np.linalg.norm(native_rotation@native_p-correct_rotation@p)*1000),
            'native_observer_position_error_m':float(np.linalg.norm(native_op-op)*1000),
            'native_residual_arcsec':{k:sep(native,q) for k,q in variants.items()},
            'prior_residual_arcsec':prior_row['native_residual_arcsec'],
            'hypothesis_effect_arcsec':{
                'native_rotation_only':sep(geometric,variants['native_rotation_only']),
                'native_observer_only':sep(geometric,variants['native_observer_only']),
                'relative_light_correction':sep(native_geom,native_rebuilt),
                'unrotated_velocity':sep(native_rebuilt,variants['native_reconstructed_with_rotated_velocity']),
                'TEME_replacement_with_native_observer':sep(native_rebuilt,variants['native_reconstructed_with_correct_TEME']),
            },
            'timing_only_diagnostic':{'best_linear_shift_seconds':float(best_dt),'residual_after_shift_arcsec':sep(native,timing_q)},
            'predicted_vectors_km':{k:q.tolist() for k,q in variants.items()},
        })

def bounds(values): return {'min':float(min(values)), 'max':float(max(values))}
summary = {
    'captures':len(rows),'frozen_captures':sum(r['native_speed']==0 for r in rows),
    'exact_matches_after_pinned_native_12dp_serialization':sum(r['reconstructed_serialized_vector_exactly_matches_capture'] for r in rows),
    'variants_residual_arcsec':{key:bounds([r['native_residual_arcsec'][key] for r in rows]) for key in rows[0]['native_residual_arcsec']},
    'effects_arcsec':{key:bounds([r['hypothesis_effect_arcsec'][key] for r in rows]) for key in rows[0]['hypothesis_effect_arcsec']},
    'native_sgp4_position_difference_m':bounds([r['native_vs_skyfield_TEME_position_difference_m'] for r in rows]),
    'native_sgp4_velocity_difference_m_s':bounds([r['native_vs_skyfield_TEME_velocity_difference_m_s'] for r in rows]),
    'timing_only_residual_arcsec':bounds([r['timing_only_diagnostic']['residual_after_shift_arcsec'] for r in rows]),
}
result = {
    'classification':'CAUSE_LOCALIZED_NO_ACCEPTANCE_GATE_OR_RUNTIME_FIX',
    'scope':'Retained single NORAD 61045 pass, three viewports; source-matched numerical reconstruction only',
    'proof':str(PROOF),'proof_sha256':sha(proof_bytes),'comparison_sha256':sha(comparison_bytes),
    'comparison_source_sha256':comparison['raw_source_sha256'],
    'source_pin':PIN,'source_receipt':source_receipt,
    'libraries':{'skyfield':skyfield.__version__,'sgp4':sgp4.__version__,'erfa':erfa.__version__,'numpy':np.__version__},
    'build_command':build,'erfa_build_command':erfa_build,
    'pinned_erfa_leap_status_probe':leap_status,'summary':summary,'rows':rows,
    'limits':[
        'No posthoc tolerance and no assertion of absolute physical satellite accuracy.',
        'Retained native vectors are serialized with limited significant digits and UTC with milliseconds.',
        'Native TT/DUT1 internals were not captured; native time policy is reconstructed from pinned source.',
        'Python ERFA evaluates equivalent matrix/observer formulas; this is not a new native WASM execution.',
        'One NORAD and an eight-second pass do not qualify other orbits, epochs, or observers.',
        'Skyfield built-in Earth orientation is the comparison reference, not independent ground-truth tracking.',
        'No production source/math/binary changes, Docker restart, new source fetch, or repeated historical browser campaign.',
    ],
}
assert PROOF.read_bytes()==proof_bytes
assert COMPARISON.read_bytes()==comparison_bytes
(OUT/'investigation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(summary,indent=2))

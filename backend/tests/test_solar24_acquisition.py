"""Source-admission tests: no network, real Horizons CSV syntax."""
import importlib.util
from pathlib import Path
import json
import numpy as np
import pytest

ROOT=Path(__file__).resolve().parents[2]

def builder():
    path=ROOT/'scripts/skydata/acquire_solar24_destinations.py'
    assert path.exists(), 'Solar24 bounded source importer is not implemented'
    spec=importlib.util.spec_from_file_location('solar24_builder',path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module

def response(target='1 Ceres (20000001)',center='Sun (10)',frame='ICRF'):
    rows='\n'.join(f'{2460676.5+i/4}, A.D. 2025-Jan-01 00:00:00.0000, {i*i}, {i}, 0, {2*i/21600}, {1/21600}, 0,' for i in range(5))
    return json.dumps({'result':f'Target body name: {target}\nCenter body name: {center}\nReference frame : {frame}\nOutput units    : KM-S\nOutput type : GEOMETRIC cartesian states\n JDTDB, Calendar Date (TDB), X,Y,Z,VX,VY,VZ,\n$$SOE\n{rows}\n$$EOE'}).encode()

def test_exact_target_center_frame_admission():
    m=builder();values,headers=m.parse_vectors(response(),'Ceres')
    assert values.shape==(5,7);assert headers['target_id']=='20000001';assert headers['center_id']=='10'
    for raw in [response(target='4 Vesta (20000004)'),response(target='FakeCeres (20000001)'),response(center='Solar System Barycenter (0)'),response(frame='Ecliptic of J2000.0'),response().replace(b'JDTDB',b'JDUT'),response().replace(b'GEOMETRIC',b'APPARENT')]:
        with pytest.raises(ValueError):m.parse_vectors(raw,'Ceres')

def test_checked_daily_hermite_rejects_wrong_source_velocities():
    m=builder();values,_=m.parse_vectors(response(),'Ceres')
    knots,errors=m.daily_knots(values)
    assert knots.shape==(2,7);assert max(errors)<1e-10
    values[:,4]+=1
    with pytest.raises(ValueError,match='interpolation'):m.daily_knots(values)

def test_response_limit_rejects_without_reading_oversized_body():
    m=builder()
    class Response:
        headers={'Content-Length':'1000'}
        def read(self,*args):raise AssertionError('Oversized body must not be read')
    with pytest.raises(ValueError,match='budget'):m.bounded_body(Response(),10)

def test_source_designation_and_solution_must_match_sbdb():
    m=builder()
    for identity,target,solution in [('ceres','1 Ceres (A801 AA)','48'),('halley','1P/Halley','75'),('67p','67P/Churyumov-Gerasimenko','K284/1'),('borisov','Borisov (C/2019 Q4)','54')]:
        header=target+' {source: JPL#'+solution+'}'
        m.bind_solution({'target_header':header},m.DESTINATIONS[identity],solution)
        with pytest.raises(ValueError,match='solution'):
            m.bind_solution({'target_header':header},m.DESTINATIONS[identity],'wrong')
    for identity,target,solution in [('ceres','2 Ceres (A801 AA)','48'),('halley','2P/Halley','75'),('67p','68P/Churyumov-Gerasimenko','K284/1'),('borisov','Borisov (C/2020 Q4)','54')]:
        with pytest.raises(ValueError,match='designation'):
            m.bind_solution({'target_header':target+' {source: JPL#'+solution+'}'},m.DESTINATIONS[identity],solution)

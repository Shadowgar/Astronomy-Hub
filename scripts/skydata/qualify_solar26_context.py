#!/usr/bin/env python3
"""Bounded reference qualification, never a runtime provider or source-pack edit.

Reuses the qualified Solar 2.5 acquisition client in a distinct cache with a
32 MiB aggregate ceiling. Only two tiny mission-native Horizons requests are
needed; their exact request bodies and response hashes remain in that cache.
CSPICE is an existing offline tool, not a backend runtime dependency.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
import spiceypy as spice

from backend.app.services import mission_exploration

ROOT = Path(__file__).resolve().parents[2]


def qualify(cache):
    path = ROOT / 'scripts/skydata/acquire_solar25_missions.py'
    spec = importlib.util.spec_from_file_location('solar25_reference_source', path)
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    acquisition = builder.Acquisition(cache=cache, limit=32 * 1024 * 1024)
    leap_seconds = ROOT / 'data/source-cache/solar25-missions/naif0012.tls'
    spice.furnsh(str(leap_seconds))
    comparisons = []
    try:
        for identity, naif, date, observed in [('voyager1', '-31', '2012-08-25', 121.6), ('voyager2', '-32', '2018-11-05', 119.)]:
            epochs = [date + 'T' + time + 'Z' for time in ('00:00:00', '12:00:00', '23:59:59')]
            states = [mission_exploration.mission_state(identity, epoch) for epoch in epochs]
            provider = builder.HorizonsProvider(acquisition, naif, [])
            reference = provider.evaluate([row['jd_tdb'] for row in states])
            for state, native in zip(states, reference):
                p = np.asarray(state['craft']['position']) * mission_exploration.AU_KM
                v = np.asarray(state['craft']['velocity']) * mission_exploration.AU_KM
                position_error = float(np.linalg.norm(p - native['craft'][:3]))
                velocity_error = float(np.linalg.norm(v - native['craft'][3:]))
                time_error = abs((state['jd_tdb'] - 2451545.) * 86400 - spice.str2et(state['epoch']))
                assert position_error < .01, (identity, position_error)
                assert velocity_error < 1e-7, (identity, velocity_error)
                assert time_error < .00005, (identity, time_error)
                comparisons.append(dict(mission_id=identity, naif_id=naif, epoch=state['epoch'], jd_tdb=state['jd_tdb'],
                                        position_au=state['craft']['position'], velocity_au_s=state['craft']['velocity'],
                                        source_radius_au=float(np.linalg.norm(p) / mission_exploration.AU_KM),
                                        observed_approximate_radius_au=observed, quality=state['quality'], source_label=state['source_label'],
                                        position_error_km=position_error, velocity_error_km_s=velocity_error, utc_tdb_difference_seconds=time_error,
                                        reference_headers=provider.headers))
        rotation = spice.pxform('ECLIPJ2000', 'J2000', 0.)
        epsilon = np.deg2rad(84381.448 / 3600.)
        explicit = np.array([[1., 0., 0.], [0., np.cos(epsilon), -np.sin(epsilon)], [0., np.sin(epsilon), np.cos(epsilon)]])
        error = float(np.max(np.abs(rotation - explicit)))
        assert error < 2e-15
        return dict(schema='oras.beyond-reference-qualification.v1', generated_at=datetime.now(timezone.utc).isoformat(),
                    mission_manifest_sha256=mission_exploration.RELEASE_SHA256,
                    frame='ICRF', origin='Sun (NAIF 10)', corrections='NONE', units='km, km/s', time_scale='TDB',
                    comparisons=comparisons, thresholds=dict(position_km=.01, velocity_km_s=1e-7, utc_tdb_seconds=.00005),
                    ecliptic_direction_reference=dict(toolkit=spice.tkvrsn('TOOLKIT'), from_frame='ECLIPJ2000', to_frame='J2000', et=0.,
                                                     matrix_rows=rotation.tolist(), obliquity_arcsec=84381.448, max_element_difference=error,
                                                     interpretation='Angular directions only; no IBEX distance inversion. J2000/ICRF nomenclature follows NAIF.'),
                    leap_seconds_reference=dict(file='naif0012.tls', sha256=hashlib.sha256(leap_seconds.read_bytes()).hexdigest(),
                                                url='https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls'),
                    source_bytes=acquisition.bytes, source_budget_bytes=32 * 1024 * 1024, source_receipts=acquisition.sources,
                    limitations=['Fresh Horizons responses verify interpolation against the same mission-native prediction, not against new spacecraft tracking or an independent physical orbit solution.',
                                 'Noon represents a day-precision crossing date; it is not a measured crossing instant.',
                                 'Published approximate radii are retained as observations, never used to rescale the source vectors.'])
    finally:
        spice.unload(str(leap_seconds))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, default=ROOT / 'data/source-cache/solar26-context')
    parser.add_argument('--report', type=Path, default=ROOT / 'docs/validation/solar-system-2.6/context-reference-checks.json')
    args = parser.parse_args()
    report = qualify(args.cache)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, allow_nan=False) + '\n')
    print(json.dumps(dict(comparisons=len(report['comparisons']), source_bytes=report['source_bytes'],
                          maximum_position_error_km=max(row['position_error_km'] for row in report['comparisons']),
                          maximum_velocity_error_km_s=max(row['velocity_error_km_s'] for row in report['comparisons']),
                          maximum_utc_tdb_difference_seconds=max(row['utc_tdb_difference_seconds'] for row in report['comparisons']))))


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Independent numerical review; run inside the source-matched backend container.

This verifies frame conversion/interpolation, not physical EOP accuracy or GPU
pixels. No downloads, fixture substitution, runtime mutation or source edits.
"""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import skyfield
from skyfield.api import load
from skyfield.framelib import itrs
from backend.app.services.solar_earth_frame import earth_orientation
from backend.app.services.solar_motion import _window


def rotation_matrix(q):
    x, y, z, w = q
    return np.array([
        [1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
        [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
        [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)],
    ])


def main():
    timescale = load.timescale(builtin=True)
    rows = []
    total = 0
    max_matrix_error = max_determinant_error = max_norm_error = 0.0
    for iso in [
        '1849-12-26T00:00:00+00:00', '1972-06-30T23:59:59.999+00:00',
        '2000-01-01T12:00:00+00:00', '2016-12-31T23:59:59.500+00:00',
        '2017-01-01T00:00:00+00:00', '2026-10-28T12:00:00+00:00',
        '2150-01-22T00:00:00+00:00',
    ]:
        epoch = datetime.fromisoformat(iso)
        stamps = _window(
            SimpleNamespace(timescale=timescale), epoch,
            datetime(1849, 12, 26, tzinfo=timezone.utc),
            datetime(2150, 1, 22, tzinfo=timezone.utc),
        )
        checks = [a+(b-a)*f for a, b in zip(stamps, stamps[1:]) for f in [.25, .5, .75]]
        result = earth_orientation(stamps, timescale.from_datetimes(stamps), timescale.from_datetimes(checks))
        for stamp, sample in zip(stamps, result['samples']):
            direct = itrs.rotation_at(timescale.from_datetime(stamp))
            quaternion = sample['quaternion']
            reconstructed = rotation_matrix(quaternion)
            difference = float(np.max(np.abs(reconstructed-direct)))
            determinant_error = abs(float(np.linalg.det(reconstructed))-1)
            assert difference < 2e-14
            assert determinant_error < 2e-14
            max_matrix_error = max(max_matrix_error, difference)
            max_determinant_error = max(max_determinant_error, determinant_error)
            max_norm_error = max(max_norm_error, abs(float(np.linalg.norm(quaternion))-1))
            total += 1
        rows.append({
            'epoch': iso, 'samples': len(stamps),
            'start': result['samples'][0]['epoch'], 'end': result['samples'][-1]['epoch'],
            'maxSampledInterpolationErrorArcsec': result['max_sampled_interpolation_error_arcsec'],
        })
    paths = [
        'backend/app/services/solar_earth_frame.py',
        'backend/app/services/solar_motion.py',
        'backend/app/schemas/solar_exploration.py',
    ]
    print(json.dumps({
        'status': 'PASS', 'skyfieldVersion': skyfield.__version__, 'rotations': total,
        'maxMatrixError': max_matrix_error, 'maxDeterminantError': max_determinant_error,
        'maxQuaternionNormError': max_norm_error, 'polarMotionTableInstalled': timescale.polar_motion_table is not None,
        'windows': rows,
        'reviewedBackendFiles': {name: hashlib.sha256(Path(name).read_bytes()).hexdigest() for name in paths},
        'scope': 'Numerical source frame/interpolation. No physical EOP accuracy, browser, device or owner-acceptance claim.',
    }, indent=2))


if __name__ == '__main__':
    main()

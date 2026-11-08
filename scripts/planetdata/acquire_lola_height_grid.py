#!/usr/bin/env python3
"""Acquire/verify the original bounded LOLA LDEM_4 grid; never edit the Moon pack."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import urllib.request

from acquire_solar_visual_assets import atomic_write, checked

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'frontend/public/solar-assets/lunar-height-v1'


def verify(directory):
    manifest = json.loads((ASSETS / 'manifest.json').read_text())
    for record in manifest['files']:
        checked((directory / record['file']).read_bytes(), record)
    raw = (directory / 'ldem_4.img').read_bytes()
    samples = struct.unpack('<1036800h', raw)
    assert [min(samples) * .5, max(samples) * .5] == manifest['sourceActualElevationRangeMeters']
    label = (directory / 'ldem_4.lbl').read_text()
    for contract in ['MEAN EARTH/POLAR AXIS OF DE421', 'LSB_INTEGER', '0.5', '1737400.', '1440', '720']:
        if contract not in label:
            raise ValueError('Source label contract changed: ' + contract)
    print(f'PASS LOLA LDEM_4 V3.0: {len(samples)} signed16 samples; elevation {min(samples)*.5}..{max(samples)*.5} m; original DE421 ME frame and label')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--output', type=Path, default=ASSETS)
    args = parser.parse_args()
    manifest = json.loads((ASSETS / 'manifest.json').read_text())
    for record in manifest['files']:
        path = args.output / record['file']
        if not path.exists():
            if not args.fetch:
                raise FileNotFoundError(f'{path}; use --fetch to acquire pinned original data')
            with urllib.request.urlopen(record['sourceUrl'], timeout=45) as response:
                data = checked(response.read(record['bytes'] + 1), record)
            atomic_write(path, data)
    verify(args.output)

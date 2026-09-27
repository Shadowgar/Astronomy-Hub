"""Reuse names attached to HIP IDs in the existing owned SWE baseline tiles.

This is an identity/alias supplement, not an astrometric or photometric catalog.
No network request or manually maintained star-name registry is involved.
"""
from functools import lru_cache
import hashlib
from pathlib import Path
import struct
import zlib

DEFAULT_STARS = Path(__file__).resolve().parents[2] / 'frontend/public/oras-sky-engine/skydata/stars'


@lru_cache(maxsize=4)
def existing_native_names(root: Path = DEFAULT_STARS) -> dict[str, dict]:
    names = {}
    paths = sorted(root.glob('Norder0/Dir*/*.eph'))
    if len(paths) != 12:
        raise ValueError('existing baseline star names require all twelve order-0 EPHE tiles')
    for path in paths:
        data = path.read_bytes()
        if data[:4] != b'EPHE':
            raise ValueError(f'invalid baseline name tile: {path}')
        digest = hashlib.sha256(data).hexdigest()
        offset = 8
        while offset < len(data):
            kind, size = struct.unpack_from('<4si', data, offset)
            payload = data[offset+8:offset+8+size]
            offset += size+12
            if kind != b'STAR':
                continue
            flags, row_size, column_count, row_count = struct.unpack_from('<iiii', payload, 12)
            columns = {}
            for index in range(column_count):
                name, dtype, unit, pos, width = struct.unpack_from('<4s4siii', payload, 28+index*20)
                columns[name.rstrip(b'\0').decode()] = (pos, width, dtype.rstrip(b'\0'))
            if flags not in (0, 1) or columns.get('hip', (0, 0, b''))[1:] != (4, b'i') or columns.get('ids', (0, 0, b''))[2] != b's':
                raise ValueError('unsupported existing baseline STAR name schema')
            start = 28 + column_count*20
            size, compressed = struct.unpack_from('<ii', payload, start)
            rows = zlib.decompress(payload[start+8:start+8+compressed])
            if len(rows) != size or size != row_count*row_size:
                raise ValueError('invalid baseline STAR row size')
            if flags & 1:
                rows = bytes(rows[column*row_count+row] for row in range(row_count) for column in range(row_size))
            for index in range(row_count):
                row = rows[index*row_size:(index+1)*row_size]
                hip = struct.unpack_from('<i', row, columns['hip'][0])[0]
                pos, width, _ = columns['ids']
                aliases = [s for s in row[pos:pos+width].split(b'\0')[0].decode('utf-8').split('|') if s]
                common = [s.removeprefix('NAME ') for s in aliases if s.removeprefix('NAME ') and s.removeprefix('NAME ')[0].isalpha() and not any(c.isdigit() for c in s)]
                if hip and common:
                    names[str(hip)] = {'common_names': common, 'aliases': aliases,
                        'source_attribution': {'source_key': 'swe_existing_star_names',
                            'name': 'Existing owned Stellarium Web Engine baseline HIP aliases',
                            'source_url': '/oras-sky-engine/skydata/stars/' + path.relative_to(root).as_posix(),
                            'sha256': digest, 'license_note': 'Existing vendored SWE baseline data attribution applies.'}}
    return names


def attach_existing_names(record: dict) -> dict:
    from backend.app.services.star_science import parse_hip_number
    entry = existing_native_names().get(str(parse_hip_number(record)))
    if not entry:
        return record
    common = entry['common_names']
    record['common_names'] = list(common)
    record['names'] = list(dict.fromkeys([*common, *(record.get('names') or [])]))
    record['aliases'] = list(dict.fromkeys([*('NAME '+name for name in common), *entry['aliases'], *(record.get('aliases') or [])]))
    record['display_name'] = common[0]
    record['source_attribution'] = [*(record.get('source_attribution') or []), entry['source_attribution']]
    return record

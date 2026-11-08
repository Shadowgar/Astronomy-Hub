"""Acquire unmodified, digest-pinned NAIF kernels into a read-only runtime mount.

Run explicitly; the API never downloads kernels. No bulk data belongs in images.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import tempfile
from urllib.request import urlopen

NAIF = 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/'
LUNAR_FILES = {
    'moon_de440_250416.tf': (NAIF + 'fk/satellites/moon_de440_250416.tf', 'a47c71e9c9f33796bdafb2c9d69a7ee447b6016ecad80f71cd6f3e479f9cf768'),
    'moon_pa_de440_200625.bpc': (NAIF + 'pck/moon_pa_de440_200625.bpc', '60cd55aa401ea2ea97360636f567554bfe4e37bb829f901b4460a455dfaf783f'),
    'pck00011.tpc': (NAIF + 'pck/pck00011.tpc', '3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1'),
}


def acquire(destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    for name, (url, digest) in LUNAR_FILES.items():
        target = destination / name
        if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest() == digest:
            continue
        # Validate in a temporary file; never publish a partial/unpinned kernel.
        with tempfile.NamedTemporaryFile(dir=destination, delete=False) as temporary:
            temporary_path = Path(temporary.name)
            try:
                with urlopen(url, timeout=60) as source:
                    while chunk := source.read(1024 * 1024):
                        temporary.write(chunk)
                temporary.flush()
                if hashlib.sha256(temporary_path.read_bytes()).hexdigest() != digest:
                    raise ValueError(f'Unexpected SHA256 for {name}')
                temporary_path.replace(target)
            finally:
                temporary_path.unlink(missing_ok=True)
        print(f'{name}: SHA256 {digest}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('data/runtime-packs/lunar-orientation/release'))
    acquire(parser.parse_args().output)

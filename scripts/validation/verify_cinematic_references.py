#!/usr/bin/env python3
"""Verify owner reference PNGs against the committed approval and archive manifest."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[2]
DIRECTORY = ROOT / 'docs/design/cinematic-references-2026-10-21'
ARCHIVE = ROOT / 'docs/design/Astronomy_Hub_Approved_Design_References_2026-10-21.zip'
ARCHIVE_SHA256 = '1d886cd105b8cc20da7c765057e1594b5c15895bbbce87e0946a20b65cd8abe2'


def verify():
    assert hashlib.sha256(ARCHIVE.read_bytes()).hexdigest() == ARCHIVE_SHA256
    approval = (ROOT / 'docs/design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md').read_text()
    with zipfile.ZipFile(ARCHIVE) as archive:
        manifest_bytes = archive.read('manifest.json')
        assert (DIRECTORY / 'manifest.json').read_bytes() == manifest_bytes
        manifest = json.loads(manifest_bytes)
        assert set(manifest['includes']) == {'solar-primary-cinematic.png', 'solar-adaptive-explorer.png', 'earth-cinematic.png', 'sky-cinematic.png'}
        for name, record in manifest['includes'].items():
            data = (DIRECTORY / name).read_bytes()
            assert data == archive.read(name), name
            assert data.startswith(b'\x89PNG\r\n\x1a\n'), name
            assert len(data) == record['bytes'], name
            digest = hashlib.sha256(data).hexdigest()
            assert digest == record['sha256'] and digest in approval, name
            print(f'PASS: {name}: {len(data)} original bytes; SHA256 {digest}')
    print(f'PASS: archive SHA256 {ARCHIVE_SHA256}; four original images and manifest byte-identical.')


if __name__ == '__main__':
    verify()

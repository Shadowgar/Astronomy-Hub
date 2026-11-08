#!/usr/bin/env python3
"""Acquire explicit, hash-pinned official build inputs into a chosen directory.

No image pull, package installation, implicit cache or repository checkout access.
The Docker build consumes this directory plus Native.Dockerfile as its context.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import time
import urllib.request
from urllib.parse import urlsplit

MANIFEST = Path(__file__).with_name('toolchain.json')
MAX_BYTES = 10 * 1024 * 1024
SOCKET_TIMEOUT_SECONDS = 20
TRANSFER_SECONDS = 60


def _official_url(url: str) -> None:
    parsed = urlsplit(url)
    if (parsed.scheme != 'https' or parsed.hostname != 'archive.debian.org'
            or parsed.port not in (None, 443) or parsed.username or parsed.password):
        raise ValueError('Build inputs must use official Debian archive HTTPS URLs')


class OfficialRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        _official_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def _matches(path: Path, row: dict) -> bool:
    if not path.is_file() or path.stat().st_size != row['bytes']:
        return False
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(65536), b''):
            digest.update(block)
    return digest.hexdigest() == row['sha256']


def acquire(output_dir: Path, manifest_path: Path = MANIFEST) -> None:
    manifest = json.loads(manifest_path.read_text())
    rows = manifest.get('downloads')
    if manifest.get('schema') != 1 or not isinstance(rows, list) or not 1 <= len(rows) <= 8:
        raise ValueError('Invalid build-input manifest')
    filenames = set()
    for row in rows:
        filename = row['filename']
        if (not isinstance(filename, str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', filename)
                or filename in filenames):
            raise ValueError('Invalid or duplicate build-input filename')
        filenames.add(filename)
        if (type(row['bytes']) is not int or not 0 < row['bytes'] <= MAX_BYTES
                or not re.fullmatch(r'[0-9a-f]{64}', row['sha256'])):
            raise ValueError('Invalid build-input size or digest')
        _official_url(row['url'])

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    opener = urllib.request.build_opener(OfficialRedirect())
    for row in rows:
        target = output_dir / row['filename']
        if target.is_symlink():
            raise ValueError('Refusing a symlink build-input target')
        if target.exists():
            if not _matches(target, row):
                raise ValueError('Existing build input differs from the pinned package: ' + target.name)
            print('VERIFIED', target.name, row['sha256'], row['bytes'])
            continue
        temporary_path = None
        try:
            started = time.monotonic()
            digest = hashlib.sha256()
            count = 0
            with tempfile.NamedTemporaryFile(dir=output_dir, prefix='.acquire-', delete=False) as temporary:
                temporary_path = Path(temporary.name)
                with opener.open(row['url'], timeout=SOCKET_TIMEOUT_SECONDS) as response:
                    while True:
                        if time.monotonic() - started > TRANSFER_SECONDS:
                            raise TimeoutError('Build-input acquisition exceeded its transfer deadline')
                        block = response.read(min(65536, row['bytes'] - count + 1))
                        if not block:
                            break
                        count += len(block)
                        if count > row['bytes']:
                            raise ValueError('Build input exceeds its pinned size')
                        digest.update(block)
                        temporary.write(block)
                if count != row['bytes'] or digest.hexdigest() != row['sha256']:
                    raise ValueError('Acquired build input does not match its pinned size and SHA-256')
            # Do not overwrite an input another acquisition published meanwhile.
            os.link(temporary_path, target)
            print('ACQUIRED', target.name, row['sha256'], count)
        finally:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    acquire(args.output_dir)


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Stage a source-qualified current GP candidate; NEVER install or activate it.

Default: one bounded request to the official CelesTrak active GP endpoint. For
reproducibility, --input supports existing original 3LE bytes, but an offline
input is NOT claimed to have first-party transport provenance.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import urllib.request

SOURCE_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE'
LIMIT = 8 * 1024 * 1024
MAX_AGE = timedelta(days=14)
MAX_FUTURE = timedelta(days=1)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, url):
        return None


def fetch_once() -> tuple[bytes, dict]:
    # Stop after ANY transport, redirect, HTTP, content or validation failure.
    opener = urllib.request.build_opener(NoRedirect())
    request = urllib.request.Request(SOURCE_URL, headers={'User-Agent':'Astronomy-Hub/1.0 (bounded GP recovery; no retries)'})
    with opener.open(request, timeout=45) as reply:
        if reply.status != 200:
            raise ValueError(f'Unexpected GP HTTP status {reply.status}')
        announced = reply.headers.get('Content-Length')
        if announced and int(announced) > LIMIT:
            raise ValueError('Content-Length exceeds bounded source budget')
        raw = reply.read(LIMIT + 1)
        if not raw or len(raw) > LIMIT:
            raise ValueError('GP source is empty or exceeds bounded source budget')
        details = {'http_status': reply.status, 'http_date': reply.headers.get('Date'), 'source_url': SOURCE_URL}
    return raw, details


def checksum_valid(line: str) -> bool:
    if len(line) != 69 or not line[68].isdigit():
        return False
    total = sum(int(char) if char.isdigit() else 1 if char == '-' else 0 for char in line[:68])
    return total % 10 == int(line[68])


def tle_epoch(line: str) -> datetime:
    if len(line) != 69 or not line.startswith('1 '):
        raise ValueError('Invalid TLE line 1')
    yr = int(line[18:20]); day = float(line[20:32]); year = (1900 if yr >= 57 else 2000) + yr
    if not 1 <= day < 367:
        raise ValueError('TLE day-of-year outside bounds')
    epoch = datetime(year, 1, 1, tzinfo=timezone.utc) + timedelta(days=day - 1)
    if epoch.year != year:
        raise ValueError('Invalid TLE epoch')
    return epoch


def select_recent(original: bytes, now: datetime) -> tuple[bytes, dict]:
    if now.tzinfo is None:
        raise ValueError('UTC must be timezone-aware')
    if original[:512].lower().find(b'<html') >= 0:
        raise ValueError('GP source is an HTML response, not TLEs')
    try:
        source = original.decode('ascii')
    except UnicodeDecodeError as exc:
        raise ValueError('GP source must be ASCII TLE data') from exc
    lines = [line.strip() for line in source.splitlines() if line.strip()]
    if len(lines) % 3:
        raise ValueError('Incomplete three-line TLE record')
    picked, seen, skipped = [], set(), 0
    newest = None
    for index in range(0, len(lines), 3):
        name, first, second = lines[index:index+3]
        norad = first[2:7]
        if not name or not first.startswith('1 ') or not second.startswith('2 '):
            raise ValueError(f'Invalid three-line record {index//3}')
        if first[2:7] != second[2:7] or not norad.isdigit():
            raise ValueError(f'Conflicting NORAD identity in record {index//3}')
        if not checksum_valid(first) or not checksum_valid(second):
            raise ValueError(f'Invalid TLE checksum for {norad}')
        if norad in seen:
            raise ValueError(f'Duplicate NORAD identity {norad}')
        seen.add(norad)
        epoch = tle_epoch(first)
        newest = max(epoch, newest) if newest else epoch
        if now - epoch > MAX_AGE or epoch - now > MAX_FUTURE:
            skipped += 1
            continue
        picked += [name, first, second]
    return ('\n'.join(picked) + '\n').encode('ascii'), {
        'original_record_count': len(lines) // 3,
        'eligible_record_count': len(picked) // 3,
        'excluded_outside_14day_scope': skipped,
        'newest_source_epoch': newest.isoformat().replace('+00:00','Z') if newest else None,
        'scope': 'active five-digit TLEs; no 6-digit OMM identities',
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, help='Existing 3LE bytes for offline admission; transport provenance unverified')
    parser.add_argument('--output-dir', type=Path, required=True)
    parser.add_argument('--acquired-at', help='UTC receipt timestamp, default now')
    args = parser.parse_args()
    if args.output_dir.exists():
        parser.error('Output must be a new directory; refusing to overwrite any existing catalog')
    now = datetime.fromisoformat(args.acquired_at.replace('Z','+00:00')) if args.acquired_at else datetime.now(timezone.utc)
    if now.tzinfo is None:
        parser.error('Acquisition time must include timezone')
    now = now.astimezone(timezone.utc)
    raw, origin = ((args.input.read_bytes(), {'source_url': str(args.input), 'mode':'offline_existing_input_not_first_party_attested'})
                   if args.input else fetch_once())
    retained, counts = select_recent(raw, now)
    if counts['eligible_record_count'] < 1000:
        raise ValueError('Too few recent records for the full-catalog admission gate (1000)')
    args.output_dir.mkdir(parents=True, exist_ok=False)
    (args.output_dir/'original-active.tle').write_bytes(raw)
    (args.output_dir/'eligible-active.tle').write_bytes(retained)
    provenance = {**origin, **counts, 'acquired_at': now.isoformat().replace('+00:00','Z'),
                  'original_sha256': hashlib.sha256(raw).hexdigest(),
                  'eligible_sha256': hashlib.sha256(retained).hexdigest(),
                  'original_bytes':len(raw),'eligible_bytes':len(retained),
                  'promotion_authorized':False}
    (args.output_dir/'acquisition.json').write_text(json.dumps(provenance,indent=2)+'\n')
    builder = Path(__file__).with_name('build_oras_satellite_tle_release.py')
    cmd = [sys.executable,str(builder),'--input',str(args.output_dir/'eligible-active.tle'),
           '--output',str(args.output_dir/'release'),'--acquired-at',provenance['acquired_at'],
           '--minimum-count','1000','--source-url',SOURCE_URL]
    subprocess.run(cmd, check=True)
    subprocess.run([sys.executable,str(builder),'--validate-only','--output',str(args.output_dir/'release'),
                    '--minimum-count','1000'],check=True)
    print('CANDIDATE_ONLY_NO_PROMOTION',json.dumps(provenance,sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

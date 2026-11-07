"""Read-only pinned SBDB population release. No network or fabricated fallback."""
from functools import lru_cache
import hashlib
import json
import os
from pathlib import Path

from backend.app.schemas.solar_populations import PopulationPack

PINNED_MANIFEST_SHA256='fa410b5f343b9cf774993eac23851ca2b17b1f98726019b72a7bbd5933196fe1'
MAX_PACK_BYTES=24*1024*1024


class PopulationUnavailable(RuntimeError):
    pass


def release_dir():
    return Path(os.environ.get('ORAS_SOLAR_POPULATIONS_DIR','/runtime/solar-populations'))


@lru_cache(maxsize=2)
def load_population(directory):
    """Validate once per immutable read-only mount; never return raw exception text."""
    try:
        directory=Path(directory)
        with (directory/'manifest.json').open('rb') as source:manifest_raw=source.read(8193)
        if len(manifest_raw)>8192 or hashlib.sha256(manifest_raw).hexdigest()!=PINNED_MANIFEST_SHA256:raise ValueError('Unqualified population manifest')
        manifest=json.loads(manifest_raw)
        if manifest['schema']!='oras.solar-population-release.v1' or manifest['file']!='population.json' or not 0<manifest['bytes']<=MAX_PACK_BYTES:raise ValueError('Invalid population release')
        with (directory/'population.json').open('rb') as source:raw=source.read(MAX_PACK_BYTES+1)
        if len(raw)!=manifest['bytes'] or hashlib.sha256(raw).hexdigest()!=manifest['sha256']:raise ValueError('Population source identity mismatch')
        payload=json.loads(raw);model=PopulationPack.parse_obj(payload)
        if model.body_count!=manifest['body_count'] or model.release!=manifest['release']:raise ValueError('Population release metadata mismatch')
        payload['pack_sha256']=manifest['sha256']
        response=(json.dumps(payload,separators=(',',':'),allow_nan=False)+'\n').encode()
        return response,manifest['sha256']
    except (OSError,ValueError,KeyError,TypeError) as exc:
        raise PopulationUnavailable('Qualified local Solar population source is unavailable.') from exc


def population_response():
    return load_population(str(release_dir().resolve()))

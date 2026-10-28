"""Finite local SBDB snapshot; runtime never queries JPL or invents fallback data."""
from functools import lru_cache
from pathlib import Path
import hashlib
import json

PACK_PATH=Path(__file__).parents[1]/'data/solar_small_bodies.json'


@lru_cache(maxsize=1)
def small_body_pack():
    raw=PACK_PATH.read_bytes()
    pack=json.loads(raw)
    if pack.get('schema')!='oras.solar-small-bodies.v1' or len(pack.get('bodies',[]))!=2049:
        raise ValueError('Small-body source pack unavailable')
    return pack,hashlib.sha256(raw).hexdigest()

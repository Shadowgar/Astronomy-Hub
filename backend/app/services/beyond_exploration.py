"""Local, pinned observation products and separate historical Voyager events.

No network/provider polling, new propagation, rescaled spacecraft coordinates,
inferred heliopause inversion, or fabricated Oort Cloud catalog.
"""
from copy import deepcopy
from functools import lru_cache
import hashlib
import json
import math
import os
from pathlib import Path

from backend.app.schemas.beyond_exploration import BeyondContext, ObservationProduct
from backend.app.services import mission_exploration
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError

CONTEXT_FILE = Path(__file__).resolve().parents[1] / 'data/beyond_context.json'
PRODUCT_IDS = ('ibex-ena-map', 'imap-magnetic-field')
MAX_MANIFEST_BYTES = 128 * 1024
MAX_PRODUCT_BYTES = 8 * 1024 * 1024
RELEASE_SHA256 = '7157a049597f164fa0b4df34d72c483401d0f7aaac5f217f3c084cec0b28f037'


class ObservationUnavailableError(RuntimeError):
    pass


def release_dir():
    return Path(os.environ.get('ORAS_HELIOPHYSICS_DIR', 'data/runtime-packs/heliophysics/release-v1'))


def _fingerprint(path):
    stat = path.stat()
    return stat.st_ino, stat.st_size, stat.st_mtime_ns, stat.st_ctime_ns


def _read(path, limit):
    # Bound allocation before parsing even if the local source is replaced.
    with path.open('rb') as stream:
        raw = stream.read(limit + 1)
    if len(raw) > limit:
        raise ValueError('Source exceeds byte budget')
    return raw


def _digest(raw):
    return hashlib.sha256(raw).hexdigest()


@lru_cache(maxsize=2)
def _manifest(directory, fingerprint):
    raw = _read(Path(directory) / 'manifest.json', MAX_MANIFEST_BYTES)
    if not RELEASE_SHA256 or _digest(raw) != RELEASE_SHA256:
        raise ValueError('Unqualified observation manifest')
    doc = json.loads(raw)
    if (doc['schema'], doc['release_id']) != ('oras.heliophysics-pack.v1', 'solar26-observations-v1'):
        raise ValueError('Invalid observation release identity')
    if not set(doc['products']).issubset(PRODUCT_IDS):
        raise ValueError('Unknown observation product')
    return doc


@lru_cache(maxsize=4)
def _product(directory, identity, filename, manifest_fingerprint, product_fingerprint):
    doc = _manifest(directory, manifest_fingerprint)
    entry = doc['products'][identity]
    if entry['file'] != filename or not 0 < entry['bytes'] <= MAX_PRODUCT_BYTES:
        raise ValueError('Unqualified observation file')
    raw = _read(Path(directory) / filename, entry['bytes'])
    if len(raw) != entry['bytes'] or _digest(raw) != entry['sha256']:
        raise ValueError('Changed observation product')
    product = ObservationProduct.parse_raw(raw)
    if product.id != identity or product.metadata.dict() != entry['metadata']:
        raise ValueError('Observation metadata or identity differs')
    return product


def observation_product(identity, directory=None):
    # Request text only selects trusted constants; neither filesystem sink
    # receives a path component derived from the original request string.
    if identity == 'ibex-ena-map':
        product_id, filename = 'ibex-ena-map', 'ibex-ena-map.json'
    elif identity == 'imap-magnetic-field':
        product_id, filename = 'imap-magnetic-field', 'imap-magnetic-field.json'
    else:
        raise KeyError('Unknown observation product')
    path = Path(directory) if directory is not None else release_dir()
    try:
        return _product(str(path), product_id, filename, _fingerprint(path / 'manifest.json'), _fingerprint(path / filename)).dict(by_alias=True)
    except (OSError, ValueError, KeyError, TypeError, OverflowError) as exc:
        raise ObservationUnavailableError('Local qualified observation unavailable') from exc


def observation_catalog(directory=None):
    entries = []
    for identity in PRODUCT_IDS:
        try:
            product = observation_product(identity, directory)
            entries.append(dict(id=identity, status='qualified', reason='Pinned local scientific product; no live telemetry or external polling.', metadata=product['metadata']))
        except ObservationUnavailableError:
            entries.append(dict(id=identity, status='unavailable', reason='The qualified local observation source is absent or failed integrity validation.', metadata=None))
    return entries


def _crossing_geometry(identity, epoch):
    state = mission_exploration.mission_state(identity, epoch)
    if (state['frame'], state['origin'], state['position_units'], state['velocity_units'], state['quality']) != ('ICRF', 'sun', 'AU', 'AU/s', 'predicted'):
        raise ValueError('Historical source semantics changed; requalification required')
    position = state['craft']['position']
    radius = math.hypot(*position)
    return dict(epoch=state['epoch'], jd_tdb=state['jd_tdb'], naif_id=state['craft']['naif_id'], frame=state['frame'], origin=state['origin'],
                position=position, velocity=state['craft']['velocity'], position_units=state['position_units'], velocity_units=state['velocity_units'],
                distance_au=radius, sun_direction=[-p / radius for p in position], quality=state['quality'], source_label=state['source_label'],
                source_manifest_sha256=mission_exploration.RELEASE_SHA256, physical_uncertainty=state['interpolation']['physical_uncertainty'])


def beyond_context():
    context = deepcopy(json.loads(_read(CONTEXT_FILE, MAX_MANIFEST_BYTES)))
    for crossing in context['crossings']:
        epoch = crossing['observed']['date'] + 'T12:00:00Z'
        try:
            crossing['geometry'] = _crossing_geometry(crossing['mission_id'], epoch)
            crossing['position_status'] = 'qualified'
            crossing['position_unavailable_reason'] = None
        except (EphemerisUnavailableError, ValueError, ZeroDivisionError) as exc:
            # The published event remains valid when a local vector pack fails.
            crossing['geometry'] = None
            crossing['position_status'] = 'unavailable'
            crossing['position_unavailable_reason'] = 'The qualified historical mission source is unavailable; no substitute position is shown.'
    context['observations'] = observation_catalog()
    return BeyondContext(**context).dict(by_alias=True)

#!/usr/bin/env python3
"""Reproduce bounded Solar 2.4 derivatives from digest-pinned NASA/PDS originals.

Offline by default; --fetch reads only pinned allowlisted source files. Requires
Pillow 11.3.0 and spiceypy 8.0.0 (Vesta DSK decoding only; no runtime dependency).
"""
import argparse
import hashlib
import io
import json
import math
from pathlib import Path
import re
import struct
import urllib.parse
import urllib.request
from PIL import Image
from build_solar22_textures import compact_glb, jpeg, parse_glb
from build_solar23_assets import encode_glb

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'output/playwright/solar-system-2.4/source-cache'
OUTPUT = ROOT / 'frontend/public/solar-assets/v2.4'
BASE = '/solar-assets/v2.4/'
SINGLE_CAP, RAW_CAP, PACK_CAP = 64 * 1024**2, 256 * 1024**2, 96 * 1024**2
NASA_TERMS = 'https://www.nasa.gov/nasa-brand-center/images-and-media/'
PDS_TERMS = 'https://pds-ppi.igpp.ucla.edu/faq.jsp'
# Rejected-for-runtime VTAD Pluto/Charon/Vesta originals are still acquisition
# bytes. They are never used as substitutes for registered maps/measured shapes.
RESEARCH_RAW_BYTES = 7009348 + 473760 + 5073448
IDS = {'pluto':'999','charon':'901','ceres':'20000001','vesta':'20000004','eros':'20000433','67p':'1000012','halley':'1000036'}
GRIDS = {'pluto': {'radiusKm': 1188.3, 'width': 24888, 'height': 12444, 'centerLongitudeDegrees': 180., 'upperLeftMeters': [-3733200, 1866600]},
         'charon': {'radiusKm': 606., 'width': 12693, 'height': 6347, 'centerLongitudeDegrees': 0., 'upperLeftMeters': [-1904100, 952200]}}

SOURCES = [{'id': 'pluto',
  'file': 'pluto-pds-mosaic.jpg',
  'download': 'https://pds-smallbodies.astro.umd.edu/holdings/pds4-nh_derived-v4.0/plutosystem_geophysics/browse/nh_pluto_mosaic.jpg',
  'bytes': 65903048,
  'sha256': 'f7c7512d99d0053fabf72ed60fa02040dd8eac98fc52fa08a62d9cabcf07edf4',
  'acquiredUTC': '2026-11-03T14:08:15.386167+00:00'},
 {'id': 'charon',
  'file': 'charon-pds-mosaic.jpg',
  'download': 'https://pds-smallbodies.astro.umd.edu/holdings/pds4-nh_derived-v4.0/plutosystem_geophysics/browse/nh_charon_mosaic.jpg',
  'bytes': 17422962,
  'sha256': 'd14c636ac2c618a33a2b6d24223113f4383320bdc460da3c6bf2f64bcd7998b2',
  'acquiredUTC': '2026-11-03T14:08:17.611050+00:00'},
 {'id': '67p',
  'file': '67p-shap4s-100k.wrl',
  'download': 'https://archives.esac.esa.int/psa/ftp/INTERNATIONAL-ROSETTA-MISSION/SHAPE/RO-C-MULTI-5-67P-SHAPE-V2.0/DATA/TRIPLATE/SPG_DLR/SHAP4S/CG_DLR_SPG_SHAP4S_100K.WRL',
  'bytes': 9001560,
  'sha256': 'd37a7db508d369a2df71d2801c777c9662c7ea9f6a7e1765655e48cab1711728',
  'acquiredUTC': '2026-11-03T14:08:26.735926+00:00'},
 {'id': 'eros',
  'file': 'eros-ver64q.tab',
  'download': 'https://sbnarchive.psi.edu/pds4/non_mission/gaskell.ast-eros.shape-model/data/vertex/ver64q.tab',
  'bytes': 4246671,
  'sha256': 'de97008ff2c865039a51aa29ec13441ac3c87bd5cb27879091cb488c74fcb6dd',
  'acquiredUTC': '2026-11-03T14:08:27.697502+00:00'},
 {'id': 'vesta',
  'file': 'dawn_vesta_grv_icq0128_v1.bds',
  'download': 'https://naif.jpl.nasa.gov/pub/naif/DAWN/kernels/dsk/dawn_vesta_grv_icq0128_v1.bds',
  'bytes': 9038848,
  'sha256': 'c7f75ea3d2ea671e76ff5e523b5f648c1e12360b5a37912d2a7522e0273fe4ad',
  'acquiredUTC': '2026-11-03T14:11:27.108538+00:00'},
 {'id': 'ceres',
  'file': 'ceres-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/c/Ceres_1_1000.glb',
  'bytes': 9529028,
  'sha256': 'c43ec43aa8fb90aa8cf30660c2f2853cfac408d38149d1dc470490f4f4aa9899',
  'acquiredUTC': '2026-11-03T14:05:56.795928+00:00'}]


SOURCES.append({'id': 'halley',
 'file': 'halley-stooke.tab',
 'download': 'https://sbnarchive.psi.edu/pds4/non_mission/small_bodies.stooke.shape-models/data/1682q1halley.tab',
 'bytes': 70226,
 'sha256': 'e9437ac850060a4c527d1045e028ac28f58bfe0386fc1da0bf50405b8128b824',
 'acquiredUTC': '2026-11-07T04:48:13.670546+00:00'})

DOCUMENTS = [{'file': 'nh-pluto-label.html',
  'download': 'https://pds-smallbodies.astro.umd.edu/holdings/pds4-nh_derived-v4.0/plutosystem_geophysics/mosaic/nh_pluto_mosaic.lblx',
  'bytes': 11248,
  'sha256': '53e27d51084faa3861cccc5581b34b74f00fbee6dc533f2d96389279b8259bb3',
  'acquiredUTC': '2026-11-03T14:07:51.862493+00:00'},
 {'file': 'nh-charon-label.html',
  'download': 'https://pds-smallbodies.astro.umd.edu/holdings/pds4-nh_derived-v4.0/plutosystem_geophysics/mosaic/nh_charon_mosaic.lblx',
  'bytes': 11214,
  'sha256': '012d05955fb10f2d6bb9b2d6675594a07daa31b5ed30caae7db9af2781b44a3b',
  'acquiredUTC': '2026-11-03T14:08:28.002558+00:00'},
 {'file': 'eros-units.html',
  'download': 'https://sbnarchive.psi.edu/pds3/near/NEAR_A_MSI_5_EROSSHAPE_V1_0/data/vertex/ver64q.lbl',
  'bytes': 9920,
  'sha256': '7dd889cd67019738d2bcfa15eb36b64f61269ab154a450fd7ce4c2bd2544ddd9',
  'acquiredUTC': '2026-11-03T14:09:44.962858+00:00'},
 {'file': 'eros_alex.tpc.txt',
  'download': 'https://sbnarchive.psi.edu/pds4/non_mission/gaskell.ast-eros.shape-model/document/eros_alex.tpc.txt',
  'bytes': 1353,
  'sha256': '0b410adcbd14bc6f678781524050b979714c7f64acd8693786f35acaa1363673',
  'acquiredUTC': '2026-11-03T14:08:27.892558+00:00'},
 {'file': '67p-label.html',
  'download': 'https://archives.esac.esa.int/psa/ftp/INTERNATIONAL-ROSETTA-MISSION/SHAPE/RO-C-MULTI-5-67P-SHAPE-V2.0/DATA/TRIPLATE/SPG_DLR/SHAP4S/CG_DLR_SPG_SHAP4S_100K.LBL',
  'bytes': 12080,
  'sha256': '1e4980049f492f28609968ae7d99d90755e6975a311e5914916196bbcdd644a7',
  'acquiredUTC': '2026-11-03T14:07:38.422477+00:00'},
 {'file': 'nh-overview.docx',
  'download': 'https://pds-smallbodies.astro.umd.edu/holdings/pds4-nh_derived-v4.0/plutosystem_geophysics/overview.docx',
  'bytes': 22058,
  'sha256': '078038a20cf3c18555ed7edf07fd37cce838b144dae40e8d56fd7ca8a0e60ec8',
  'acquiredUTC': '2026-11-03T14:10:35.292975+00:00'}]

DOCUMENTS.extend([{'file': 'halley-stooke.xml',
  'download': 'https://sbnarchive.psi.edu/pds4/non_mission/small_bodies.stooke.shape-models/data/1682q1halley.xml',
  'bytes': 9520,
  'sha256': '3f8d349a7328bb6683d94ddc6d0df80c798bae89b8d009797c1fb83c60bca9a7',
  'acquiredUTC': '2026-11-07T04:48:13.967231+00:00'},
 {'file': 'halley-description.txt',
  'download': 'https://sbnarchive.psi.edu/pds4/non_mission/small_bodies.stooke.shape-models/document/bundle_description.txt',
  'bytes': 5105,
  'sha256': 'edb4b13a8da09a0dbe1321c7cae338e3ed1c5909ebe627fba996407c4adf50f2',
  'acquiredUTC': '2026-11-07T04:48:14.407035+00:00'}])

def sha(data):
    return hashlib.sha256(data).hexdigest()


def admitted(source, cache, fetch=False):
    path = cache / source['file']
    if path.exists():
        data = path.read_bytes()
    elif fetch:
        allowed = {'assets.science.nasa.gov', 'pds-smallbodies.astro.umd.edu',
                   'sbnarchive.psi.edu', 'archives.esac.esa.int', 'naif.jpl.nasa.gov'}
        if urllib.parse.urlparse(source['download']).hostname not in allowed:
            raise ValueError('Unapproved source host')
        request = urllib.request.Request(source['download'], headers={'User-Agent': 'AstronomyHub-source-qualification/2.4'})
        with urllib.request.urlopen(request, timeout=60) as response:
            if response.status != 200 or urllib.parse.urlparse(response.url).hostname not in allowed:
                raise ValueError('Unexpected source response')
            if int(response.headers.get('Content-Length', 0)) > SINGLE_CAP:
                raise ValueError('Single source budget exceeded')
            data = response.read(SINGLE_CAP + 1)
        if len(data) != source['bytes'] or sha(data) != source['sha256']:
            raise ValueError('Pinned source bytes or hash mismatch')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    else:
        raise FileNotFoundError(f'{path}: use --fetch to acquire pinned originals')
    if len(data) > SINGLE_CAP or len(data) != source['bytes'] or sha(data) != source['sha256']:
        raise ValueError('Pinned source bytes or hash mismatch')
    return data


def emit(output, name, data, dimensions=None):
    path = output / name
    if path.exists() and path.read_bytes() != data:
        raise ValueError(f'Refusing to overwrite a different derivative: {path}')
    path.write_bytes(data)
    result = {'file': name, 'url': BASE + name, 'bytes': len(data), 'sha256': sha(data)}
    if dimensions:
        w, h = dimensions
        result.update(width=w, height=h, gpuRgba8WithMipmapsBytes=(w*h*16+2)//3)
    return result


def source_shape(raw, body, path=None):
    if body == 'halley':
        grid = {(lat, lon): radius for lon, lat, radius in
                (map(float, line.split()) for line in raw.decode('ascii').splitlines())}
        if len(grid) != 37*73:
            raise ValueError('Invalid Halley grid')
        # PDS decimal conversion leaves <=1 mm redundant pole/seam differences.
        # Retain the actual longitude-zero sample; never average or add relief.
        for lat in range(-90, 91, 5):
            if abs(grid[lat, 0]-grid[lat, 360]) > .0000011:
                raise ValueError('Unexpected Halley seam discrepancy')
        for lat in (-90, 90):
            if any(abs(grid[lat, lon]-grid[lat, 0]) > .0000011 for lon in range(0, 361, 5)):
                raise ValueError('Unexpected Halley pole discrepancy')
        vertices = [(0., 0., -grid[-90, 0])]
        for lat in range(-85, 90, 5):
            for lon in range(0, 360, 5):
                p, t, r = math.radians(lat), math.radians(lon), grid[lat, lon]
                vertices.append((r*math.cos(p)*math.cos(t), r*math.cos(p)*math.sin(t), r*math.sin(p)))
        vertices.append((0., 0., grid[90, 0]))
        faces = []
        for lon in range(72):
            a, b = 1+lon, 1+(lon+1) % 72
            faces.append((0, b, a))
            for ring in range(34):
                a, b = 1+ring*72+lon, 1+ring*72+(lon+1) % 72
                faces.extend(((a, b, b+72), (a, b+72, a+72)))
            a, b = 1+34*72+lon, 1+34*72+(lon+1) % 72
            faces.append((a, b, len(vertices)-1))
        return vertices, faces, {'frame': 'Stooke/Abergel Halley long-axis reference frame; north toward big end',
                                 'orientationAtEpochQualified': False,
                                 'topology': 'derived triangulation of original 5-degree radius grid; no interpolated radius',
                                 'boundaryTreatment': 'redundant poles/seam share longitude-zero radius; maximum source rounding discrepancy 0.000001 km',
                                 'absoluteUncertaintyKm': [.5, 1.]}
    if body == 'eros':
        rows = [r.split() for r in raw.decode('ascii').splitlines()]
        nv, nf = map(int, rows[0])
        if len(rows) != 1+nv+nf:
            raise ValueError('Invalid Eros vertex/facet counts')
        vertices = [tuple(map(float, r[1:])) for r in rows[1:nv+1]]
        faces = [tuple(int(v)-1 for v in r[1:]) for r in rows[nv+1:]]
        return vertices, faces, {'frame': 'Eros source eros_alex.tpc body frame',
                                 'expectedOrientationFrame': 'PDS_GASKELL_EROS',
                                 'expectedOrientationModelId': 'pds-gaskell-eros-alex',
                                 'orientationModelSha256': '0b410adcbd14bc6f678781524050b979714c7f64acd8693786f35acaa1363673',
                                 'sourceFrameEvaluationQualified': True,
                                 'contemporaryMeridianObservationallyQualified': False}
    if body == '67p':
        text = raw.decode('ascii')
        if not re.search(r'scale\s+1\s+1\s+1', text) or not re.search(r'translation\s+0\s+0\s+0', text):
            raise ValueError('Unexpected WRL source transform')
        coordinates = re.search(r'point\s*\[([^]]+)\]', text, re.S)
        indices = re.search(r'coordIndex\s*\[([^]]+)\]', text, re.S)
        if not coordinates or not indices:
            raise ValueError('Missing WRL geometry')
        values = [float(v) for v in re.findall(r'[-+]?\d+(?:\.\d*)?(?:[eE][-+]?\d+)?', coordinates[1])]
        vertices = list(zip(values[0::3], values[1::3], values[2::3]))
        values = list(map(int, re.findall(r'-?\d+', indices[1])))
        if len(values) % 4 or set(values[3::4]) != {-1}:
            raise ValueError('Nontriangular WRL source')
        faces = [tuple(values[i:i+3]) for i in range(0, len(values), 4)]
        if (len(vertices), len(faces)) != (49993, 99990):
            raise ValueError('Unexpected SHAP4S resolution')
        return vertices, faces, {'frame': 'CHEOPS_REF_FRAME_V1',
                                 'orientationAtEpochQualified': False}
    if body == 'vesta':
        import spiceypy as spice
        handle = spice.dasopr(str(path))
        try:
            descriptor = spice.dlabfs(handle)
            dsk = spice.dskgd(handle, descriptor)
            nv, nf = spice.dskz02(handle, descriptor)
            vertices = spice.dskv02(handle, descriptor, 1, nv).tolist()
            faces = (spice.dskp02(handle, descriptor, 1, nf)-1).tolist()
            frame = spice.frmnam(dsk.frmcde)
            if (int(dsk.frmcde), int(dsk.center), nv, nf) != (10099, 2000004, 99846, 196608):
                raise ValueError('Unexpected Vesta source frame/identity/resolution')
            return vertices, faces, {'frame': frame or str(dsk.frmcde), 'frameCode': int(dsk.frmcde),
                                     'sourceCenterId': int(dsk.center), 'sourceSurfaceId': int(dsk.surfce),
                                     'expectedOrientationFrame': 'IAU_VESTA',
                                     'expectedOrientationModelId': 'dawn-vesta-grv221108-v1',
                                     'orientationModelSha256': 'bb17489f6d933124b502a3a9a5e3491a0d94ab34bb06a7addfa760bd8c681278',
                                     'sourceFrameEvaluationQualified': True,
                                     'contemporaryMeridianObservationallyQualified': False}
        finally:
            spice.dascls(handle)
    raise ValueError('Unknown shape source')


def mesh_glb(vertices, faces, body, uv=None, image=None, validate_closed=True):
    """Preserve every input coordinate and triangle; derive render normals only."""
    if any(len(v) != 3 or not all(map(math.isfinite, v)) for v in vertices):
        raise ValueError('Invalid vertex')
    normals = [[0., 0., 0.] for _ in vertices]
    edges, volume = {}, 0.
    for face in faces:
        if len(face) != 3 or any(i < 0 or i >= len(vertices) for i in face):
            raise ValueError('Invalid triangle index')
        a, b, c = (vertices[i] for i in face)
        ab, ac = [b[j]-a[j] for j in range(3)], [c[j]-a[j] for j in range(3)]
        n = (ab[1]*ac[2]-ab[2]*ac[1], ab[2]*ac[0]-ab[0]*ac[2], ab[0]*ac[1]-ab[1]*ac[0])
        if sum(x*x for x in n) == 0:
            raise ValueError('Degenerate triangle')
        volume += sum(a[j]*n[j] for j in range(3))/6
        for i in face:
            for j in range(3):
                normals[i][j] += n[j]
        for x, y in zip(face, (*face[1:], face[0])):
            key = tuple(sorted((x, y)))
            edges[key] = edges.get(key, 0)+1
    referenced = {i for face in faces for i in face}
    euler = len(referenced)-len(edges)+len(faces)
    # SHAP4S100K is a closed, consistently wound genus-two source mesh (chi=-2).
    # Do not silently repair or sphericalize the archived scientific topology.
    directed = {}
    for face in faces:
        for x, y in zip(face, (*face[1:], face[0])):
            directed[x, y] = directed.get((x, y), 0)+1
    consistent = all(directed.get((x, y)) == 1 and directed.get((y, x)) == 1 for x, y in edges)
    closed = bool(faces) and set(edges.values()) == {2} and consistent and euler <= 2 and euler % 2 == 0 and volume > 0
    if validate_closed and not closed:
        raise ValueError('Source is not a closed outward manifold')
    for i, n in enumerate(normals):
        length = math.sqrt(sum(x*x for x in n))
        normals[i] = [x/length for x in n] if length else [0., 0., 1.]
    lo = [min(v[j] for v in vertices) for j in range(3)]
    hi = [max(v[j] for v in vertices) for j in range(3)]
    sections = [b''.join(struct.pack('<fff', *v) for v in vertices),
                b''.join(struct.pack('<fff', *n) for n in normals)]
    accessors = [{'bufferView': 0, 'componentType': 5126, 'count': len(vertices), 'type': 'VEC3', 'min': lo, 'max': hi},
                 {'bufferView': 1, 'componentType': 5126, 'count': len(vertices), 'type': 'VEC3'}]
    attributes = {'POSITION': 0, 'NORMAL': 1}
    if uv is not None:
        sections.append(b''.join(struct.pack('<ff', *v) for v in uv))
        attributes['TEXCOORD_0'] = 2
        accessors.append({'bufferView': 2, 'componentType': 5126, 'count': len(uv), 'type': 'VEC2'})
    indices = len(sections)
    sections.append(b''.join(struct.pack('<III', *f) for f in faces))
    accessors.append({'bufferView': indices, 'componentType': 5125, 'count': len(faces)*3, 'type': 'SCALAR'})
    if image:
        sections.append(image)
    binary, views = bytearray(), []
    for section in sections:
        views.append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(section)})
        binary.extend(section)
        binary.extend(b'\x00'*(-len(binary) % 4))
    material = {'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1] if image else [.6, .6, .6, 1], 'metallicFactor': 0, 'roughnessFactor': 1}}
    document = {'asset': {'version': '2.0', 'generator': 'Astronomy Hub source-preserving Solar 2.4 conversion'},
                'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': body}],
                'meshes': [{'primitives': [{'attributes': attributes, 'indices': indices, 'material': 0}]}],
                'materials': [material], 'buffers': [{'byteLength': len(binary)}],
                'bufferViews': views, 'accessors': accessors}
    if image:
        material['pbrMetallicRoughness']['baseColorTexture'] = {'index': 0}
        document.update(images=[{'bufferView': len(views)-1, 'mimeType': 'image/jpeg'}],
                        textures=[{'source': 0, 'sampler': 0}],
                        samplers=[{'wrapS': 10497, 'wrapT': 33071, 'magFilter': 9729, 'minFilter': 9987}])
    geometry = {'units': 'km', 'vertexCount': len(vertices), 'triangleCount': len(faces),
                'boundsKm': [lo, hi], 'maxBoundingRadiusKm': max(math.sqrt(sum(x*x for x in v)) for v in vertices),
                'sourceVolumeKm3': volume, 'closedManifold': closed, 'eulerCharacteristic': euler,
                'consistentWinding': consistent,
                'origin': 'source body origin retained; no recentering or radius normalization'}
    return encode_glb(document, bytes(binary)), geometry


def cartographic_position(radius, u, v):
    lon, lat = 2*math.pi*u, math.pi*(.5-v)
    return radius*math.cos(lat)*math.cos(lon), radius*math.cos(lat)*math.sin(lon), radius*math.sin(lat)


def cartographic_uv(body, longitude_radians, latitude_radians):
    """Use PDS pixel-edge origin/resolution, including the fractional global rim."""
    grid = GRIDS[body]
    r = grid['radiusKm']*1000
    x0, y0 = grid['upperLeftMeters']
    return ((r*(longitude_radians-math.radians(grid['centerLongitudeDegrees']))-x0)/(grid['width']*300),
            (y0-r*latitude_radians)/(grid['height']*300))


def cartographic_sphere(radius, image, body):
    # UV seam and pole duplicates retain the exact 0..360 east raster domain.
    width, height = 128, 64
    locations = [(i/width, j/height) for j in range(height+1) for i in range(width+1)]
    center = GRIDS[body]['centerLongitudeDegrees']
    vertices = [cartographic_position(radius, u+(center-180)/360, v) for u, v in locations]
    uv = [cartographic_uv(body, u*2*math.pi+math.radians(center-180), (.5-v)*math.pi) for u, v in locations]
    faces = []
    for j in range(height):
        for i in range(width):
            a, b = j*(width+1)+i, (j+1)*(width+1)+i
            if j > 0:
                faces.append((a, b, a+1))
            if j < height-1:
                faces.append((a+1, b, b+1))
    data, geometry = mesh_glb(vertices, faces, body, uv, image, validate_closed=False)
    geometry.update(referenceRadiusKm=radius, topology='generated reference sphere; no measured relief',
                    axes='+X longitude 0; +Y longitude 90 east; +Z north',
                    geodeticRegistrationQualified=False,
                    cartographicGridQualified=True,
                    frame='PDS New Horizons map grid; exact IAU prime-meridian realization not stated in source label',
                    orientationAtEpochQualified=False, cartographicGrid=GRIDS[body])
    return data, geometry


def run(cache=CACHE, output=OUTPUT, fetch=False):
    document_total = sum(document['bytes'] for document in DOCUMENTS)
    raw_total = sum(s['bytes'] for s in SOURCES)+RESEARCH_RAW_BYTES+document_total
    if raw_total > RAW_CAP:
        raise ValueError('Aggregate source budget exceeded')
    output.mkdir(parents=True, exist_ok=True)
    for document in DOCUMENTS:
        admitted(document, cache, fetch)
    assets = {}
    for pinned in SOURCES:
        body = pinned['id']
        raw = admitted(pinned, cache, fetch)
        source = {k: v for k, v in pinned.items() if k != 'id'}
        source.update(terms=PDS_TERMS, rightsStatus='PDS archived datasets are public domain; retain dataset and author attribution.',
                      orientationClassification='source-frame-retained-epoch-registration-unqualified')
        detail = []
        if body in ('pluto', 'charon'):
            Image.MAX_IMAGE_PIXELS = 400_000_000  # Only digest-verified 309.7MP PDS browse is admitted.
            image = Image.open(io.BytesIO(raw))
            native = image.size
            # JPEG DCT reduction bounds working memory; it adds no pixels/details.
            image.draft('L', (4096, 2048))
            image.load()
            overview_image = jpeg(image, 1024)
            model, geometry = cartographic_sphere(1188.3 if body == 'pluto' else 606., overview_image, body)
            overview = emit(output, body+'-cartographic.glb', model, (1024, 512))
            for size in (2048, 4096):
                data = jpeg(image, size)
                detail.append(emit(output, f'{body}-{size}.jpg', data, Image.open(io.BytesIO(data)).size))
            source.update(organization='NASA New Horizons / JHUAPL / SwRI / PDS Small Bodies Node',
                          url='https://pds.nasa.gov/ds-view/pds/viewCollection.jsp?identifier=urn%3Anasa%3Apds%3Anh_derived%3Aplutosystem_geophysics&version=1.0',
                          doi='10.26007/qc8b-6p65', sourceResolution=list(native), sourcePostingMeters=300,
                          projection=f'Equirectangular, planetocentric; center longitude {GRIDS[body]["centerLongitudeDegrees"]} degrees',
                          longitudeConvention='planetocentric, positive east; Pluto 0 to 360 degrees, Charon -180 to 180 degrees',
                          datum=f'New Horizons reference sphere radius {geometry["referenceRadiusKm"]} km',
                          coverage='partial; south of about 30 degrees south unobserved; original black gaps retained',
                          version='PDS4 nh_derived v4.0, plutosystem_geophysics collection 1.0; 2015 encounter',
                          appearanceClass='observational-monochrome-mosaic-on-reference-sphere',
                          labelUrl=pinned['download'].replace('/browse/', '/mosaic/').replace('.jpg', '.lblx'),
                          disclosure='New Horizons monochrome LORRI/MVIC mosaic; source resolution varies greatly across the body. Black southern areas are unobserved, not dark terrain. A reference sphere carries the imagery; no relief is invented. Map grid is preserved; precise epoch meridian registration remains unqualified because this edition does not document whether the historical 1.45-degree frame offset was corrected.',
                          frameUncertaintySource='https://repository.hou.usra.edu/bitstream/handle/20.500.11753/1798/2021je006964-sup-0001-supporting%20information%20si-s01.pdf?isAllowed=y&sequence=2',
                          labelSha256=next(d['sha256'] for d in DOCUMENTS if d['file'] == f'nh-{body}-label.html'),
                          sourceColorSpace='8-bit panchromatic relative brightness; rendered as sRGB display imagery, not quantitative reflectance',
                          sourcePixelAcquisition='New Horizons LORRI/MVIC July 2015 encounter; no new observation at application epoch')
            kind, mapping = 'cartographic-sphere', 'source-uv'
        elif body == 'ceres':
            document, binary = parse_glb(raw)
            index = document['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']
            image_index = document['textures'][index]['source']
            image_view = document['bufferViews'][document['images'][image_index]['bufferView']]
            start = image_view.get('byteOffset', 0)
            image = Image.open(io.BytesIO(binary[start:start+image_view['byteLength']]))
            overview = emit(output, 'ceres-overview.glb', compact_glb(raw), (1024, 512))
            for size in (2048, 4096):
                data = jpeg(image, size)
                detail.append(emit(output, f'ceres-{size}.jpg', data, Image.open(io.BytesIO(data)).size))
            geometry = {'units': 'source-visualization', 'nativeUvPreserved': True,
                        'geodeticRegistrationQualified': False, 'adoption': 'uniform-reference-scale-preserving-shape',
                        'sourceBounds': [document['accessors'][0]['min'], document['accessors'][0]['max']]}
            source.update(organization='NASA Visualization Technology Applications and Development (VTAD)',
                          url='https://science.nasa.gov/resource/ceres-3d-model/', terms=NASA_TERMS,
                          rightsStatus='NASA media guidelines; NASA VTAD credit, no third-party restriction stated on product.',
                          sourceResolution=list(image.size), sourceImageSha256=sha(binary[start:start+image_view['byteLength']]),
                          projection='Original NASA GLB mesh UVs; no reprojection', datum='not published by NASA VTAD',
                          longitudeConvention='not published by NASA VTAD', coverage='NASA visualization map; per-pixel observational coverage not documented',
                          appearanceClass='NASA-mapped-oblate-visualization', version='NASA downloadable GLB, 2023-09',
                          orientationClassification='illustrative-source-registration',
                          disclosure='NASA Ceres mapped visualization with original UVs and oblate shape preserved. Uniform reference scaling is illustrative; VTAD does not publish source units or prime-meridian registration. This is not a measured terrain model.')
            kind, mapping = 'nasa-source-shape', 'source-uv'
        else:
            vertices, faces, frame = source_shape(raw, body, cache/pinned['file'])
            model, geometry = mesh_glb(vertices, faces, body)
            geometry.update(frame, sourceDataSha256=sha(raw))
            overview = emit(output, body+'-measured.glb', model)
            authors = {'eros': 'NASA PDS / R. Gaskell / NEAR MSI', '67p': 'NASA PDS / ESA PSA / DLR / F. Preusker and F. Scholten', 'vesta': 'NASA PDS NAIF / Dawn Gravity Team JPL', 'halley': 'NASA PDS / Philip Stooke and Alain Abergel / Giotto and Vega imagery'}
            source.update(organization=authors[body], url=pinned['download'],
                          projection='none; original Cartesian vertices and triangle facets',
                          datum='original body-centered coordinates in kilometers',
                          coverage='global shape with uneven observational constraints',
                          sourceResolution={'vertices': len(vertices), 'triangles': len(faces)},
                          appearanceClass='measured-irregular-shape-neutral-material',
                          version={'eros': 'Gaskell 2008 Q64; PDS4 V1.0', '67p': 'DLR SPG SHAP4S 100K; RO-C-MULTI-5-67P-SHAPE-V2.0', 'vesta': 'Dawn GRV ICQ0128 v1, 2022 delivery/2025 archive', 'halley': 'Stooke PDS4 V1.0; migrated from PDS3 V2.0, east-positive revision'}[body],
                          orientationFrame=geometry['frame'],
                          disclosure={'eros': 'NEAR-derived PDS measured Eros shape in original kilometers; neutral material. Original NASA visualization remains preserved separately. Source orientation uses the legacy eros_alex model.',
                                      '67p': 'Rosetta OSIRIS measured SHAP4S nucleus, 2014 northern-hemisphere observations; southern geometry is less constrained. Original CHEOPS frame and kilometers preserved. Neutral material; rotational phase at the selected epoch is unqualified.',
                                      'vesta': 'Dawn measured Vesta shape in original kilometers with its companion GRV221108 rotation model. Neutral material; no texture-to-shape registration is claimed. Source rotation is extrapolated, not independently observed at the application epoch.',
                                      'halley': 'Historical Giotto/Vega nucleus reconstruction by Stooke and Abergel on a 5-degree radius grid. Source warns of 0.5-1 km absolute uncertainty and possible exaggerated depressions. Neutral material; rotational phase at the selected epoch is unqualified.'}[body])
            if body == 'halley':
                source.update(projection='planetocentric 5-degree longitude/latitude/radius grid; east-positive',
                              coverage='global reconstruction with large 0.5-1 km absolute uncertainty',
                              sourceResolution={'latitudeSamples': 37, 'longitudeSamples': 73, 'gridSpacingDegrees': 5},
                              appearanceClass='uncertain-historical-nucleus-reconstruction',
                              labelUrl=next(d['download'] for d in DOCUMENTS if d['file'] == 'halley-stooke.xml'),
                              labelSha256=next(d['sha256'] for d in DOCUMENTS if d['file'] == 'halley-stooke.xml'))
            if body in ('eros', 'vesta'):
                source.update(orientationClassification='qualified-source-body-frame',
                              orientationModelId=geometry['expectedOrientationModelId'],
                              orientationFrame=geometry['expectedOrientationFrame'],
                              orientationQualification='Companion source coefficients independently compared against CSPICE N0067; modern observational accuracy remains unqualified.',
                              orientationReferenceFixture='backend/tests/fixtures/solar_destinations_frames.json')
            kind, mapping = 'measured-shape', 'none'
        assets[body] = {'bodyId': body, 'naifId': IDS[body], 'runtimeAllowed': True, 'kind': kind,
                        'mapping': mapping, 'modelUrl': overview['url'], 'overview': overview,
                        'detail': detail, 'geometry': geometry, 'source': source}
    network = sum(r['bytes'] for a in assets.values() for r in [a['overview'], *a['detail']])
    if network > PACK_CAP:
        raise ValueError('Runtime pack exceeds budget')
    manifest = {'schema': 'oras.solar.visual-assets.v2.4', 'assets': assets,
                'delivery': {'networkBytes': network, 'rawSourceBytes': raw_total,
                             'sourceDocumentBytes': document_total,
                             'caps': {'singleSourceBytes': SINGLE_CAP, 'rawSourceBytes': RAW_CAP, 'runtimePackBytes': PACK_CAP},
                             'gpuTextureCompression': 'none; JPEG transfer with bounded RGBA8 GPU textures; no KTX2 claim',
                             'maxDetailDimensions': [4096, 2048]},
                'sourceDocuments': DOCUMENTS,
                'generator': 'scripts/planetdata/build_solar24_assets.py; Pillow 11.3.0; spiceypy 8.0.0, CSPICE N0067 for DSK; NumPy 2.5.4'}
    emit(output, 'manifest.json', (json.dumps(manifest, indent=2)+'\n').encode())
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--cache', type=Path, default=CACHE)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    result = run(args.cache, args.output, args.fetch)
    print(json.dumps(result['delivery'], indent=2))

#!/usr/bin/env python3
"""Build bounded moon appearance assets from pinned NASA/PDS originals.

Offline by default. --fetch admits only pinned individual originals, never an
archive crawl. Source caches are not runtime assets. Requires Pillow 11.3.0.
"""
import argparse
import hashlib
import io
import json
import math
from pathlib import Path
import struct
import urllib.parse
import urllib.request

from PIL import Image

from build_solar22_textures import compact_glb, jpeg, parse_glb

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'output/playwright/solar-system-2.3/source-cache'
OUTPUT = ROOT / 'frontend/public/planetary-assets/v2.3'
BASE = '/planetary-assets/v2.3/'
SINGLE_CAP = 32 * 1024**2
RAW_CAP = 128 * 1024**2
PACK_CAP = 64 * 1024**2
NASA_TERMS = 'https://www.nasa.gov/nasa-brand-center/images-and-media/'
PDS_TERMS = 'https://pds-ppi.igpp.ucla.edu/faq.jsp'
PDS_LONGITUDE = 'https://pds.nasa.gov/data/pds4/documents/document_pds3_standards/psdd_rev_E_20020828.pdf'
# Retained only in the private source cache: these acquisitions failed rights
# qualification and are never read, generated, or published by this builder.
HELD_RAW_BYTES = 3018535 + 861393
IDS = {'io': '501', 'europa': '502', 'ganymede': '503', 'callisto': '504',
       'titan': '606', 'enceladus': '602', 'ariel': '701', 'umbriel': '702',
       'titania': '703', 'oberon': '704', 'miranda': '705', 'triton': '801',
       'phobos': '401', 'deimos': '402'}
PARTIAL = {'ariel', 'umbriel', 'titania', 'oberon', 'miranda', 'triton'}

# Pinned acquisition records are inserted below; no mutable remote catalog is
# consulted to determine identity or expected hashes during a build.
SOURCES = [{'id': 'io',
  'file': 'io-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/i/Io_1_3643.glb',
  'bytes': 17479700,
  'sha256': '118a6bf7eda476ea6b454039f621778189141a82acb3ad0aaa762f1771c5a723'},
 {'id': 'europa',
  'file': 'europa-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/Europa_1_3138.glb',
  'bytes': 12287068,
  'sha256': 'fe88cbe326574a658c9d3b0885d1a38deea3ebfb354772eb3b95fe0f3f3d542c'},
 {'id': 'ganymede',
  'file': 'ganymede-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/g/Ganymede_1_5268.glb',
  'bytes': 4075564,
  'sha256': '367bc128197bf1d25ef5af5269f2d1902aababaae167c3c8d6529443b0100d6f'},
 {'id': 'callisto',
  'file': 'callisto-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/c/Callisto_1_4821.glb',
  'bytes': 4452928,
  'sha256': '0bdbd5600a4be4bef4bd85e53f6226f49e73a66c85310219402627e59457c303'},
 {'id': 'titan',
  'file': 'titan-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/t/Titan_1_5150.glb',
  'bytes': 686348,
  'sha256': '9e92e30902a26130895bf2558172d7f36186eb4a51368a60bc3ec1d01134fde4'},
 {'id': 'enceladus',
  'file': 'enceladus-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/Enceladus_1_504.glb',
  'bytes': 17925448,
  'sha256': '7548234bae15047d6c1af6bec4f348748b1acae7d4e7bfbe50e5bb3dda75506f'},
 {'id': 'ariel',
  'file': 'ariel-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/a/Ariel_1_1158.glb',
  'bytes': 1364104,
  'sha256': 'b7a5cd8ad3d48687cc3162861971a76a19fe9fad4726563e24b6cc917e9bd858'},
 {'id': 'umbriel',
  'file': 'umbriel-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/u/Umbriel_1_1169.glb',
  'bytes': 606920,
  'sha256': 'b523de7d1406289d540369c635d0b13576460c1fa85a885352afc71c3f118d71'},
 {'id': 'titania',
  'file': 'titania-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/t/Titania_1_1577.glb',
  'bytes': 1932572,
  'sha256': '08556622082b283f2f52c9214636c22acf27300889374dd37197f11a4448324c'},
 {'id': 'oberon',
  'file': 'oberon-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/o/Oberon_1_1523.glb',
  'bytes': 1518548,
  'sha256': '7b42c417e523db2a22c744cd471587c26f07581564dae7c3b0c20986eea93add'},
 {'id': 'miranda',
  'file': 'miranda-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/m/Miranda_1_472.glb',
  'bytes': 688936,
  'sha256': '5a4d24c5fb237ae6d21d1a58857efb32fd0e53162754f17e4156618a541c4c57'},
 {'id': 'triton',
  'file': 'triton-nasa-original.glb',
  'download': 'https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/t/Triton_1_2707.glb',
  'bytes': 6865548,
  'sha256': 'a25df7ee7fe8679e3da8cca7f1a09ec7241ad5e0c7ad97a39f057b8c1a0043ce'},
 {'id': 'phobos',
  'file': 'pds-phobos-phobos_ver64q.tab',
  'download': 'https://sbnarchive.psi.edu/pds4/non_mission/gaskell.phobos.shape-model/data/phobos_ver64q.tab',
  'bytes': 4246671,
  'sha256': 'b054bd2e53057f8d52286483a1b78cef1f6de802d7ca6b6d9310ca287dae2f2b'},
 {'id': 'deimos',
  'file': 'pds-deimos-m2deimos.tab',
  'download': 'https://sbnarchive.psi.edu/pds4/non_mission/ast-sat.thomas.shape-models_V1_0/data/m2deimos.tab',
  'bytes': 86432,
  'sha256': '9a4dbc132c7546acb2ef26a386d306f155519f0988c8052acb2276ddeb7ca2fd'}]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def admitted(source, cache, fetch=False):
    path = cache / source['file']
    if path.exists():
        data = path.read_bytes()
    elif fetch:
        allowed = {'assets.science.nasa.gov', 'sbnarchive.psi.edu'}
        if urllib.parse.urlparse(source['download']).hostname not in allowed:
            raise ValueError('Unapproved source host')
        request = urllib.request.Request(source['download'], headers={'User-Agent': 'AstronomyHub-source-qualification/2.3'})
        with urllib.request.urlopen(request, timeout=30) as response:
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
    record = {'file': name, 'url': BASE + name, 'bytes': len(data), 'sha256': sha(data)}
    if dimensions:
        width, height = dimensions
        record.update(width=width, height=height,
                      gpuRgba8WithMipmapsBytes=(width * height * 16 + 2) // 3)
    return record


def encode_glb(document, binary):
    payload = json.dumps(document, separators=(',', ':')).encode()
    payload += b' ' * (-len(payload) % 4)
    binary += b'\x00' * (-len(binary) % 4)
    return (struct.pack('<III', 0x46546C67, 2, 28 + len(payload) + len(binary)) +
            struct.pack('<II', len(payload), 0x4E4F534A) + payload +
            struct.pack('<II', len(binary), 0x004E4942) + binary)


def source_shape(data, body):
    """Decode native Cartesian facets or triangulate the PDS radial grid."""
    rows = [row.split() for row in data.decode('ascii').splitlines()]
    if body == 'phobos':
        vertex_count, face_count = map(int, rows[0])
        if len(rows) != 1 + vertex_count + face_count:
            raise ValueError('Invalid PDS vertex/facet counts')
        vertices = [tuple(map(float, row[1:])) for row in rows[1:vertex_count+1]]
        faces = [tuple(int(value)-1 for value in row[1:]) for row in rows[vertex_count+1:]]
        if any(int(row[0]) != i+1 for i, row in enumerate(rows[1:vertex_count+1])):
            raise ValueError('Unexpected PDS vertex numbering')
        return vertices, faces
    if body != 'deimos':
        raise ValueError('Unsupported PDS shape')
    grid = {(float(lat), float(lon)): float(radius) for lat, lon, radius in rows}
    if len(grid) != 37*73 or len(rows) != 37*73:
        raise ValueError('Invalid Deimos grid dimensions')
    for lat in range(-90, 91, 5):
        if grid[lat, 0] != grid[lat, 360]:
            raise ValueError('Deimos seam radii differ')
    for lat in (-90, 90):
        if len({grid[lat, lon] for lon in range(0, 361, 5)}) != 1:
            raise ValueError('Deimos polar radii differ')
    vertices = [(0., 0., -grid[-90, 0])]
    for lat in range(-85, 90, 5):
        phi = math.radians(lat)
        for lon in range(0, 360, 5):
            radius, theta = grid[lat, lon], math.radians(lon)
            vertices.append((radius*math.cos(phi)*math.cos(theta),
                             radius*math.cos(phi)*math.sin(theta), radius*math.sin(phi)))
    vertices.append((0., 0., grid[90, 0]))
    # Share the polar/seam samples; triangulate each original 5-degree cell.
    # No interpolation, spherical normalization, or fabricated relief.
    faces = []
    for lon in range(72):
        a, b = 1+lon, 1+(lon+1) % 72
        faces.append((0, b, a))
        for ring in range(34):
            a, b = 1+ring*72+lon, 1+ring*72+(lon+1) % 72
            c, d = a+72, b+72
            faces.extend(((a, b, d), (a, d, c)))
        a, b = 1+34*72+lon, 1+34*72+(lon+1) % 72
        faces.append((a, b, len(vertices)-1))
    return vertices, faces


def shape_glb(data, body):
    """Retain source kilometer positions; derive area-weighted render normals."""
    vertices, faces = source_shape(data, body)
    if any(len(v) != 3 or not all(map(math.isfinite, v)) for v in vertices):
        raise ValueError('Invalid source vertex')
    if any(len(face) != 3 for face in faces):
        raise ValueError('Invalid source triangle')
    normals = [[0., 0., 0.] for _ in vertices]
    edges, volume = {}, 0.
    for face in faces:
        if any(index < 0 or index >= len(vertices) for index in face):
            raise ValueError('Invalid source index')
        a, b, c = (vertices[index] for index in face)
        ab, ac = [b[j] - a[j] for j in range(3)], [c[j] - a[j] for j in range(3)]
        normal = (ab[1]*ac[2] - ab[2]*ac[1], ab[2]*ac[0] - ab[0]*ac[2], ab[0]*ac[1] - ab[1]*ac[0])
        if sum(x*x for x in normal) == 0:
            raise ValueError('Degenerate source facet')
        volume += sum(a[j]*normal[j] for j in range(3)) / 6
        for index in face:
            for j in range(3):
                normals[index][j] += normal[j]
        for x, y in ((face[0], face[1]), (face[1], face[2]), (face[2], face[0])):
            key = tuple(sorted((x, y)))
            edges[key] = edges.get(key, 0) + 1
    referenced = {index for face in faces for index in face}
    if not faces or set(edges.values()) != {2} or len(referenced)-len(edges)+len(faces) != 2 or volume <= 0:
        raise ValueError('Source mesh is not a closed outward manifold')
    for index, normal in enumerate(normals):
        length = math.sqrt(sum(x*x for x in normal))
        if index not in referenced:
            # Gaskell's original list retains duplicate unused edge vertices.
            # Keep those positions; their normals never enter a rendered facet.
            normal[:] = [0., 0., 1.]
            continue
        if not length:
            raise ValueError('Invalid vertex normal')
        for j in range(3):
            normal[j] /= length
    minimum = [min(v[j] for v in vertices) for j in range(3)]
    maximum = [max(v[j] for v in vertices) for j in range(3)]
    positions = b''.join(struct.pack('<fff', *v) for v in vertices)
    normal_bytes = b''.join(struct.pack('<fff', *v) for v in normals)
    indices = b''.join(struct.pack('<III', *face) for face in faces)
    binary = positions + normal_bytes + indices
    document = {
        'asset': {'version': '2.0', 'generator': 'Astronomy Hub PDS shape conversion'},
        'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': body}],
        'meshes': [{'name': body + '-measured-km', 'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1}, 'indices': 2, 'material': 0}]}],
        'materials': [{'name': 'Neutral untextured measured shape', 'pbrMetallicRoughness': {'baseColorFactor': [0.6, 0.6, 0.6, 1], 'metallicFactor': 0, 'roughnessFactor': 1}}],
        'buffers': [{'byteLength': len(binary)}],
        'bufferViews': [{'buffer': 0, 'byteOffset': 0, 'byteLength': len(positions), 'target': 34962},
                        {'buffer': 0, 'byteOffset': len(positions), 'byteLength': len(normal_bytes), 'target': 34962},
                        {'buffer': 0, 'byteOffset': len(positions)+len(normal_bytes), 'byteLength': len(indices), 'target': 34963}],
        'accessors': [{'bufferView': 0, 'componentType': 5126, 'count': len(vertices), 'type': 'VEC3', 'min': minimum, 'max': maximum},
                      {'bufferView': 1, 'componentType': 5126, 'count': len(vertices), 'type': 'VEC3'},
                      {'bufferView': 2, 'componentType': 5125, 'count': len(faces)*3, 'type': 'SCALAR'}],
    }
    geometry = {'units': 'km', 'vertexCount': len(vertices), 'triangleCount': len(faces),
                'maxBoundingRadiusKm': max(math.sqrt(sum(x*x for x in v)) for v in vertices),
                'boundsKm': [minimum, maximum], 'sourceDataSha256': sha(data),
                'referencedVertexCount': len(referenced),
                'sourceVolumeKm3': volume, 'closedManifold': True, 'eulerCharacteristic': 2,
                'frame': 'IAU_PHOBOS as defined by pck00006.tpc' if body == 'phobos' else 'Thomas 1993 planetocentric body frame; source pole/W in PDS label',
                'expectedOrientationFrame': 'IAU_PHOBOS' if body == 'phobos' else 'PDS_THOMAS_DEIMOS',
                'expectedOrientationModelId': 'pds-gaskell-phobos-pck00006' if body == 'phobos' else 'pds-thomas-deimos-label-v1',
                'origin': 'unaltered source body-centered origin; no additional COM correction',
                'axes': '+X prime meridian; +Y 90 degrees east; +Z north',
                'topology': 'original PDS vertex/facet lists' if body == 'phobos' else 'triangulated original 5-degree radial grid; duplicate poles/seam merged'}
    return encode_glb(document, binary), geometry


def run(cache=CACHE, output=OUTPUT, fetch=False):
    if sum(source['bytes'] for source in SOURCES) + HELD_RAW_BYTES > RAW_CAP:
        raise ValueError('Aggregate source budget exceeded')
    output.mkdir(parents=True, exist_ok=True)
    assets = {}
    for pinned in SOURCES:
        body = pinned['id']
        raw = admitted(pinned, cache, fetch)
        source = {key: pinned[key] for key in ('file', 'download', 'bytes', 'sha256')}
        source.update(acquiredUtc='2026-11-02', sourceResolution=None, datum=None,
                      longitudeConvention=None, acquisitionHistory='See source product; source image-by-image acquisition history is not published by VTAD.')
        if body in ('phobos', 'deimos'):
            model, geometry = shape_glb(raw, body)
            overview = emit(output, body + '-pds-shape.glb', model)
            phobos = body == 'phobos'
            source.update(organization='NASA PDS Small Bodies Node / ' + ('R. Gaskell' if phobos else 'P. C. Thomas et al.'),
                          url='https://sbn.psi.edu/pds/resource/' + ('phobosshape.html' if phobos else 'oshape.html'),
                          terms=PDS_TERMS, rightsStatus='PDS archived data are public domain; cite the dataset and its authors.',
                          doi='10.26033/xzv5-bw95' if phobos else '10.26033/g5e0-kh52',
                          labelUrl=pinned['download'].replace('.tab', '.xml'),
                          labelSha256=('9e0235a4948646aaafb8b0d7e0282844fbc7611ece257e94022305ce4a4d49af' if phobos else '74b4c557e6827940430b2d670ec972d9a5d5dc63ef0a95b2b6ebd141ab78f634'),
                          projection='none; original Cartesian triangular mesh' if phobos else 'planetocentric radius grid converted to Cartesian mesh',
                          datum='source body-centered coordinates, kilometers; no ellipsoid or fabricated relief',
                          coverage='global-measured-shape' if phobos else 'global-shape-with-uneven-observational-constraints',
                          orientationClassification='qualified-source-body-frame',
                          orientationModelId=geometry['expectedOrientationModelId'],
                          orientationFrame=geometry['expectedOrientationFrame'],
                          orientationQualification='Preserved source axes; evaluator independently checked against CSPICE with the source coefficients. This is a legacy source model, not PCK11 or independent observational validation.',
                          longitudeConvention='east-positive; PDS planetocentric definition',
                          coordinateConventionUrl=PDS_LONGITUDE,
                          appearanceClass='measured-shape-with-neutral-material',
                          version='PDS bundle V1.0; Gaskell Q=64' if phobos else 'PDS bundle V1.0; Thomas 5-degree grid',
                          productDate='2006-03-11; PDS4 migration 2020-10' if phobos else 'Thomas 1993; PDS4 migration 2021-10',
                          sourceResolution={'vertices': 25350, 'triangles': 49152} if phobos else {'latitudeSamples': 37, 'longitudeSamples': 73, 'gridSpacingDegrees': 5},
                          acquisitionHistory=('224 Viking Orbiter 1 VIS-A/VIS-B images (1976-1978), eight Phobos 2 VSK images (1989).' if phobos else 'Viking Orbiter observations (1976-1980); Thomas 1993 optical shape model.'),
                          uncertainty=('Source landmark formal uncertainty 18 m/component; RMS residual 25 m/component; Q=64 is a reduced source mesh.' if phobos else 'Source reports approximately 400 m uncertainty over much of longitude 200-355 degrees.'),
                          disclosure=('PDS measured irregular shape; neutral material. Orientation uses the exact legacy pck00006 source model, not current PCK11.' if phobos else 'PDS measured irregular shape on a 5-degree grid with uneven accuracy; neutral material. Orientation uses the older source pole/prime meridian, not current PCK11.'))
            if phobos:
                source.update(unitsLabelUrl='https://sbnarchive.psi.edu/pds3/multi_mission/VO1_SA_VISA_VISB_5_PHOBOSSHAPE_V1_0/data/phobos_ver64q.lbl',
                              unitsLabelSha256='0bbca1437066798da2df52ecda9b33ac555eeb56f91b642fbec2e046e0f909bb',
                              unitsEvidence='PDS3 VERTEX_COORDINATES UNIT=KILOMETER; PDS4 catalog states data unchanged',
                              orientationSourceSha256='8aacb5dff544bed1f7cf0659296a1ca75896128a0a729447be0a4deb4de4ecb4')
            else:
                source.update(sourcePoleRaDegrees=316.65, sourcePoleDecDegrees=53.53,
                              sourcePrimeMeridianDegreesAtJ2000=79.41, sourceSpinDegreesPerDay=285.1618970,
                              orientationSourceSha256=source['labelSha256'],
                              sourceTimeConvention='TDB days from J2000 follows IAU/SPICE convention; time scale not explicit in source label')
            asset = {'kind': 'measured-shape', 'mapping': 'none', 'overview': overview,
                     'detail': [], 'geometry': geometry}
        else:
            document, binary = parse_glb(raw)
            view = document['bufferViews'][document['images'][0]['bufferView']]
            image_data = binary[view.get('byteOffset', 0):view.get('byteOffset', 0)+view['byteLength']]
            image = Image.open(io.BytesIO(image_data))
            if 'A' in image.mode and image.getchannel('A').getextrema() != (255, 255):
                raise ValueError('Unexpected transparency in source moon image')
            source.update(organization='NASA Visualization Technology Applications and Development (VTAD)',
                          url=f'https://science.nasa.gov/resource/{body}-3d-model/', terms=NASA_TERMS,
                          rightsStatus='NASA media guidelines; attribution required; no endorsement.',
                          sourceResolution=list(image.size), sourceImageSha256=sha(image_data),
                          sourceColorSpace='glTF baseColor sRGB; embedded PNG has no ICC profile',
                          projection='source-native-cylindrical-UV',
                          coverage='partial-with-neutral-source-gaps' if body in PARTIAL else 'global-observation-coverage-not-qualified',
                          orientationClassification='illustrative-source-registration',
                          appearanceClass='visible-haze-visualization' if body == 'titan' else 'nasa-surface-visualization',
                          version='NASA VTAD glTF download dated 2023-09-09',
                          disclosure=('NASA atmospheric haze visualization; not an infrared or radar surface map, nor a calibrated natural-color photograph.' if body == 'titan' else
                                      'Partial source imagery; unobserved regions remain neutral. Surface longitude registration is illustrative.' if body in PARTIAL else
                                      'NASA source imagery visualization; surface longitude registration and global observation coverage are not independently qualified.'))
            compact = compact_glb(raw)
            overview_size = (min(1024, image.width), min(512, image.height))
            overview = emit(output, body + '-overview.glb', compact, overview_size)
            sizes = [size for size in (2048, 4096) if size <= image.width]
            details = []
            for size in sizes:
                data = jpeg(image, size)
                with Image.open(io.BytesIO(data)) as decoded:
                    details.append(emit(output, f'{body}-{size}.jpg', data, decoded.size))
            position = document['accessors'][document['meshes'][0]['primitives'][0]['attributes']['POSITION']]
            asset = {'kind': 'nasa-source-uv', 'mapping': 'source-uv', 'overview': overview,
                     'detail': details, 'geometry': {'units': 'source-visualization', 'sourceRadius': 500,
                     'vertexCount': position['count'], 'triangleCount': 20508,
                     'nativeUvPreserved': True, 'geodeticRegistrationQualified': False}}
        asset.update(bodyId=body, naifId=IDS[body], runtimeAllowed=True, modelUrl=asset['overview']['url'], source=source)
        assets[body] = asset
    network = sum(record['bytes'] for asset in assets.values() for record in [asset['overview'], *asset['detail']])
    if network > PACK_CAP:
        raise ValueError('Runtime package budget exceeded')
    manifest = {'schema': 'oras.planetary.visual-assets.v2.3', 'assets': assets,
                'delivery': {'networkBytes': network, 'rawSourceBytes': sum(s['bytes'] for s in SOURCES),
                             'aggregateAcquiredImageModelBytes': sum(s['bytes'] for s in SOURCES) + HELD_RAW_BYTES,
                             'heldImageModelBytesExcludedFromRuntime': HELD_RAW_BYTES,
                             'maximumSingleSourceBytes': SINGLE_CAP, 'maximumRawSourceBytes': RAW_CAP,
                             'maximumPackageBytes': PACK_CAP, 'overviewImageMaxSize': 1024,
                             'noUpscaling': True, 'gpuTextureCompression': 'not-implemented; encoder unavailable; no performance claim'},
                'generator': {'script': 'scripts/planetdata/build_solar23_assets.py', 'pillow': Image.__version__,
                              'geometry': 'NASA geometry/UV preserved; measured meshes retain native kilometer vertices'},
                'limitations': ['NASA visualization texture registration is illustrative, not an IAU-geodetic surface.',
                                'Partial source coverage remains visible; no fabricated terrain or inpainting.',
                                'Older PDS shape frames are preserved; current PCK11 shape alignment is not claimed.',
                                'Browser, GPU, scientific orientation and owner visual acceptance require separate validation.']}
    payload = (json.dumps(manifest, indent=2) + '\n').encode()
    emit(output, 'manifest.json', payload)
    print(f'PASS {len(assets)} bodies; runtime {network} bytes; raw sources {manifest["delivery"]["rawSourceBytes"]} bytes; no upscale; original UV/km geometry retained')
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--cache', type=Path, default=CACHE)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    run(args.cache, args.output, args.fetch)

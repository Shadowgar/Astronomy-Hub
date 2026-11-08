"""Validate bounded NASA source bytes and original Mars UV/atlas linkage."""
from pathlib import Path
import json,hashlib,struct
ROOT=Path(__file__).resolve().parents[2]
assets=ROOT/'frontend/src/features/solar/assets'
manifest=json.loads((assets/'provenance.json').read_text())
for record in manifest['assets']:
    data=(assets/record['file']).read_bytes()
    assert len(data)==record['bytes'] and hashlib.sha256(data).hexdigest()==record['sha256']
    print('PASS original source bytes:',record['file'],record['bytes'],record['sha256'])
glb=(assets/'mars-nasa.glb').read_bytes()
assert glb[:4]==b'glTF' and struct.unpack_from('<I',glb,4)[0]==2
length,kind=struct.unpack_from('<II',glb,12);assert kind==0x4e4f534a
gltf=json.loads(glb[20:20+length]);mesh=gltf['meshes'][0]['primitives'][0]
assert gltf['accessors'][mesh['attributes']['POSITION']]['count']==2034
assert gltf['accessors'][mesh['attributes']['TEXCOORD_0']]['count']==2034
texture=gltf['materials'][mesh['material']]['pbrMetallicRoughness']['baseColorTexture']['index']
image=gltf['images'][gltf['textures'][texture]['source']]
assert image['name']=='mars_diff.jpg' and image['mimeType']=='image/png'
view=gltf['bufferViews'][image['bufferView']];binary=glb[28+length:]
raw=binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
assert hashlib.sha256(raw).hexdigest()=='71f55e091d75e9c82655a2299b89d20ee6f75b6543268c9c84e7ce054ed633e5'
print('PASS: Mars original UV-linked color atlas; no equirectangular remapping or generated surface.')

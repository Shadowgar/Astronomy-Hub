"""Read actual browser PNG pixels; no image creation or modification."""
import json
from pathlib import Path
import struct
import zlib


def pixels(path):
    data = path.read_bytes()
    offset = 8
    encoded = b''
    while offset < len(data):
        size = struct.unpack('>I', data[offset:offset + 4])[0]
        kind, chunk = data[offset + 4:offset + 8], data[offset + 8:offset + 8 + size]
        offset += size + 12
        if kind == b'IHDR':
            w, h, depth, color, _, _, interlace = struct.unpack('>IIBBBBB', chunk)
            assert depth == 8 and color in (2, 6) and interlace == 0
        if kind == b'IDAT':
            encoded += chunk
    bpp = 3 if color == 2 else 4
    stride = w * bpp
    raw, previous, result = zlib.decompress(encoded), bytearray(stride), []
    for y in range(h):
        start = y * (stride + 1)
        mode, row = raw[start], bytearray(raw[start + 1:start + 1 + stride])
        for x in range(stride):
            a, b, c = row[x - bpp] if x >= bpp else 0, previous[x], previous[x - bpp] if x >= bpp else 0
            p = a + b - c
            distances = [abs(p - a), abs(p - b), abs(p - c)]
            predictor = [0, a, b, (a + b) // 2, [a, b, c][distances.index(min(distances))]][mode]
            row[x] = (row[x] + predictor) % 256
        result.extend(row[x:x + 3] for x in range(0, stride, bpp))
        previous = row
    return w, h, result


out = Path('output/r4-a/rendering')
report = {}
for name in ['subsolar', 'antisolar']:
    w, h, rgb = pixels(out / (name + '-center.png'))
    report[name] = {'width': w, 'height': h, 'mean_rgb': sum(sum(p) for p in rgb) / (3 * len(rgb)), 'maximum_channel': max(max(p) for p in rgb)}
report['interpretation'] = 'Geometric source-backed Sun direction with a Lambert sphere mask; no ambient Earth illumination or Earthshine. Mosaic is not calibrated reflectance and retains historic acquisition shadows.'
(out / 'raster.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
assert report['subsolar']['mean_rgb'] > 5
assert report['antisolar']['maximum_channel'] <= 1, 'Earth-oriented native shading floor lights the fully unilluminated hemisphere'

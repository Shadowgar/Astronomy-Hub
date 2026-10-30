#!/usr/bin/env python3
"""Reproduce a small, pixel-preserving LROC browse PNG using only stdlib.

The input is the original NASA PDS browse product, not an artistic texture.
Zero-valued source no-data pixels become transparent; there is no inpainting.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import urllib.request
import zlib

SOURCE_URL = 'https://pds.mcp.nasa.gov/data/store/img/lunar_reconnaissance_orbiter/pds4/lroc/lro-l-lroc-5-rdr/LROLRC_2001/EXTRAS/BROWSE/WAC_GLOBAL/WAC_GLOBAL_E000N0000_008P.TIF'
SOURCE_SHA256 = '8a9077d46618ae617234d38794bcaef3a79be9df63e7dbcf1362ec2fb5fe6164'
WIDTH, HEIGHT = 2880, 1440


def convert(data):
    if hashlib.sha256(data).hexdigest() != SOURCE_SHA256:
        raise ValueError('Unqualified source bytes: NASA PDS SHA256 mismatch')
    if data[:4] != b'II*\0':
        raise ValueError('Expected pinned little endian baseline TIFF')
    offset = struct.unpack_from('<I', data, 4)[0]
    count = struct.unpack_from('<H', data, offset)[0]
    tags = {}
    for index in range(count):
        tag, kind, length, value = struct.unpack_from('<HHII', data, offset + 2 + index * 12)
        tags[tag] = (kind, length, value)
    if tags.get(42113) != (2, 2, 48):
        raise ValueError('Expected explicit TIFF GDAL_NODATA zero; never guess a mask')
    if [tags[t][2] for t in (256, 257, 258, 259, 262, 277, 278, 284)] != [WIDTH, HEIGHT, 8, 1, 1, 1, 2, 1]:
        raise ValueError('Unsupported TIFF geometry or encoding')
    strips = struct.unpack_from('<720I', data, tags[273][2])
    lengths = struct.unpack_from('<720I', data, tags[279][2])
    pixels = b''.join(data[start:start + length] for start, length in zip(strips, lengths))
    if len(pixels) != WIDTH * HEIGHT:
        raise ValueError('Incomplete source pixel strips')
    scanlines = bytearray()
    for y in range(HEIGHT):
        scanlines.append(0)  # PNG filter None; deterministic and lossless.
        for pixel in pixels[y * WIDTH:(y + 1) * WIDTH]:
            scanlines.extend((pixel, 255 if pixel else 0))
    def chunk(kind, value):
        return struct.pack('>I', len(value)) + kind + value + struct.pack('>I', zlib.crc32(kind + value))
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', WIDTH, HEIGHT, 8, 4, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(scanlines, 9)) + chunk(b'IEND', b'')
    return png, {'width': WIDTH, 'height': HEIGHT, 'transparentNoDataPixels': pixels.count(0), 'sourceSha256': SOURCE_SHA256, 'pngSha256': hashlib.sha256(png).hexdigest(), 'pngBytes': len(png)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, help='Previously downloaded pinned TIFF; otherwise fetch NASA PDS')
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[2] / 'data/runtime-packs/lunar-surface/release/moon-wac.png')
    args = parser.parse_args()
    data = args.source.read_bytes() if args.source else urllib.request.urlopen(SOURCE_URL, timeout=45).read(4_200_000)
    png, proof = convert(data)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    (args.output.parent / 'WAC_GLOBAL_E000N0000_008P.TIF').write_bytes(data)
    args.output.write_bytes(png)
    print(json.dumps(proof, sort_keys=True))

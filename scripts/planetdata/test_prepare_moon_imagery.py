"""Tests preserve actual PDS pixels and the explicitly tagged missing-data mask."""
import hashlib
from pathlib import Path
import struct
import unittest
import zlib
from prepare_moon_imagery import convert, WIDTH, HEIGHT


class MoonImageryConversion(unittest.TestCase):
    def test_unpinned_source_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'SHA256 mismatch'):
            convert(b'Not the qualified NASA product')

    def test_actual_product_preserves_pixels_and_explicit_mask(self):
        source = Path(__file__).resolve().parents[2] / 'data/runtime-packs/lunar-surface/release/WAC_GLOBAL_E000N0000_008P.TIF'
        self.assertTrue(source.exists(), 'Prepare the pinned source product before qualifying imagery')
        data = source.read_bytes()
        png, proof = convert(data)
        self.assertEqual(proof['transparentNoDataPixels'], 325773)
        self.assertEqual(hashlib.sha256(png).hexdigest(), '218ddb0ed75af907dd0d8c6a1e5a41a6628a9654803a0b88fa352b17ca90c3d8')
        self.assertEqual(struct.unpack_from('>IIBB', png, 16), (WIDTH, HEIGHT, 8, 4))
        length = struct.unpack_from('>I', png, 33)[0]
        raw = zlib.decompress(png[41:41 + length])
        offset = struct.unpack_from('<I', data, 4)[0]
        tags = {}
        for i in range(struct.unpack_from('<H', data, offset)[0]):
            tag, kind, count, value = struct.unpack_from('<HHII', data, offset + 2 + i * 12)
            tags[tag] = (kind, count, value)
        strips = struct.unpack_from('<720I', data, tags[273][2])
        counts = struct.unpack_from('<720I', data, tags[279][2])
        source_pixels = b''.join(data[start:start + count] for start, count in zip(strips, counts))
        for y in range(HEIGHT):
            row = raw[y * (WIDTH * 2 + 1):(y + 1) * (WIDTH * 2 + 1)]
            self.assertEqual(row[0], 0)
            pixels = source_pixels[y * WIDTH:(y + 1) * WIDTH]
            self.assertEqual(row[1::2], pixels)
            self.assertEqual(row[2::2], bytes(255 if p else 0 for p in pixels))


if __name__ == '__main__':
    unittest.main()

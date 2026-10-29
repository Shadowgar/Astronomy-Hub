import math
import tempfile
import unittest
from pathlib import Path
from build_lunar_context import source_pixel, build

class LunarContextTests(unittest.TestCase):
    def test_equirectangular_pixel_centers_and_axis_signs(self):
        self.assertEqual(source_pixel(0,0,2880,1440),(1439.5,719.5))
        self.assertEqual(source_pixel(1,0,2880,1440),(2159.5,719.5))
        self.assertEqual(source_pixel(0,1,2880,1440),(1439.5,-.5))
        self.assertIsNone(source_pixel(1,1,2880,1440))
    def test_source_lon_lat_round_trip_without_frame_rotation(self):
        for lat,lon in [(20.18,30.71),(0,0),(-35,-70),(61,35)]:
            a,b=map(math.radians,(lat,lon))
            x,y=source_pixel(math.cos(a)*math.sin(b),math.sin(a),2880,1440)
            self.assertAlmostEqual((x+.5)/8-180,lon,10)
            self.assertAlmostEqual(90-(y+.5)/8,lat,10)
    def test_unknown_source_is_rejected_before_output(self):
        with tempfile.TemporaryDirectory() as directory:
            src=Path(directory)/'source.png';out=Path(directory)/'out.png'
            src.write_bytes(b'not the qualified WAC raster')
            with self.assertRaisesRegex(ValueError,'Unqualified'):build(src,out)
            self.assertFalse(out.exists())

"""Source integrity, geodesy and actual 3D tile content checks (offline)."""

import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch, MagicMock
import numpy as np
import prepare_lunar_3d_tiles as terrain


class LunarTilesTests(unittest.TestCase):
    def test_attached_label_pixel_centers_match_published_edges(self):
        lat, lon = terrain.pixel_lonlat(0, 0)
        self.assertAlmostEqual(lat, 21.30330227248, places=9)
        self.assertAlmostEqual(lon, 29.90583469702, places=9)
        lat2, lon2 = terrain.pixel_lonlat(11599, 9984)
        self.assertLess(lat2, lat)
        self.assertGreater(lon2, lon)

    def test_negative_elevation_and_east_north_axes(self):
        origin, matrix = terrain.local_frame(20, 30, -2000)
        self.assertAlmostEqual(np.linalg.norm(origin), 1735400, places=6)
        self.assertAlmostEqual(np.linalg.det(matrix), 1, places=12)
        self.assertGreater(
            (matrix.T @ (terrain.body_fixed(20, 30.001, -2000) - origin))[0], 0
        )
        self.assertGreater(
            (matrix.T @ (terrain.body_fixed(20.001, 30, -2000) - origin))[1], 0
        )
        self.assertGreater(
            (matrix.T @ (terrain.body_fixed(20, 30, -1990) - origin))[2], 9.999
        )

    def test_original_float32_height_is_added_to_radius_in_double_precision(self):
        height = np.array([-2611.294189453125, -2725.6572265625], dtype=np.float32)
        points = terrain.body_fixed(20.18, 30.71, height)
        np.testing.assert_allclose(
            np.linalg.norm(points, axis=-1) - terrain.RADIUS,
            height.astype(np.float64),
            rtol=0,
            atol=1e-8,
        )

    def test_tampered_cached_source_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "source"
            p.write_bytes(b"corrupt")
            with self.assertRaisesRegex(ValueError, "hash"):
                terrain.verified_bytes(p, "0" * 64)

    def test_no_data_and_failed_correlation_are_not_synthesized(self):
        heights = np.array([[0.0, -2500.0, np.float32(-3.40282266e38)]])
        image = np.array([[20, -32768, 30]], dtype=np.int16)
        confidence = np.array([[12, 12, 0]], dtype=np.uint8)
        np.testing.assert_equal(
            terrain.valid_samples(heights, image, confidence), [[True, False, False]]
        )

    def test_http_full_response_rejected_without_reading(self):
        response = MagicMock()
        response.__enter__.return_value = response
        response.status = 200
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(terrain.urllib.request, "urlopen", return_value=response):
                with self.assertRaisesRegex(ValueError, "range contract"):
                    terrain.fetch(Path(tmp))
        response.read.assert_not_called()

    def test_offline_verification_never_calls_network(self):
        root = (
            Path(__file__).resolve().parents[2]
            / "frontend/public/planet-terrain/apollo17-nac-v1"
        )
        with patch.object(
            terrain.urllib.request, "urlopen", side_effect=AssertionError("network")
        ):
            terrain.verify_pack(root)

    def test_source_projection_matches_independent_gdal(self):
        root = Path(__file__).resolve().parents[2]
        evidence = json.loads(
            (
                root / "docs/validation/solar-system-2.1/lunar-gdal-crosscheck.json"
            ).read_text()
        )
        for source in evidence:
            for p in source["controlPoints"]:
                lat, lon = terrain.pixel_lonlat(p["row"], p["column"])
                self.assertAlmostEqual(lat, p["latitudeDeg"], places=9)
                self.assertAlmostEqual(lon, p["longitudeDeg"], places=9)

    def test_leaf_real_elevation_and_parent_bounds(self):
        root = (
            Path(__file__).resolve().parents[2]
            / "frontend/public/planet-terrain/apollo17-nac-v1"
        )
        manifest = json.loads((root / "manifest.json").read_text())
        self.assertAlmostEqual(
            np.linalg.norm(manifest["centerBodyFixedM"]) - terrain.RADIUS,
            -2611.294189453125,
            places=6,
        )

        def check(node):
            _, points, _ = terrain.decode_glb(
                (root / node["content"]["uri"]).read_bytes()
            )
            enu = points[:, [0, 2, 1]].copy()
            enu[:, 1] *= -1
            box = np.array(node["boundingVolume"]["box"])
            center = box[:3]
            half = np.array([box[3], box[7], box[11]])
            self.assertTrue(np.all(np.abs(enu - center) <= half + 0.001))
            for child in node.get("children", []):
                cb = np.array(child["boundingVolume"]["box"])
                ch = np.array([cb[3], cb[7], cb[11]])
                self.assertTrue(np.all(np.abs(cb[:3] - center) + ch <= half + 0.001))
                check(child)

        check(json.loads((root / "tileset.json").read_text())["root"])

    def test_admitted_pack_geometry_and_progression(self):
        root = (
            Path(__file__).resolve().parents[2]
            / "frontend/public/planet-terrain/apollo17-nac-v1"
        )
        receipt = terrain.verify_pack(root)
        self.assertEqual(receipt["tileCount"], 85)
        self.assertLess(receipt["totalBytes"], 64 * 1024 * 1024)
        self.assertEqual(receipt["finestSpacingM"], 5)
        self.assertGreater(receipt["reliefM"], 50)
        self.assertLess(receipt["maxSharedEdgeDeltaM"], 0.001)


if __name__ == "__main__":
    unittest.main()

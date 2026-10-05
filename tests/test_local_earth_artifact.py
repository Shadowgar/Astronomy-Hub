"""Fail-closed local provisioning; tiny artifacts are fixtures only."""
import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "earth_artifact", Path(__file__).parents[1] / "scripts/runtime/earth_artifact.py"
)
artifact_tool = importlib.util.module_from_spec(spec)
spec.loader.exec_module(artifact_tool)


class LocalEarthArtifactTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name) / "repo"
        self.source = Path(self.tmp.name) / "artifact"
        self.source.mkdir()
        (self.repo / "runtimes/earth-runtime").mkdir(parents=True)
        (self.repo / "runtimes/earth-runtime/input.mjs").write_text("source")
        (self.source / "health").write_text("ORAS Earth runtime ready\n")
        digest = lambda b: hashlib.sha256(b).hexdigest()
        rows = [{"path": "health", "bytes": 25, "sha256": digest((self.source / "health").read_bytes())}]
        inputs = [{"path": "input.mjs", "bytes": 6, "sha256": digest(b"source")}]
        self.release = {"schema": 1, "owner": "Astronomy Hub", "upstream_sha": "pin", "upstream": "url", "cesium": "version", "public_exports": [], "files": rows, "inputs": inputs, "artifact_sha256": artifact_tool.manifest_digest(rows)}
        self.lock = {"sha": "pin", "upstream": "url", "cesium": "version", "public_exports": [], "artifact_sha256": self.release["artifact_sha256"], "source_input_sha256": artifact_tool.manifest_digest(inputs)}
        (self.repo / "integrations").mkdir()
        (self.repo / "integrations/renderers.lock.json").write_text(json.dumps({"earth": self.lock}))
        (self.repo / "frontend/public").mkdir(parents=True)
        (self.repo / "frontend/public/runtime-versions.json").write_text(json.dumps({"earth": self.lock}))
        self.write_release()
        self.target = self.repo / "data/runtime-artifacts/earth"

    def write_release(self):
        (self.source / "release.json").write_text(json.dumps(self.release))

    def test_verified_install_survives_source_removal_and_is_idempotent(self):
        artifact_tool.install(self.source, self.repo)
        import shutil
        shutil.rmtree(self.source)
        artifact_tool.install(self.source, self.repo)
        artifact_tool.verify(self.target, self.repo, qualified=True)
        self.assertFalse(self.target.is_symlink())

    def test_corruption_never_creates_current(self):
        (self.source / "health").write_text("broken")
        with self.assertRaises(ValueError):
            artifact_tool.install(self.source, self.repo)
        self.assertFalse(self.target.exists())

    def test_source_drift_rejected(self):
        (self.repo / "runtimes/earth-runtime/input.mjs").write_text("drift")
        with self.assertRaises(ValueError):
            artifact_tool.verify(self.source, self.repo, qualified=True)

    def test_unqualified_digest_rejected(self):
        self.release["artifact_sha256"] = "0" * 64
        self.write_release()
        with self.assertRaises(ValueError):
            artifact_tool.install(self.source, self.repo)

    def test_extra_files_rejected(self):
        (self.source / "extra").write_text("extra")
        with self.assertRaises(ValueError):
            artifact_tool.install(self.source, self.repo)

    def test_path_traversal_rejected(self):
        self.release["files"][0]["path"] = "../outside"
        self.write_release()
        with self.assertRaises(ValueError):
            artifact_tool.install(self.source, self.repo)

    def test_symlink_rejected(self):
        (self.source / "extra").symlink_to(self.source / "health")
        with self.assertRaises(ValueError):
            artifact_tool.install(self.source, self.repo)

    def test_served_metadata_drift_rejected(self):
        (self.repo / "frontend/public/runtime-versions.json").write_text('{"earth":{}}')
        with self.assertRaises(ValueError):
            artifact_tool.install(self.source, self.repo)

    def test_existing_corrupt_target_preserved(self):
        self.target.mkdir(parents=True)
        (self.target / "owner-file").write_text("preserve")
        with self.assertRaises((ValueError, FileNotFoundError)):
            artifact_tool.install(self.source, self.repo)
        self.assertEqual((self.target / "owner-file").read_text(), "preserve")


if __name__ == "__main__":
    unittest.main()

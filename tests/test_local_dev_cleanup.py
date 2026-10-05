"""Qualification cleanup must not cross project boundaries."""
import importlib.util
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location("cleanup", Path(__file__).parents[1] / "scripts/cleanup-qualification.py")
cleanup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cleanup)

class CleanupTests(unittest.TestCase):
    def container(self, name, project):
        return {"Name": "/" + name, "Config": {"Labels": {"com.docker.compose.project": project}}}

    def test_known_projects(self):
        for project in cleanup.PROJECTS:
            self.assertTrue(cleanup.eligible(self.container(project + "-frontend-1", project)))

    def test_main_excluded(self):
        for service in ("frontend", "backend", "earth-runtime", "postgres", "redis", "stellarium-reference"):
            self.assertFalse(cleanup.eligible(self.container("astronomy-hub-" + service + "-1", "astronomy-hub")))

    def test_wordpress_excluded_even_with_matching_name(self):
        self.assertFalse(cleanup.eligible(self.container("oras-workspace-qualification-frontend-1", "wp-env")))

    def test_lookalike_project_excluded(self):
        self.assertFalse(cleanup.eligible(self.container("oras-pr59-integration-frontend-1", "oras-pr59-integration-unrelated")))

    def test_standalone_exact_only(self):
        for name in cleanup.STANDALONE:
            self.assertTrue(cleanup.eligible(self.container(name, "")))
            self.assertFalse(cleanup.eligible(self.container(name + "-unrelated", "")))

if __name__ == "__main__":
    unittest.main()

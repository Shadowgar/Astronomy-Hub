"""Safety guards for the private recovery entrypoint; no Docker mutation."""
import copy
import contextlib
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch
import recover_owner_preview as recovery


def containers():
    return [{"Name": "/" + name, "Config": {"Labels": {"oras.task": recovery.TASK}},
             "HostConfig": {"ReadonlyRootfs": True, "PortBindings": {} if i == 0 else {
                 "8877/tcp": [{"HostIp": "127.0.0.1", "HostPort": "4231"}]}},
             "NetworkSettings": {"Networks": {recovery.NETWORK: {}}},
             "Mounts": [{"Type": "bind", "RW": False, "Source": str(Path(__file__).resolve()),
                         "Destination": "/source"}],
             "State": {"Status": "running", "Running": True, "ExitCode": 0}}
            for i, name in enumerate(recovery.NAMES)]


class RecoveryGuards(unittest.TestCase):
    def test_running_or_cleanly_stopped_allowed(self):
        for status in ("running", "exited"):
            data = containers()
            data[0]["State"]["Status"] = status
            recovery.validate(data)

    def test_reject_unsafe_state_before_start(self):
        changes = [
            lambda c: c[1]["HostConfig"]["PortBindings"]["8877/tcp"][0].update(HostIp="0.0.0.0"),
            lambda c: c[0]["Mounts"][0].update(RW=True),
            lambda c: c[0]["Mounts"][0].update(Source="/definitely-missing-owner-source"),
            lambda c: c[0]["Config"]["Labels"].update({"oras.task": "unrelated"}),
            lambda c: c[0]["State"].update(OOMKilled=True),
            lambda c: c[0]["State"].update(ExitCode=137),
            lambda c: c[0]["State"].update(Status="paused"),
            lambda c: c[0]["NetworkSettings"]["Networks"].update(public={}),
        ]
        for change in changes:
            with self.subTest(change=change):
                data = copy.deepcopy(containers())
                change(data)
                with self.assertRaises(ValueError):
                    recovery.validate(data)

    def test_missing_container_cannot_be_created(self):
        with patch.object(recovery, "docker", side_effect=FileNotFoundError("Docker unavailable")) as run:
            self.assertEqual(recovery.main(), 1)
            self.assertEqual(run.call_count, 1)

    def test_running_repeat_never_starts_or_restarts(self):
        def run(*args):
            return json.dumps(containers()) if args[0] == "inspect" else ""
        def response(route):
            return json.dumps({"bodies": list(range(9))}).encode() if route == recovery.SCIENCE else b"html"
        with patch.object(recovery, "docker", side_effect=run) as command, \
                patch.object(recovery, "read_http", side_effect=response), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(recovery.main(), 0)
            self.assertEqual(recovery.main(), 0)
        self.assertFalse(any(c.args[0] in ("start", "restart", "run", "create", "rm") for c in command.call_args_list))

    def test_clean_stopped_backend_only_is_started(self):
        data = containers()
        data[0]["State"].update(Status="exited", Running=False)
        def run(*args):
            return json.dumps(data) if args[0] == "inspect" else ""
        def response(route):
            return json.dumps({"bodies": list(range(9))}).encode() if route == recovery.SCIENCE else b"html"
        with patch.object(recovery, "docker", side_effect=run) as command, \
                patch.object(recovery, "read_http", side_effect=response), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(recovery.main(), 0)
        starts = [c.args for c in command.call_args_list if c.args[0] == "start"]
        self.assertEqual(starts, [("start", recovery.NAMES[0])])


if __name__ == "__main__":
    unittest.main()

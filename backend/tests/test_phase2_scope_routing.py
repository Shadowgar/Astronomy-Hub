import json
import os
import socket
import sys
import threading
import time
from http.server import HTTPServer
from urllib.error import HTTPError
from urllib.request import Request, urlopen


root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
backend_dir = os.path.join(root, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.server import SimpleHandler


def _free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def _start_server(port):
    server = HTTPServer(("127.0.0.1", port), SimpleHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server


def _request_json(url):
    req = Request(url, headers={"User-Agent": "pytest"})
    try:
        with urlopen(req, timeout=5) as resp:
            body = resp.read().decode("utf-8")
            return resp.getcode(), json.loads(body)
    except HTTPError as he:
        body = he.read().decode("utf-8")
        return he.code, json.loads(body)


def test_scope_listing_returns_all_scope_mappings_with_optional_metadata():
    port = _free_port()
    server = _start_server(port)
    time.sleep(0.1)

    try:
        status, payload = _request_json(f"http://127.0.0.1:{port}/api/scopes")
    finally:
        server.shutdown()
        server.server_close()

    assert status == 200
    assert isinstance(payload, dict)
    scopes = payload.get("scopes")
    assert isinstance(scopes, list)

    by_scope = {entry.get("scope"): entry for entry in scopes if isinstance(entry, dict)}
    assert set(by_scope.keys()) == {"sky", "solar_system", "earth"}
    assert by_scope["sky"].get("engines") == ["above_me", "deep_sky"]
    assert by_scope["solar_system"].get("engines") == ["planets", "moon"]
    assert by_scope["earth"].get("engines") == ["satellites", "flights"]
    assert by_scope["earth"].get("optional_engines") == ["flights"]


def test_valid_single_scope_lookup_returns_correct_engine_mapping():
    port = _free_port()
    server = _start_server(port)
    time.sleep(0.1)

    try:
        status, payload = _request_json(f"http://127.0.0.1:{port}/api/scopes?scope=sky")
    finally:
        server.shutdown()
        server.server_close()

    assert status == 200
    assert payload.get("scope") == "sky"
    assert payload.get("engines") == ["above_me", "deep_sky"]
    assert payload.get("optional_engines") == []


def test_invalid_scope_returns_json_400_with_stable_error_code():
    port = _free_port()
    server = _start_server(port)
    time.sleep(0.1)

    try:
        status, payload = _request_json(f"http://127.0.0.1:{port}/api/scopes?scope=invalid_scope")
    finally:
        server.shutdown()
        server.server_close()

    assert status == 400
    assert isinstance(payload, dict)
    err = payload.get("error")
    assert isinstance(err, dict)
    assert err.get("code") == "invalid_scope"
    details = err.get("details") or []
    assert isinstance(details, list)
    assert details and details[0].get("allowed_scopes") == ["sky", "solar_system", "earth"]


def test_engine_only_request_is_rejected_to_preserve_scope_first_pipeline():
    port = _free_port()
    server = _start_server(port)
    time.sleep(0.1)

    try:
        status, payload = _request_json(f"http://127.0.0.1:{port}/api/scopes?engine=above_me")
    finally:
        server.shutdown()
        server.server_close()

    assert status == 400
    err = payload.get("error")
    assert isinstance(err, dict)
    assert err.get("code") == "missing_scope"


def test_valid_engine_selection_inside_scope_returns_engine_metadata():
    port = _free_port()
    server = _start_server(port)
    time.sleep(0.1)

    try:
        status, payload = _request_json(f"http://127.0.0.1:{port}/api/scopes?scope=earth&engine=flights")
    finally:
        server.shutdown()
        server.server_close()

    assert status == 200
    assert payload.get("engine") == "flights"
    assert payload.get("scope") == "earth"
    assert payload.get("optional") is True


def test_invalid_engine_slug_returns_json_400_with_stable_error_code():
    port = _free_port()
    server = _start_server(port)
    time.sleep(0.1)

    try:
        status, payload = _request_json(f"http://127.0.0.1:{port}/api/scopes?scope=sky&engine=not_real")
    finally:
        server.shutdown()
        server.server_close()

    assert status == 400
    err = payload.get("error")
    assert isinstance(err, dict)
    assert err.get("code") == "invalid_engine"


def test_engine_outside_selected_scope_returns_json_400_with_stable_error_code():
    port = _free_port()
    server = _start_server(port)
    time.sleep(0.1)

    try:
        status, payload = _request_json(f"http://127.0.0.1:{port}/api/scopes?scope=sky&engine=moon")
    finally:
        server.shutdown()
        server.server_close()

    assert status == 400
    err = payload.get("error")
    assert isinstance(err, dict)
    assert err.get("code") == "engine_out_of_scope"


def test_registry_consistency_across_all_canonical_engines():
    expected = {
        "above_me": ("sky", False),
        "deep_sky": ("sky", False),
        "planets": ("solar_system", False),
        "moon": ("solar_system", False),
        "satellites": ("earth", False),
        "flights": ("earth", True),
    }

    port = _free_port()
    server = _start_server(port)
    time.sleep(0.1)

    try:
        for engine_slug, (scope_slug, is_optional) in expected.items():
            status, payload = _request_json(
                f"http://127.0.0.1:{port}/api/scopes?scope={scope_slug}&engine={engine_slug}"
            )
            assert status == 200
            assert payload.get("engine") == engine_slug
            assert payload.get("scope") == scope_slug
            assert payload.get("optional") is is_optional
    finally:
        server.shutdown()
        server.server_close()

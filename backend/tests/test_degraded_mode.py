import os
import sys
import threading
import time
import json
from http.server import HTTPServer
from urllib.request import urlopen, Request
from urllib.error import HTTPError

# Ensure backend/ logging_config.py can be imported as a top-level module
root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
backend_dir = os.path.join(root, 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.server import SimpleHandler


def start_server(port=8050):
    # Enable simulated normalizer failure for conditions module
    os.environ['SIMULATE_NORMALIZER_FAIL'] = 'conditions'
    server = HTTPServer(('127.0.0.1', port), SimpleHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server, t


def test_conditions_module_failure_returns_error_contract():
    port = 8050
    server, _ = start_server(port)
    # give server time to start
    time.sleep(0.15)

    url = f'http://127.0.0.1:{port}/api/conditions'
    try:
        req = Request(url, headers={'User-Agent': 'pytest'})
        with urlopen(req, timeout=5) as resp:
            body = resp.read().decode('utf-8')
            status = resp.getcode()
    except HTTPError as he:
        status = he.code
        body = he.read().decode('utf-8')

    # Shutdown server
    try:
        server.shutdown()
        server.server_close()
    except Exception:
        pass

    # Parse JSON body
    try:
        data = json.loads(body)
    except Exception:
        data = None

    # Expect a 500 module-level error contract JSON when normalization fails
    assert status == 500, f"expected status 500, got {status} body={body}"
    assert isinstance(data, dict), f"expected JSON dict body, got: {body}"
    assert data.get('module') == 'conditions' or data.get('error') == 'module_error'

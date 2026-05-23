from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_assets_endpoint_returns_streaming_placeholder():
    resp = client.get("/api/v1/assets/example-key")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/plain")
    assert "inline; filename=\"example-key.txt\"" == resp.headers.get("content-disposition")
    assert resp.text == "placeholder asset: example-key\n"

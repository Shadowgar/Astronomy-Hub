from pydantic import ValidationError

from backend.app.schemas.response_envelope import ResponseEnvelope


def test_response_envelope_valid():
    payload = {"status": "ok", "data": {"foo": "bar"}}
    env = ResponseEnvelope.parse_obj(payload)
    assert env.status == "ok"


def test_response_envelope_invalid_missing_status():
    payload = {"data": {"foo": "bar"}}
    try:
        ResponseEnvelope.parse_obj(payload)
        assert False, "expected ValidationError for missing status"
    except ValidationError:
        pass

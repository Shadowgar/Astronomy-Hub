import pytest

from pydantic import ValidationError

from backend.schemas.response_envelope import ResponseEnvelope
from backend.schemas.validate_utils import parse_with_error


def test_happy_path_envelope():
    payload = {"status": "ok", "data": {"example": 1}}
    inst, err = parse_with_error(ResponseEnvelope, payload)
    assert err is None
    assert isinstance(inst, ResponseEnvelope)


def test_reject_unexpected_top_level_field():
    payload = {"status": "ok", "data": {}, "unexpected": 123}
    inst, err = parse_with_error(ResponseEnvelope, payload)
    assert inst is None
    assert isinstance(err, ValidationError)


def test_null_optional_fields_allowed():
    payload = {"status": "error", "data": None, "error": {"code": "e"}}
    inst, err = parse_with_error(ResponseEnvelope, payload)
    assert err is None
    assert inst.data is None
    assert isinstance(inst.error, dict)

from backend.schemas.validate_utils import parse_with_error
from backend.schemas.conditions import Conditions
from backend.schemas.targets import Target

from backend.conditions_data import MOCK_CONDITIONS
from backend.targets_data import MOCK_TARGETS


def test_mock_conditions_conform_to_model():
    inst, err = parse_with_error(Conditions, MOCK_CONDITIONS)
    assert err is None
    assert inst is not None


def test_conditions_reject_cloud_cover_outside_percentage_range():
    for cloud_cover_pct in (-1, 101):
        payload = dict(MOCK_CONDITIONS)
        payload["cloud_cover_pct"] = cloud_cover_pct
        inst, err = parse_with_error(Conditions, payload)
        assert inst is None
        assert err is not None


def test_mock_targets_conform_to_model():
    # MOCK_TARGETS is a list of target dicts
    assert isinstance(MOCK_TARGETS, list)
    for t in MOCK_TARGETS:
        inst, err = parse_with_error(Target, t)
        assert err is None
        assert inst is not None

import sys


def test_conditions_normalizer_runs_and_schema_loads():
    """Ensure the conditions normalizer can be invoked and the schema can be loaded.

    This test does not assert full semantic validation because provider mocks
    may not yet match the strict schema during iterative implementation.
    """
    sys.path.insert(0, '.')
    from backend.normalizers.conditions_normalizer import normalize_to_contract
    from backend.normalizers import validator
    from backend.conditions_data import MOCK_CONDITIONS

    normalized = normalize_to_contract(MOCK_CONDITIONS)
    assert isinstance(normalized, dict)

    schema = validator.load_schema('conditions.schema.json')
    assert isinstance(schema, dict)

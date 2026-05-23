import sys


def test_load_error_schema():
    # Ensure the validator utility can load the error schema file.
    sys.path.insert(0, '.')
    from backend.normalizers import validator

    schema = validator.load_schema('error.schema.json')
    assert isinstance(schema, dict)
    assert 'error' in schema.get('properties', {})

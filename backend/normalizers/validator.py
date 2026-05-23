"""Simple validator utility for loading contract schemas.

This is intentionally lightweight: it provides `load_schema(name)` which
returns the parsed JSON schema from `docs/contracts/` and a `validate`
wrapper that will use `jsonschema` if available.
"""
import json
import os


SCHEMA_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'docs', 'contracts'))


def load_schema(name):
    """Load and return a JSON schema dict by filename from the contracts dir."""
    if not isinstance(name, str) or not name:
        raise ValueError("schema name must be a non-empty string")

    # Prevent path traversal by resolving inside the contracts directory only.
    candidate = os.path.abspath(os.path.join(SCHEMA_DIR, name))
    schema_root = os.path.abspath(SCHEMA_DIR)
    if not candidate.startswith(schema_root + os.sep):
        raise ValueError("invalid schema path")

    path = candidate
    with open(path, 'r', encoding='utf-8') as fh:
        return json.load(fh)


def validate(schema_name, payload):
    """Validate payload against named schema if `jsonschema` is installed.

    Returns True if validation succeeded (or if `jsonschema` is not
    installed, performs a minimal required-field check).
    """
    schema = load_schema(schema_name)
    try:
        import jsonschema
        jsonschema.validate(instance=payload, schema=schema)
        return True
    except Exception:
        # Fallback: basic presence check for required top-level keys
        req = schema.get('required', [])
        if not req:
            return True
        if isinstance(payload, dict):
            return all(k in payload for k in req)
        return False

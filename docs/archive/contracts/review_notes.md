# Contracts Review Notes

Checklist for manual review and sign-off of contract schemas in `docs/contracts`.

- [ ] Confirm index.json lists all schema files expected for Phase 2.
- [ ] Confirm `error.schema.json` exists and validates against `sample_error.json`.
- [ ] Confirm `conditions.schema.json` exists and matches expected fields (`timestamp`, `location`, etc.).
- [ ] If `ajv` is available, run:

  ```bash
  npx ajv validate -s docs/contracts/error.schema.json -d docs/contracts/sample_error.json
  npx ajv validate -s docs/contracts/conditions.schema.json -d <example_conditions.json>
  ```

- [ ] Fallback JSON parse check (Python):

  ```bash
  python3 -c "import json; json.load(open('docs/contracts/error.schema.json')); json.load(open('docs/contracts/sample_error.json')); print('ok')"
  ```

- [ ] Confirm schema `additionalProperties` policy is intentionally set.
- [ ] Add sign-off below once manual checks pass.

Sign-off:

- Name: ____________________  Date: ___________

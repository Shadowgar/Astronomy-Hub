# Normalizers — Unknown-Field Policy

Policy summary
- Unknown or provider-specific fields MUST NOT be forwarded to clients.
- Default action: drop any fields not explicitly listed in the contract schema.

Guidance for implementers
- Implement normalizers to map and whitelist only the contract fields.
- If a provider field should be preserved, add an explicit mapping in the normalizer.
- Log dropped fields at debug level when running in dev or test to aid schema reconciliation.

Error handling
- If a provider payload includes unexpected types or malformed values, normalizers
  should either coerce safely when possible or remove the offending field and
  record a warning. Do not include malformed data in the output contract.

Rationale
- Forwarding unknown fields increases coupling and allows provider leakage into
  the public API surface. Enforcing a drop-by-default policy makes contracts
  predictable and easier to evolve.

Sign-off
- Owner: backend/normalizers team

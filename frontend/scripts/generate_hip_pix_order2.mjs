throw new Error(
  [
    'This generator is intentionally disabled.',
    'Astronomy Hub now keeps the HIP lookup table fully vendored in-repo:',
    '  src/features/sky-engine/engine/sky/adapters/hipPixOrder2.generated.ts',
    'No external Stellarium source fetches are allowed.',
  ].join('\n'),
)

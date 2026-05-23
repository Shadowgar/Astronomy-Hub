throw new Error(
  [
    'This generator is intentionally disabled.',
    'Astronomy Hub now keeps ERFA EPV00 tables fully vendored in-repo:',
    '  src/features/sky-engine/engine/sky/runtime/erfaEpv00Tables.generated.ts',
    'No external Stellarium source tree dependency is allowed.',
  ].join('\n'),
)

throw new Error(
  [
    'This generator is intentionally disabled.',
    'Astronomy Hub now keeps ERFA NUT00A tables fully vendored in-repo:',
    '  src/features/sky-engine/engine/sky/runtime/erfaNut00aTables.generated.ts',
    'No external Stellarium source tree dependency is allowed.',
  ].join('\n'),
)

First TSX migration

- Migrated: `src/components/MoonSummary.tsx`
- Rationale: very small, presentational component; existing `MoonSummary.jsx` preserved.
- Rollback: remove `MoonSummary.tsx` and restore imports to the `.jsx` file (no deletions were performed).
- Purpose: validate TypeScript adoption and local typecheck without changing runtime behavior.

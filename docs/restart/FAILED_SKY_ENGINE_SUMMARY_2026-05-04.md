# Failed Sky Engine Summary

Date: 2026-05-04

- The old custom renderer path has been deleted.
- Reason: it failed to achieve Stellarium parity and became unusable under repeated renderer-side refactors.
- The active frontend keeps only the Hub shell and a clean `/sky-engine` placeholder for the next restart task.
- No future work should import or recreate code from the deleted legacy path.
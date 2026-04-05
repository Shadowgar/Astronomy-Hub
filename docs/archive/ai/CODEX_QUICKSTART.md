Use Astronomy Hub repo authority rules.

Before doing anything:
1. apply phase-guard
2. respect Document_Index authority
3. respect corrective-track precedence
4. use minimal diffs only
5. verify before claiming completion

If this is audit work:
- follow be-audit-ladder or fe-audit-ladder
- stop on first FAIL

If this is implementation:
- use frontend-change or backend-change
- do not expand scope
- do not invent behavior

Current special rule:
FE8.5 is a corrective checkpoint, not a greenfield phase.
# Independent review: failed temporal acknowledgement cache

Reviewed the uncommitted correction against HEAD56f5645a on existing `recovery/reconcile-20261026`. Reviewer did not author the implementation or its two added test cases. Scope: `frontend/src/features/workspace/workspaceRuntimeAdapter.ts` and `frontend/tests/workspaceRuntimeAdapter.test.ts`; nearby caller/renderer time semantics were read to assess clock effects. No repository mutations, commit, push, branch/PR action, Docker action or full-suite run. Parent owns the separate deployment repair.

## Finding disposition

No actionable finding in this correction. The new `if(!result?.ok)timeWork.current=null` executes only after both `timeWork.current===work` and `current.current===client` checks. Thus a late failure belonging to an old client or old date cannot clear a newer temporal operation. Rejected acknowledgements and request exceptions (converted to null by the request wrapper) both invalidate failed cache work, allowing a later query effect to retry time and then synchronize observer/selection. Pending and successful work remain cached, preserving the existing one-time-dispatch behavior for observer/selection-only URL changes. Existing cancellation and request/client guards remain intact.

The added tests cover both failure forms followed by explicit time retry and an observer URL update. They do not themselves assert Sky selection or late-generation behavior; six independent read-only harness cases below exercised those additional paths.

## Validation

Working directory: `/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026/frontend`.

Exact owning test command: `npm test -- --run tests/workspaceRuntimeAdapter.test.ts`.

Output: Vitest4.1.2; `Test Files 1 passed (1)`, `Tests 14 passed (14)`, duration236ms. Exit0. No full suite run.

Exact whitespace command from repository root: `git diff --check -- frontend/src/features/workspace/workspaceRuntimeAdapter.ts frontend/tests/workspaceRuntimeAdapter.test.ts`. No output, exit0.

Supplemental command: `node --import tsx --input-type=module -` with a here-document in the tool transcript. It transpiled the actual adapter TypeScript in memory using the installed TypeScript module, injected React hook stubs equivalent to the owning test harness, and imported actual productState, observerProvenance and observer-elevation helpers. It performed deterministic Promise completions, not sleeps, and wrote no test/code files. Exit0. Exact assertions/outcomes:

```
PASS failed rejected -> same-client observer + selection synchronization
PASS failed exception -> same-client observer + selection synchronization
PASS acknowledged fixed time retained through observer + selection change
PASS acknowledged live time retained through observer + selection change
PASS stale failed date acknowledgement cannot clear newer pending work
PASS stale failed client acknowledgement cannot clear newer pending work
```

For both failures, the next query generated exactly two total time commands (failed then retry), exactly one observer command and exactly one Sky selectEntity command. For successful fixed/Live time, observer+selection URL changes retained exactly one total time command. For old-date/client failures, resolving the old promise after newer time work began did not increase the newer client's time-command count on another observer update; resolving current work synchronized the observer once.

## Limits and handoff

This qualifies adapter logic with the owning suite and controlled hook harness. It does not supply browser/native-renderer, Docker or device evidence. No source clock/SGP4/orbital behavior was changed by the reviewed three-line patch. The parent should include the focused green result with its final patch proof; no additional adapter change is recommended from this review.

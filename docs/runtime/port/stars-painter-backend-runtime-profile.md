# Stars Painter Backend Runtime Profile (Stage 4C)

Date: 2026-04-26  
Mode: Stellarium Port Mode ACTIVE  
Status: PASS (EV-0118)

## Goal

Profile and compare runtime telemetry for Stage 4B backend execution in two modes:

1. default OFF behavior (no backend side-by-side execution)
2. explicit ON behavior via supported query/runtime flag (side-by-side only)

This slice validates telemetry behavior only. It does not change render ownership, visuals, or pipeline architecture.

## Runtime Flag Contract

- OFF/default URL: `http://127.0.0.1:4173/sky-engine?debugTelemetry=1`
- ON URL: `http://127.0.0.1:4173/sky-engine?debugTelemetry=1&painterBackendExecution=1`

## Artifact Paths

- OFF/default artifact: `/home/rocco/Astronomy-Hub/.cursor-artifacts/parity-compare/stars-painter-backend-runtime-profile-off-2026-04-26.json`
- ON/side-by-side artifact: `/home/rocco/Astronomy-Hub/.cursor-artifacts/parity-compare/stars-painter-backend-runtime-profile-on-2026-04-26.json`

## OFF vs ON Summary

| Metric | OFF/default | ON/side-by-side | Expected |
|---|---|---|---|
| sampleCount | 29 | 27 | non-zero in both runs |
| backendExecutionEnabledShare.avg | 0 | 1 | OFF=0, ON=1 |
| backendExecutionDisabledShare.avg | 1 | 0 | OFF>0, ON=0 |
| backendExecutedSideBySideShare.avg | 0 | 1 | OFF=0, ON>0 |
| backendExecutionDisabledCount.avg | 1 | 0 | OFF>0, ON=0 |
| backendSideBySideExecutionCount.avg | 0 | 1 | OFF=0, ON>0 |
| backendUnsupportedBatchCount.max | 0 | 0 | both 0 |
| backendMappedVsDirectDelta.max | 0 | 0 | both 0 |
| batchVsDirectDelta.max | 0 | 0 | both 0 |
| starThinInstanceCount.p50 | 9 | 9 | direct path still active |

## Interpretation

- OFF/default profile proves backend execution remains disabled by default:
  - `backendExecutionEnabledShare.avg = 0`
  - `backendExecutionDisabledCount.avg = 1`
  - `backendSideBySideExecutionCount.avg = 0`
- ON profile proves side-by-side execution only:
  - `backendExecutionEnabledShare.avg = 1`
  - `backendExecutedSideBySideShare.avg = 1`
  - `backendSideBySideExecutionCount.avg = 1`
- Direct rendering remains active in both runs:
  - non-zero `starThinInstanceCount`
  - zero deltas (`batchVsDirectDelta`, `backendMappedVsDirectDelta`)
- Unsupported execution stays absent:
  - `backendUnsupportedBatchCount.max = 0`

No renderer replacement occurred in this slice.

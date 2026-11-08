# Solar 2.6 CodeQL correction qualification

Baseline: `97c7ba61025b8a251d30331d5e92eb01b3462ec6`, existing PR #107 and
`recovery/reconcile-20261026`. GitHub CodeQL 2.27.4 reported three new Python
alerts on `refs/pull/107/head`. This report records source triage and the bounded
correction; hosted reanalysis and final commit identification are separate gates.
No alert was suppressed or manually dismissed.

## Alerts #85 and #86: request identity flowing to filesystem paths

- [#85](https://github.com/Shadowgar/Astronomy-Hub/security/code-scanning/85):
  `py/path-injection`, high severity, baseline
  `backend/app/services/beyond_exploration.py:34`, `path.stat()`.
- [#86](https://github.com/Shadowgar/Astronomy-Hub/security/code-scanning/86):
  same rule/severity, baseline line 40, `path.open('rb')`.
- Both traces originate at the route's request `identity` argument,
  `backend/app/routes/beyond_exploration.py:15`.

The original service checked exact membership in the two fixed product IDs before
performing any source-directory, cache or filesystem work. The original request
string was nevertheless concatenated into the product filename after that guard.
No traversal bypass or arbitrary file-read exploit was demonstrated for the
FastAPI string input under this exact membership check. The static flow remained
request-derived, and the qualified release should not rely on the analyzer
understanding a membership guard.

The correction at `observation_product` selects an explicit literal canonical ID
and literal filename for each accepted request. Unknown values still raise the
same `KeyError` before directory selection or filesystem work. Only these trusted
constants reach both the stat fingerprint and cached product-reader paths.
Manifest filename equality, byte limits, SHA256, source identity and metadata
checks remain enforced. The request cannot select the configured directory.

Focused regressions cover 11 unsupported identities, including traversal, absolute
paths, backslash traversal, encoded traversal, null bytes, wrong case and extension
suffixes, with every filesystem/cache boundary made fail-on-call. Two accepted-ID
regressions prove raw request objects cannot be concatenated into paths and that
the resulting products remain unchanged.

## Alert #84: public angular-map coordinates misclassified as private data

[#84](https://github.com/Shadowgar/Astronomy-Hub/security/code-scanning/84),
`py/clear-text-logging-sensitive-data`, high severity, identifies the broad report
print at baseline `scripts/validation/verify_solar26_observation_source.py:78`.
Its two source locations are lines 70–71: the IBEX peak bin's
`longitude_center_deg` and `latitude_center_deg`.

Those values are public solar-ecliptic directions in the pinned IBEX ENA sky map,
not a user's geographic coordinates, credentials or other private information.
The validation script reads only the qualified local scientific sources and has
no user/session inputs. This is a sensitive-data classification false positive;
no private-data disclosure was demonstrated.

The script nevertheless no longer dumps the entire report to stdout. It prints
only fixed labels and selected public verification counts. The complete scientific
report is still written to its explicit evidence JSON file, unchanged. No source
renaming, suppression, alert dismissal or scientific-evidence removal was used.

## Local verification

```sh
PYTHONPATH=. /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_beyond_exploration.py -q
# 35 passed; one pre-existing HTTPX app-shortcut deprecation warning.

PYTHONPATH=output/solar26-observation-tools/lib/python3.12/site-packages:output/playwright/solar-system-2.4/asset-tools-venv/lib/python3.12/site-packages:. /home/rocco/Astronomy-Hub/.venv/bin/python scripts/validation/verify_solar26_observation_source.py
# PASS: 1800 IBEX cells; 1440 IMAP bins; 3 UTC reference checks.

git diff --check
# PASS; no output.
```

Actual pinned-pack FastAPI response bodies were captured before the correction and
compared byte-for-byte afterward, both HTTP 200:

| Product | Response bytes | SHA256 |
| --- | ---: | --- |
| IBEX | 66,750 | `4c1cab33346970c0bb131fd878c9c468583faa1d87682175ebbaf943e1936cd1` |
| IMAP | 126,182 | `7389455cf74d3bffb4f1ded22a9b8aff6fdcc1e1da804a38d0f19ebdf27ee532` |

See `codeql-response-equivalence.json`. The original
`observations-independent-numerics.json` remains byte-identical to the baseline.
No frontend, scientific source pack, renderer or Docker volume changed.

Independent review and hosted CodeQL results are pending at this author checkpoint.
Passing focused tests alone does not qualify the hosted security gate.

## Integrator follow-up

Separate local review passed: `codeql-independent-review.json`. The actual
Docker Beyond+mission suite passed52tests with4inherited warnings. All three
private HTTP response bodies(context,IBEX,IMAP) are byte-identical after restarting
only the task's read-only backend; `codeql-docker-api-equivalence.json`. No frontend
or source-pack change occurred. Hosted results are recorded on PR107 after the
correction is pushed; local review does not substitute for that gate.

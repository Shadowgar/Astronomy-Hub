import logging
import os

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

def configure_logging():
    level = getattr(logging, LOG_LEVEL, logging.INFO)
    root = logging.getLogger()
    if root.handlers:
        return
    root.setLevel(level)
    ch = logging.StreamHandler()
    ch.setLevel(level)
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s", "%Y-%m-%dT%H:%M:%SZ")
    ch.setFormatter(fmt)
    root.addHandler(ch)


def get_logger(name=None):
    configure_logging()
    return logging.getLogger(name)

# Observability notes (doc-only):
# - Look for these log keys/markers in runtime logs to identify degraded behavior:
#   - cache.hit / cache.set / cache.init.fail: indicates caching activity and problems
#   - normalize.fail or normalize=ok: indicates whether normalization of provider data succeeded
#   - module.error, module.<module>.assembly.fail, module.<module>.unhandled: module-level assembly errors
#   - req=<request_id> prefixes: correlate request lifecycle START/END and duration_ms
# - Example messages emitted elsewhere in the backend:
#   - "req=... cache.hit key=..."  (info)
#   - "req=... normalize=ok"      (info)
#   - "req=... normalize.fail"    (exception)
#   - "req=... module.conditions.assembly.fail" (exception)
# These comments are documentation only and intentionally do not change runtime behavior.

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

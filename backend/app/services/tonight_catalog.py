"""Bounded existing catalogs, acquired without a current-horizon filter."""

import hashlib
import json
import logging
from dataclasses import dataclass
from heapq import nsmallest
from threading import RLock

from backend.app.services.openngc_dso_catalog_service import (
    build_openngc_above_me_seed_records,
    find_openngc_record_by_messier_id,
    load_openngc_catalog,
)
from backend.app.services.sky_catalog_service import LOCAL_MESSIER_SEARCH_OBJECTS
from backend.app.services.sky_star_catalog import (
    BRIGHT_STAR_SCENE_OBJECTS,
    _load_tier2_mid_star_dataset,
)

logger = logging.getLogger(__name__)
HIP_LIMIT = 120
OPENNGC_LIMIT = 700


def fixed_targets():
    targets = []
    sources = {}
    for key, loader in [
        ("bright_stars", lambda: BRIGHT_STAR_SCENE_OBJECTS),
        (
            "hipparcos",
            lambda: nsmallest(
                HIP_LIMIT,
                _load_tier2_mid_star_dataset(),
                key=lambda s: (float(s["magnitude"]), str(s["id"])),
            ),
        ),
        ("messier", lambda: LOCAL_MESSIER_SEARCH_OBJECTS),
        ("openngc", lambda: build_openngc_above_me_seed_records(limit=OPENNGC_LIMIT)),
    ]:
        try:
            records = loader()
            count = 0
            for obj in records:
                if key in ("bright_stars", "hipparcos"):
                    row = {
                        "catalog": "Bright Star Catalog (local)"
                        if key == "bright_stars"
                        else "Hipparcos Tier 2 (local)",
                        "source_id": str(obj["id"]),
                        "model": "star",
                        "name": obj["name"],
                        "type": "star",
                        "category": "stars",
                        "ra": float(obj["right_ascension"]) * 15,
                        "dec": float(obj["declination"]),
                    }
                elif key == "messier":
                    record = find_openngc_record_by_messier_id(obj["catalog"])
                    row = {
                        "catalog": "Messier (local)",
                        "source_id": str(obj["catalog"]),
                        "model": "dso",
                        "name": obj["name"],
                        "type": obj["object_type"],
                        "category": "deep-sky",
                        "ra": float(obj["ra_hours"]) * 15,
                        "dec": float(obj["dec_deg"]),
                    }
                    if record:
                        row["ngc_identity"] = record["source_id"]
                else:
                    row = {
                        "catalog": str(obj["catalog"]),
                        "source_id": str(obj["source_id"]),
                        "model": "dso",
                        "name": (
                            obj.get("common_names")
                            or [obj.get("display_name") or obj["source_id"]]
                        )[0],
                        "type": obj["object_type"],
                        "category": "deep-sky",
                        "ra": float(obj["ra"]),
                        "dec": float(obj["dec"]),
                    }
                targets.append(row)
                count += 1
            sources[key] = {"status": "included", "candidate_count": count}
        except Exception:
            logger.exception("Tonight catalog unavailable: %s", key)
            sources[key] = {"status": "unavailable", "candidate_count": 0}
    # Same physical Messier/OpenNGC DSO must not consume two opportunities.
    messier_ngc = {r.pop("ngc_identity") for r in targets if "ngc_identity" in r}
    targets = [
        r
        for r in targets
        if not ("OpenNGC" in r["catalog"] and r["source_id"] in messier_ngc)
    ]
    return targets, sources


@dataclass(frozen=True)
class CatalogSnapshot:
    """Serialized bounded rows are immutable; only misses need mutable copies."""

    targets_json: str
    sources_json: str
    fingerprint: str

    def materialize(self):
        return json.loads(self.targets_json), json.loads(self.sources_json)


_snapshot_lock = RLock()
_snapshot_generation = None
_snapshot = None


def clear_catalog_snapshot_cache():
    """Reset after in-place fixture changes; loader resets are detected automatically."""
    global _snapshot_generation, _snapshot
    with _snapshot_lock:
        _snapshot_generation = None
        _snapshot = None


def get_catalog_snapshot():
    """Reuse a snapshot for the lifetime of the existing parsed source generation.

    The source loaders adopt file changes on cache_clear/process restart, as before.
    Keep strong references and compare identity, avoiding scans and id reuse. Static
    in-process lists are not modified in production; in-place fixtures use the reset
    hook. Failed acquisitions are retried rather than cached as a source generation.
    """
    global _snapshot_generation, _snapshot
    with _snapshot_lock:
        try:
            generation = (
                _load_tier2_mid_star_dataset(),
                load_openngc_catalog(),
                BRIGHT_STAR_SCENE_OBJECTS,
                LOCAL_MESSIER_SEARCH_OBJECTS,
                fixed_targets,
                build_openngc_above_me_seed_records,
                find_openngc_record_by_messier_id,
            )
        except Exception:
            logger.exception("Tonight source generation unavailable")
            generation = None
        limits = (HIP_LIMIT, OPENNGC_LIMIT)
        if (
            generation is not None
            and _snapshot_generation is not None
            and limits == _snapshot_generation[1]
            and all(a is b for a, b in zip(generation, _snapshot_generation[0]))
        ):
            return _snapshot
        targets, sources = fixed_targets()
        targets_json = json.dumps(targets, sort_keys=True)
        sources_json = json.dumps(sources, sort_keys=True)
        snapshot = CatalogSnapshot(
            targets_json,
            sources_json,
            hashlib.sha256((targets_json + sources_json).encode()).hexdigest(),
        )
        if generation is not None and all(
            s["status"] == "included" for s in sources.values()
        ):
            _snapshot_generation = (generation, limits)
            _snapshot = snapshot
        return snapshot

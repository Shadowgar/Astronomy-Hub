"""Bounded existing catalogs, acquired without a current-horizon filter."""

import logging

from backend.app.services.openngc_dso_catalog_service import (
    build_openngc_above_me_seed_records,
    find_openngc_record_by_messier_id,
)
from backend.app.services.sky_catalog_service import LOCAL_MESSIER_SEARCH_OBJECTS
from backend.app.services.sky_star_catalog import (
    BRIGHT_STAR_SCENE_OBJECTS,
    build_tier2_mid_star_scene_objects,
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
            lambda: sorted(
                build_tier2_mid_star_scene_objects(),
                key=lambda s: (float(s["magnitude"]), str(s["id"])),
            )[:HIP_LIMIT],
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

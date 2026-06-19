from __future__ import annotations

import re
from typing import Any


OPENNGC_SOURCE_ATTRIBUTION = {
    "name": "OpenNGC",
    "source_key": "openngc_local",
    "license_note": "OpenNGC by Mattia Verga, CC-BY-SA-4.0",
    "source_url": "https://github.com/mattiaverga/OpenNGC",
}

MESSIER_LOCAL_SOURCE_ATTRIBUTION = {
    "name": "Messier local seed",
    "source_key": "messier_local_seed",
}

OBJECT_TYPE_LABELS = {
    "dso": "Deep-Sky Object",
    "dark_nebula": "Dark Nebula",
    "galaxy": "Galaxy",
    "globular_cluster": "Globular Cluster",
    "group_of_galaxies": "Galaxy Group",
    "group_of_stars": "Star Group",
    "multiple_objects": "Multiple Objects",
    "nebula": "Nebula",
    "open_cluster": "Open Cluster",
    "pair_of_galaxies": "Galaxy Pair",
    "planetary_nebula": "Planetary Nebula",
    "supernova_remnant": "Supernova Remnant",
}


def enrich_openngc_payload(payload: dict[str, Any], record: dict[str, Any]) -> dict[str, Any]:
    enriched = dict(payload)
    aliases = _unique([*(record.get("aliases") or []), *caldwell_aliases(record)])
    common_names = list(record.get("common_names") or [])
    object_type = str(record.get("object_type") or "dso")

    enriched.update(
        {
            "canonical_id": str(record.get("source_id") or enriched.get("source_id") or ""),
            "aliases": aliases,
            "common_names": common_names,
            "object_type_label": object_type_label(object_type),
            "description": None,
            "observing_notes": None,
            "source_attribution": [dict(OPENNGC_SOURCE_ATTRIBUTION)],
            "data_sources": {
                "identity": ["OpenNGC"],
                "position": ["OpenNGC"],
                "photometry": ["OpenNGC"],
                "aliases": ["OpenNGC"],
                "upstream": ["NED", "HyperLEDA", "SIMBAD", "HEASARC"],
            },
            "enrichment_status": {
                "identity": "source_backed",
                "aliases": "source_backed",
                "description": "not_available",
            },
        }
    )
    return enriched


def enrich_messier_payload(payload: dict[str, Any], openngc_record: dict[str, Any] | None) -> dict[str, Any]:
    enriched = dict(payload)
    enriched["canonical_id"] = str(payload.get("source_id") or "")
    enriched["object_type_label"] = object_type_label(str(payload.get("object_type") or "dso"))
    enriched["source_attribution"] = [dict(MESSIER_LOCAL_SOURCE_ATTRIBUTION)]
    enriched["data_sources"] = {
        "identity": ["Messier local seed"],
        "position": ["Messier local seed"],
        "photometry": ["Messier local seed"],
        "aliases": ["Messier local seed"],
    }
    enriched["enrichment_status"] = {
        "identity": "source_backed",
        "aliases": "source_backed",
        "description": "not_available",
    }
    enriched.setdefault("description", None)
    enriched.setdefault("observing_notes", None)

    if not openngc_record:
        return enriched

    aliases = _unique(
        [
            *(payload.get("names") or []),
            *(openngc_record.get("aliases") or []),
            *caldwell_aliases(openngc_record),
        ]
    )
    common_names = list(openngc_record.get("common_names") or [])
    source_attribution = list(enriched["source_attribution"])
    source_attribution.append(dict(OPENNGC_SOURCE_ATTRIBUTION))
    enriched.update(
        {
            "aliases": aliases,
            "common_names": common_names,
            "constellation": openngc_record.get("constellation") or payload.get("constellation"),
            "angular_size": openngc_record.get("angular_size") or payload.get("angular_size"),
            "cross_ids": {
                "openngc": openngc_record.get("source_id"),
                "ngc": openngc_record.get("ngc_cross_id"),
                "ic": openngc_record.get("ic_cross_id"),
            },
            "source_attribution": source_attribution,
            "data_sources": {
                "identity": ["Messier local seed"],
                "position": ["Messier local seed", "OpenNGC"],
                "photometry": ["Messier local seed", "OpenNGC"],
                "aliases": ["Messier local seed", "OpenNGC"],
                "upstream": ["NED", "HyperLEDA", "SIMBAD", "HEASARC"],
            },
        }
    )
    return enriched


def caldwell_aliases(record: dict[str, Any]) -> list[str]:
    aliases: list[str] = []
    values = [*(record.get("identifiers") or []), *(record.get("aliases") or [])]
    for value in values:
        match = re.fullmatch(r"\s*C\s*0*([1-9][0-9]*)\s*", str(value or ""), flags=re.IGNORECASE)
        if not match:
            continue
        number = int(match.group(1))
        aliases.extend(
            [
                f"C{number}",
                f"C {number}",
                f"C{number:03d}",
                f"C {number:03d}",
                f"Caldwell {number}",
            ]
        )
    return _unique(aliases)


def object_type_label(object_type: str | None) -> str:
    key = str(object_type or "dso").strip().lower()
    return OBJECT_TYPE_LABELS.get(key, key.replace("_", " ").title() if key else "Deep-Sky Object")


def _unique(values: list[Any]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        text = str(value or "").strip()
        if not text or text in seen:
            continue
        seen.add(text)
        result.append(text)
    return result

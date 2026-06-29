from __future__ import annotations

from pathlib import Path
from typing import Iterable

from .common import coordinates, finite, read_vizier_tsv, source_attribution, unique_strings


def load_wds(path: str | Path) -> Iterable[dict]:
    source = source_attribution(
        source_key="wds",
        name="Washington Double Star Catalog via CDS B/wds",
        source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/B/wds",
        version="2026-03-24",
        license_note="Acknowledge the Washington Double Star Catalog maintained at the U.S. Naval Observatory.",
    )
    for row in read_vizier_tsv(path):
        position = coordinates(row)
        wds = str(row.get("WDS") or "").strip()
        discoverer = " ".join(str(row.get("Disc") or "").split())
        component = str(row.get("Comp") or "").strip()
        if position is None or not wds:
            continue
        ra, dec = position
        identity_parts = [wds]
        if discoverer:
            identity_parts.append(discoverer.replace(" ", ""))
        if component:
            identity_parts.append(component.replace(" ", ""))
        display = " ".join(value for value in (discoverer, component) if value) or f"WDS {wds}"
        double_star = {
            key: value
            for key, value in (
                ("component", component or None),
                ("position_angle_deg", finite(row.get("pa2"))),
                ("separation_arcsec", finite(row.get("sep2"))),
                ("primary_magnitude", finite(row.get("mag1"))),
                ("secondary_magnitude", finite(row.get("mag2"))),
            )
            if value is not None
        }
        yield {
            "catalog": "Washington Double Star",
            "source_id": ":".join(identity_parts),
            "model": "star",
            "display_name": display,
            "category": "double-stars",
            "object_type": "double_star",
            "ra": ra,
            "dec": dec,
            "names": unique_strings(display, f"WDS {wds}"),
            "aliases": unique_strings(f"WDS {wds}", f"WDS{wds}", discoverer, discoverer.replace(" ", "")),
            "types": ["double_star"],
            "double_star": double_star,
            "magnitude": finite(row.get("mag1")),
            "source_attribution": source,
        }

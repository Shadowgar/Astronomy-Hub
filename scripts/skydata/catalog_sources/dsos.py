from __future__ import annotations

import gzip
import json
from pathlib import Path
import re
from typing import Iterable

from .common import coordinates, finite, integer_text, read_vizier_tsv, source_attribution, unique_strings


OPENNGC_SOURCE = source_attribution(
    source_key="openngc_local",
    name="OpenNGC by Mattia Verga",
    source_url="https://github.com/mattiaverga/OpenNGC",
    license_note="CC-BY-SA-4.0",
)


def load_openngc(path: str | Path) -> Iterable[dict]:
    with gzip.open(path, "rt", encoding="utf-8") as handle:
        payload = json.load(handle)
    for row in payload.get("objects") or payload.get("records") or []:
        ra = finite(row.get("ra"))
        dec = finite(row.get("dec"))
        if ra is None or dec is None:
            continue
        aliases = unique_strings(row.get("aliases"))
        for alias in list(aliases):
            match = re.fullmatch(r"C\s*0*([1-9][0-9]*)", alias, re.IGNORECASE)
            if match:
                aliases = unique_strings(aliases, f"Caldwell {int(match.group(1))}")
        record = {
            "catalog": str(row.get("catalog") or "OpenNGC (local)"),
            "source_id": str(row.get("source_id") or "").strip(),
            "model": "dso",
            "display_name": str(row.get("display_name") or row.get("source_id") or "").strip(),
            "category": "dsos",
            "object_type": str(row.get("object_type") or "dso"),
            "ra": ra,
            "dec": dec,
            "names": unique_strings(row.get("names"), row.get("display_name")),
            "aliases": aliases,
            "common_names": unique_strings(row.get("common_names")),
            "types": unique_strings(row.get("types"), row.get("raw_type")) or ["dso"],
            "source_attribution": OPENNGC_SOURCE,
        }
        for field in ("magnitude", "angular_size"):
            if row.get(field) is not None:
                record[field] = row[field]
        if record["source_id"]:
            yield record


def load_vizier_dsos(path: str | Path, profile: str) -> Iterable[dict]:
    for row in read_vizier_tsv(path):
        position = coordinates(row)
        if position is None:
            continue
        ra, dec = position
        record = _profile_record(profile, row, ra, dec)
        if record:
            yield record


def _profile_record(profile: str, row: dict[str, str], ra: float, dec: float) -> dict | None:
    if profile == "barnard":
        number = integer_text(row.get("Barn"))
        if not number:
            return None
        return _dso_record(
            catalog="Barnard",
            source_id=f"B{number}",
            display_name=f"Barnard {number}",
            aliases=[f"B {number}", f"Barnard {number}"],
            object_type="dark_nebula",
            types=["DN"],
            ra=ra,
            dec=dec,
            source_key="barnard_vii_220a",
            source_name="Barnard Dark Objects via CDS VII/220A",
            source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/220A",
            angular_size=_major_size(row.get("Diam")),
        )
    if profile == "lbn":
        number = integer_text(row.get("Seq"))
        if not number:
            return None
        return _dso_record(
            catalog="Lynds Bright Nebula",
            source_id=f"LBN{number}",
            display_name=f"LBN {number}",
            aliases=[f"LBN{number}", f"Lynds Bright Nebula {number}", row.get("Name")],
            object_type="bright_nebula",
            types=["BN"],
            ra=ra,
            dec=dec,
            source_key="lbn_vii_9",
            source_name="Lynds Bright Nebulae via CDS VII/9",
            source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/9",
            angular_size=_major_minor(row.get("Diam1"), row.get("Diam2")),
        )
    if profile == "ldn":
        number = integer_text(row.get("LDN"))
        if not number:
            return None
        record = _dso_record(
            catalog="Lynds Dark Nebula",
            source_id=f"LDN{number}",
            display_name=f"LDN {number}",
            aliases=[f"LDN{number}", f"Lynds Dark Nebula {number}"],
            object_type="dark_nebula",
            types=["DN"],
            ra=ra,
            dec=dec,
            source_key="ldn_vii_7a",
            source_name="Lynds Dark Nebulae via CDS VII/7A",
            source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/7A",
        )
        opacity = finite(row.get("Opacity"))
        if opacity is not None:
            record["description"] = f"Source catalog opacity class {int(opacity)}"
        return record
    if profile == "sharpless":
        number = integer_text(row.get("Sh2"))
        if not number:
            return None
        return _dso_record(
            catalog="Sharpless",
            source_id=f"Sh2-{number}",
            display_name=f"Sharpless 2-{number}",
            aliases=[f"Sh 2-{number}", f"Sh2-{number}", f"Sharpless {number}"],
            object_type="hii_region",
            types=["HII"],
            ra=ra,
            dec=dec,
            source_key="sharpless_vii_20",
            source_name="Sharpless H II Regions via CDS VII/20",
            source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/20",
            angular_size=_major_size(row.get("Diam")),
        )
    if profile == "open_clusters":
        name = str(row.get("Cluster") or "").strip()
        if not name:
            return None
        aliases = _cluster_aliases(name)
        family = next(
            (prefix for prefix in ("Collinder", "Melotte", "Trumpler") if name.startswith(f"{prefix} ")),
            "Open Cluster",
        )
        return _dso_record(
            catalog=f"{family} (Dias)",
            source_id=name.replace(" ", ""),
            display_name=name,
            aliases=aliases,
            object_type="open_cluster",
            types=["OC"],
            ra=ra,
            dec=dec,
            source_key="dias_open_clusters",
            source_name="Dias Optically Visible Open Clusters via CDS B/ocl",
            source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/B/ocl",
            angular_size=_major_size(row.get("Diam")),
        )
    if profile == "arp":
        number = integer_text(row.get("APG"))
        if not number:
            return None
        return _dso_record(
            catalog="Arp",
            source_id=f"Arp{number}",
            display_name=f"Arp {number}",
            aliases=[f"Arp{number}", row.get("Name")],
            object_type="peculiar_galaxy",
            types=["G"],
            ra=ra,
            dec=dec,
            source_key="arp_vii_74a",
            source_name="Atlas of Peculiar Galaxies via CDS VII/74A",
            source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/74A",
        )
    if profile == "markarian":
        number = integer_text(row.get("Mkn"))
        if not number:
            return None
        record = _dso_record(
            catalog="Markarian",
            source_id=f"Mrk{number}",
            display_name=f"Markarian {number}",
            aliases=[f"Mrk {number}", f"Mrk{number}", f"Mkn {number}", row.get("Name1"), row.get("Name2")],
            object_type="active_galaxy",
            types=["G"],
            ra=ra,
            dec=dec,
            source_key="markarian_vii_61a",
            source_name="Markarian Galaxies via CDS VII/61A",
            source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/61A",
        )
        magnitude = finite(row.get("Mag"))
        if magnitude is not None:
            record["magnitude"] = magnitude
        return record
    if profile == "3c":
        number = str(row.get("3C") or "").strip()
        if not number:
            return None
        return _dso_record(
            catalog="3C",
            source_id=f"3C{number}",
            display_name=f"3C {number}",
            aliases=[f"3C{number}"],
            object_type="radio_source",
            types=["Rad"],
            ra=ra,
            dec=dec,
            source_key="3c_viii_1a",
            source_name="Third Cambridge 3C Catalogue via CDS VIII/1A",
            source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/VIII/1A",
            flux=finite(row.get("S159MHz")),
        )
    raise ValueError(f"unknown DSO profile: {profile}")


def _dso_record(*, angular_size: dict | None = None, flux: float | None = None, **values: object) -> dict:
    aliases = unique_strings(values.pop("aliases"))
    source_key = str(values.pop("source_key"))
    source_name = str(values.pop("source_name"))
    source_url = str(values.pop("source_url"))
    record = {
        **values,
        "model": "dso",
        "category": "dsos",
        "names": unique_strings(values["display_name"], aliases),
        "aliases": aliases,
        "source_attribution": source_attribution(
            source_key=source_key, name=source_name, source_url=source_url
        ),
    }
    if angular_size:
        record["angular_size"] = angular_size
    if flux is not None:
        record["flux"] = flux
    return record


def _major_size(value: object) -> dict | None:
    major = finite(value)
    return {"major_arcmin": major} if major is not None else None


def _major_minor(major_value: object, minor_value: object) -> dict | None:
    major = finite(major_value)
    minor = finite(minor_value)
    if major is None and minor is None:
        return None
    return {key: value for key, value in (("major_arcmin", major), ("minor_arcmin", minor)) if value is not None}


def _cluster_aliases(name: str) -> list[str]:
    aliases = [name.replace(" ", "")]
    replacements = {
        "Collinder ": "Cr ",
        "Melotte ": "Mel ",
        "Trumpler ": "Tr ",
    }
    for long_name, short_name in replacements.items():
        if name.startswith(long_name):
            number = name.removeprefix(long_name).strip()
            aliases.extend([f"{short_name}{number}", f"{short_name.strip()}{number}"])
    return unique_strings(aliases)

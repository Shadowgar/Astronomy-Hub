from __future__ import annotations

import csv
import math
from pathlib import Path
from typing import Iterable


VIZIER_LICENSE_NOTE = "CDS/VizieR catalogue usage and source acknowledgement requirements apply."


def read_vizier_tsv(path: str | Path) -> Iterable[dict[str, str]]:
    lines = [
        line
        for line in Path(path).read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    ]
    if not lines:
        return
    reader = csv.DictReader(lines, delimiter="\t")
    first_field = reader.fieldnames[0] if reader.fieldnames else ""
    for row in reader:
        first_value = str(row.get(first_field) or "").strip()
        if not first_value or first_value.lower() in {"deg", "h:m:s"}:
            continue
        if set(first_value) <= {"-"}:
            continue
        yield {key: str(value or "").strip() for key, value in row.items() if key is not None}


def coordinates(row: dict[str, str]) -> tuple[float, float] | None:
    ra = finite(row.get("_RAJ2000"))
    dec = finite(row.get("_DEJ2000"))
    if ra is None or dec is None or not 0 <= ra < 360 or not -90 <= dec <= 90:
        return None
    return ra, dec


def finite(value: object) -> float | None:
    try:
        number = float(str(value).strip())
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def integer_text(value: object) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return str(int(float(text)))
    except ValueError:
        return text


def unique_strings(*groups: object) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for group in groups:
        values = group if isinstance(group, (list, tuple, set)) else [group]
        for value in values:
            text = str(value or "").strip()
            key = text.casefold()
            if text and key not in seen:
                seen.add(key)
                result.append(text)
    return result


def source_attribution(
    *, source_key: str, name: str, source_url: str, version: str | None = None, license_note: str = VIZIER_LICENSE_NOTE
) -> list[dict[str, str]]:
    source = {
        "source_key": source_key,
        "name": name,
        "source_url": source_url,
        "license_note": license_note,
    }
    if version:
        source["version"] = version
    return [source]


def sexagesimal_ra(value: str) -> float | None:
    try:
        hours, minutes, seconds = (float(part) for part in value.strip().split(":"))
    except (TypeError, ValueError):
        return None
    if not 0 <= hours < 24 or not 0 <= minutes < 60 or not 0 <= seconds < 60:
        return None
    return (hours + minutes / 60 + seconds / 3600) * 15


def sexagesimal_dec(value: str) -> float | None:
    text = str(value or "").strip()
    sign = -1 if text.startswith("-") else 1
    try:
        degrees, minutes, seconds = (float(part) for part in text.lstrip("+-").split(":"))
    except (TypeError, ValueError):
        return None
    if not 0 <= degrees <= 90 or not 0 <= minutes < 60 or not 0 <= seconds < 60:
        return None
    if degrees == 90 and (minutes != 0 or seconds != 0):
        return None
    return sign * (degrees + minutes / 60 + seconds / 3600)

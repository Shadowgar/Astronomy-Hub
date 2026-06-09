from __future__ import annotations

import re
from urllib.parse import urlencode


DEFAULT_SKY_ENGINE_BASE_PATH = "/oras-sky-engine"


def build_sky_engine_object_url(
    *,
    catalog: str,
    source_id: str,
    model: str,
    ra: float,
    dec: float,
    name: str | None = None,
    time: str | None = None,
    fov: float | None = None,
    lat: float | None = None,
    lng: float | None = None,
    elev: float | int | None = None,
    base_path: str = DEFAULT_SKY_ENGINE_BASE_PATH,
) -> str:
    """Build an exact ORAS Sky Engine object URL.

    catalog + source_id + model are the authoritative identity. The path slug is
    cosmetic and source_id is always serialized as a string to protect Gaia IDs.
    """

    identity = {
        "catalog": _required_text(catalog, "catalog"),
        "source_id": _required_text(str(source_id), "source_id"),
        "model": _required_text(model, "model"),
    }
    ra_value = _required_float(ra, "ra")
    dec_value = _required_float(dec, "dec")

    query: dict[str, str] = {
        **identity,
        "ra": _format_float(ra_value),
        "dec": _format_float(dec_value),
    }
    if fov is not None:
        query["fov"] = _format_float(_required_float(fov, "fov"))
    if time:
        query["date"] = str(time).strip()
    if lat is not None:
        query["lat"] = _format_float(_required_float(lat, "lat"))
    if lng is not None:
        query["lng"] = _format_float(_required_float(lng, "lng"))
    if elev is not None:
        query["elev"] = _format_float(_required_float(elev, "elev"))

    normalized_base = "/" + str(base_path or DEFAULT_SKY_ENGINE_BASE_PATH).strip("/")
    slug = _slugify(name or identity["source_id"])
    return f"{normalized_base}/skysource/{slug}?{urlencode(query)}"


def _required_text(value: str, field_name: str) -> str:
    normalized = str(value or "").strip()
    if not normalized:
        raise ValueError(f"{field_name} is required")
    return normalized


def _required_float(value: float | int | str, field_name: str) -> float:
    try:
        number = float(value)
    except Exception as exc:
        raise ValueError(f"{field_name} must be numeric") from exc
    return number


def _format_float(value: float) -> str:
    return f"{float(value):.10f}".rstrip("0").rstrip(".")


def _slugify(value: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9]+", "", str(value or "").strip())
    return slug or "object"

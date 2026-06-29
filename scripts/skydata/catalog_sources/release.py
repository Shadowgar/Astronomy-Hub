from __future__ import annotations

from dataclasses import dataclass
from collections import Counter
from pathlib import Path

from scripts.skydata.catalog_pack import CatalogPackSpec, build_catalog_release, validate_catalog_release

from .dsos import load_openngc, load_vizier_dsos
from .doubles import load_wds
from .stars import load_hipparcos, load_vizier_stars
from .unusual import load_atnf, load_vizier_unusual


@dataclass(frozen=True)
class CatalogReleaseInputs:
    hipparcos: Path
    openngc: Path
    star_sources: tuple[tuple[str, Path], ...]
    dso_sources: tuple[tuple[str, Path], ...]
    wds: Path
    atnf: Path
    unusual_sources: tuple[tuple[str, Path], ...]


def build_source_release(
    inputs: CatalogReleaseInputs,
    output_root: str | Path,
    *,
    release_version: str,
    generated_at: str | None = None,
    chunk_size: int = 2_000,
) -> dict:
    stars = list(load_hipparcos(inputs.hipparcos))
    for profile, path in inputs.star_sources:
        stars.extend(load_vizier_stars(path, profile))
    stars = drop_ambiguous_identities(stars)

    dsos = list(load_openngc(inputs.openngc))
    for profile, path in inputs.dso_sources:
        dsos.extend(load_vizier_dsos(path, profile))
    dsos = drop_ambiguous_identities(dsos)

    doubles = drop_ambiguous_identities(list(load_wds(inputs.wds)))
    unusual = list(load_atnf(inputs.atnf))
    for profile, path in inputs.unusual_sources:
        unusual.extend(load_vizier_unusual(path, profile))
    unusual = drop_ambiguous_identities(unusual)

    packs = (
        (_spec("stars-core", "ORAS Stars Core", "stars", release_version, stars, overlay_limit=300), stars),
        (_spec("dso-expanded", "ORAS Expanded DSOs", "dsos", release_version, dsos, overlay_limit=800), dsos),
        (_spec("double-stars", "ORAS Double Stars", "double-stars", release_version, doubles, overlay_limit=300), doubles),
        (
            _spec(
                "unusual-objects",
                "ORAS Pulsars, Quasars, and Black Holes",
                "unusual-objects",
                release_version,
                unusual,
                overlay_limit=300,
            ),
            unusual,
        ),
    )
    manifest = build_catalog_release(
        output_root,
        release_version=release_version,
        generated_at=generated_at,
        chunk_size=chunk_size,
        packs=packs,
    )
    errors = validate_catalog_release(output_root)
    if errors:
        raise ValueError("invalid generated catalog release: " + "; ".join(errors))
    return manifest


def drop_ambiguous_identities(records: list[dict]) -> list[dict]:
    identities = [
        (str(record.get("catalog")), str(record.get("source_id")), str(record.get("model")))
        for record in records
    ]
    counts = Counter(identities)
    return [record for record, identity in zip(records, identities) if counts[identity] == 1]


def _spec(
    pack_id: str,
    label: str,
    category: str,
    version: str,
    records: list[dict],
    *,
    overlay_limit: int,
) -> CatalogPackSpec:
    return CatalogPackSpec(
        pack_id=pack_id,
        label=label,
        category=category,
        version=version,
        sources=tuple(_pack_sources(records)),
        overlay_limit=overlay_limit,
    )


def _pack_sources(records: list[dict]) -> list[dict]:
    sources: dict[str, dict] = {}
    for record in records:
        for source in record.get("source_attribution") or []:
            key = str(source.get("source_key") or "").strip()
            if key:
                sources[key] = dict(source)
    return [sources[key] for key in sorted(sources)]

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import json
from pathlib import Path
import re
from typing import Any, Iterable


REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_CATALOG_REGISTRY_PATH = REPO_ROOT / "backend/app/data/sky/catalog_registry.json"


@dataclass(frozen=True)
class CatalogPrefixRule:
    pattern: re.Pattern[str]
    number_min: int
    number_max: int
    alias_templates: tuple[str, ...]


@dataclass(frozen=True)
class CatalogSourceManifest:
    source_key: str
    display_name: str
    catalog_family: str
    source_authority: str
    source_url: str | None
    acquisition_method: str
    license_note: str
    enrichment_status: str
    supports_common_names: bool
    compact_id_normalization: bool
    optional_metadata_fields: tuple[str, ...]
    importer_route: str | None
    prefix_patterns: tuple[CatalogPrefixRule, ...]

    def attribution(self) -> dict[str, Any]:
        return {
            "name": self.display_name,
            "source_key": self.source_key,
            "source_authority": self.source_authority,
            "source_url": self.source_url,
            "license_note": self.license_note,
            "enrichment_status": self.enrichment_status,
        }


@dataclass(frozen=True)
class CatalogRegistry:
    schema_version: int
    sources_by_key: dict[str, CatalogSourceManifest]
    alias_sources: tuple[CatalogSourceManifest, ...]


@dataclass(frozen=True)
class CatalogAliasExpansion:
    aliases: tuple[str, ...]
    source_keys: tuple[str, ...]
    source_attribution: tuple[dict[str, Any], ...]
    catalog_families: tuple[str, ...]


@lru_cache(maxsize=1)
def load_catalog_registry(path: str | Path | None = None) -> CatalogRegistry:
    registry_path = Path(path) if path is not None else DEFAULT_CATALOG_REGISTRY_PATH
    payload = json.loads(registry_path.read_text(encoding="utf-8"))
    schema_version = int(payload.get("schema_version") or 0)
    if schema_version != 1:
        raise ValueError("unsupported catalog registry schema version")

    sources_by_key: dict[str, CatalogSourceManifest] = {}
    alias_sources: list[CatalogSourceManifest] = []
    for raw_source in payload.get("sources") or []:
        source = _parse_source_manifest(raw_source)
        if source.source_key in sources_by_key:
            raise ValueError(f"duplicate catalog registry source_key: {source.source_key}")
        sources_by_key[source.source_key] = source
        if source.prefix_patterns:
            alias_sources.append(source)

    return CatalogRegistry(
        schema_version=schema_version,
        sources_by_key=sources_by_key,
        alias_sources=tuple(alias_sources),
    )


def expand_source_backed_aliases(values: Iterable[Any]) -> CatalogAliasExpansion:
    registry = load_catalog_registry()
    aliases: list[str] = []
    matched_sources: list[CatalogSourceManifest] = []

    for raw_value in values:
        value = str(raw_value or "").strip()
        if not value:
            continue
        for source in registry.alias_sources:
            for rule in source.prefix_patterns:
                match = rule.pattern.fullmatch(value)
                if not match:
                    continue
                number = int(match.group(1))
                if not rule.number_min <= number <= rule.number_max:
                    continue
                aliases.extend(template.format(number=number) for template in rule.alias_templates)
                if source not in matched_sources:
                    matched_sources.append(source)

    unique_aliases = tuple(dict.fromkeys(aliases))
    return CatalogAliasExpansion(
        aliases=unique_aliases,
        source_keys=tuple(source.source_key for source in matched_sources),
        source_attribution=tuple(source.attribution() for source in matched_sources),
        catalog_families=tuple(dict.fromkeys(source.catalog_family for source in matched_sources)),
    )


def _parse_source_manifest(raw_source: Any) -> CatalogSourceManifest:
    if not isinstance(raw_source, dict):
        raise ValueError("catalog registry sources must be objects")

    required = (
        "source_key",
        "display_name",
        "catalog_family",
        "source_authority",
        "acquisition_method",
        "license_note",
        "enrichment_status",
    )
    values = {key: str(raw_source.get(key) or "").strip() for key in required}
    if any(not value for value in values.values()):
        raise ValueError("catalog registry source is missing required metadata")

    prefix_patterns = tuple(
        _parse_prefix_rule(rule)
        for rule in raw_source.get("prefix_patterns") or []
    )
    source_url = str(raw_source.get("source_url") or "").strip() or None
    optional_metadata_fields = tuple(
        dict.fromkeys(
            str(value).strip()
            for value in raw_source.get("optional_metadata_fields") or []
            if str(value).strip()
        )
    )
    importer_route = str(raw_source.get("importer_route") or "").strip() or None
    return CatalogSourceManifest(
        source_key=values["source_key"],
        display_name=values["display_name"],
        catalog_family=values["catalog_family"],
        source_authority=values["source_authority"],
        source_url=source_url,
        acquisition_method=values["acquisition_method"],
        license_note=values["license_note"],
        enrichment_status=values["enrichment_status"],
        supports_common_names=raw_source.get("supports_common_names") is True,
        compact_id_normalization=raw_source.get("compact_id_normalization") is True,
        optional_metadata_fields=optional_metadata_fields,
        importer_route=importer_route,
        prefix_patterns=prefix_patterns,
    )


def _parse_prefix_rule(raw_rule: Any) -> CatalogPrefixRule:
    if not isinstance(raw_rule, dict):
        raise ValueError("catalog registry prefix rules must be objects")
    pattern_text = str(raw_rule.get("pattern") or "").strip()
    templates = tuple(
        str(value).strip()
        for value in raw_rule.get("alias_templates") or []
        if str(value).strip()
    )
    if not pattern_text or not templates:
        raise ValueError("catalog registry prefix rule is incomplete")

    number_min = int(raw_rule.get("number_min") or 0)
    number_max = int(raw_rule.get("number_max") or 0)
    if number_min < 1 or number_max < number_min:
        raise ValueError("catalog registry prefix rule has invalid bounds")

    return CatalogPrefixRule(
        pattern=re.compile(pattern_text, flags=re.IGNORECASE),
        number_min=number_min,
        number_max=number_max,
        alias_templates=templates,
    )

from __future__ import annotations

import argparse
import json
from pathlib import Path

from scripts.skydata.catalog_pack import (
    CatalogPackSpec,
    build_catalog_release,
    validate_catalog_release,
)


def build_from_config(config_path: str | Path, output_root: str | Path) -> dict:
    path = Path(config_path)
    config = json.loads(path.read_text(encoding="utf-8"))
    packs = []
    for raw_pack in config.get("packs") or []:
        input_path = path.parent / str(raw_pack["input"])
        records = [
            json.loads(line)
            for line in input_path.read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        spec = CatalogPackSpec(
            pack_id=str(raw_pack["pack_id"]),
            label=str(raw_pack["label"]),
            category=str(raw_pack["category"]),
            version=str(raw_pack["version"]),
            sources=tuple(raw_pack.get("sources") or []),
            overlay_limit=int(raw_pack.get("overlay_limit") or 0),
            load_mode=str(raw_pack.get("load_mode") or "browser-index"),
        )
        packs.append((spec, records))
    return build_catalog_release(
        output_root,
        release_version=str(config["release_version"]),
        generated_at=config.get("generated_at"),
        chunk_size=int(config.get("chunk_size") or 2_000),
        packs=packs,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Build mounted ORAS catalog release packs")
    parser.add_argument("config", type=Path)
    parser.add_argument("--output", type=Path, default=Path("data/runtime-packs/catalog-packs"))
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()

    if not args.validate_only:
        manifest = build_from_config(args.config, args.output)
        print(json.dumps(manifest, indent=2, sort_keys=True))
    errors = validate_catalog_release(args.output)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print(f"Validated ORAS catalog release at {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

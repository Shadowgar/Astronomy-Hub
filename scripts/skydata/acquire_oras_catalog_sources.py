from __future__ import annotations

import argparse
import json
from pathlib import Path

from scripts.skydata.catalog_sources.acquisition import acquire_sources


def main() -> int:
    parser = argparse.ArgumentParser(description="Acquire public source catalogs for ORAS mounted packs")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/catalog-sources/oras-major-catalog-update-1"),
    )
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    print(json.dumps(acquire_sources(args.output, force=args.force), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

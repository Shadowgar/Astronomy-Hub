#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json

from scripts.skydata.common import load_manifest, write_json


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Normalize a skydata manifest template")
    parser.add_argument("manifest", help="Path to the source manifest JSON file")
    parser.add_argument("--output", help="Optional path for the normalized manifest JSON")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest = load_manifest(args.manifest)
    if args.output:
        write_json(args.output, manifest)
    else:
        print(json.dumps(manifest, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
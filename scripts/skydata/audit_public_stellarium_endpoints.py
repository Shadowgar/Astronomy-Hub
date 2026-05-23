#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse


def classify_url(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path
    if "api.noctuasky.com" in parsed.netloc:
        return "search-api"
    if path.endswith(".wasm"):
        return "runtime-wasm"
    if "/stars/properties" in path:
        return "stars-properties"
    if "/stars/" in path and path.endswith(".eph"):
        return "stars-tiles"
    if "/dso/properties" in path:
        return "dso-properties"
    if "/dso/" in path and path.endswith(".eph"):
        return "dso-tiles"
    if "/surveys/gaia/" in path:
        return "gaia-survey"
    if "/surveys/milkyway/" in path:
        return "milkyway-survey"
    if "/landscapes/" in path:
        return "landscapes"
    if "/skycultures/" in path:
        return "skycultures"
    if path.endswith("mpcorb.dat"):
        return "minor-planets"
    if path.endswith("CometEls.txt"):
        return "comets"
    if path.endswith("tle_satellite.jsonl.gz"):
        return "satellites"
    return "other"


def summarize_urls(urls: list[str]) -> dict[str, object]:
    counts = Counter(classify_url(url) for url in urls)
    examples: dict[str, str] = {}
    for url in urls:
        category = classify_url(url)
        examples.setdefault(category, url)
    return {
        "total_urls": len(urls),
        "categories": [{"category": category, "count": counts[category], "example": examples.get(category)} for category in sorted(counts)],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Summarize public Stellarium resource URLs")
    parser.add_argument("input", help="Path to a JSON array file or newline-delimited text file of URLs")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    raw_text = input_path.read_text(encoding="utf-8")
    if input_path.suffix == ".json":
        urls = json.loads(raw_text)
    else:
        urls = [line.strip() for line in raw_text.splitlines() if line.strip()]
    print(json.dumps(summarize_urls(urls), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

URL_RE = re.compile(r"https?://[^\s\"'<>]+")
KEEP_RE = re.compile(r"/swe-data-packs/(minimal|base|extended)/", re.IGNORECASE)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Extract runtime pack resource URLs from logs/text.")
    p.add_argument("--input", required=True, help="Input text/json/jsonl file path")
    p.add_argument("--output", required=True, help="Output URL list path")
    return p.parse_args()


def extract_urls(text: str) -> list[str]:
    return URL_RE.findall(text)


def main() -> int:
    args = parse_args()
    path = Path(args.input)
    text = path.read_text(encoding="utf-8", errors="replace")
    urls: list[str] = []

    if path.suffix.lower() in {".json", ".jsonl"}:
        rows = []
        if path.suffix.lower() == ".jsonl":
            for line in text.splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except Exception:
                    urls.extend(extract_urls(line))
        else:
            try:
                parsed = json.loads(text)
                rows = parsed if isinstance(parsed, list) else [parsed]
            except Exception:
                rows = []
                urls.extend(extract_urls(text))
        for row in rows:
            if isinstance(row, str):
                urls.extend(extract_urls(row))
                continue
            if not isinstance(row, dict):
                continue
            for key in ("url", "name", "request", "resource"):
                value = row.get(key)
                if isinstance(value, str):
                    urls.extend(extract_urls(value))
    else:
        urls.extend(extract_urls(text))

    filtered = []
    seen = set()
    for url in urls:
        clean = url.rstrip(").,;\"")
        if KEEP_RE.search(clean) and ("/stars/" in clean or "/dso/" in clean) and clean not in seen:
            filtered.append(clean)
            seen.add(clean)

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(filtered) + ("\n" if filtered else ""), encoding="utf-8")
    print(json.dumps({"input": str(path), "output": str(out), "count": len(filtered)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

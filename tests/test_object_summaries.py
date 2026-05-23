from __future__ import annotations

import json
from pathlib import Path


SUMMARY_ROOT = Path("frontend/public/oras-sky-engine/skydata/object-media/summaries")


def test_local_summary_index_resolves_core_parity_aliases() -> None:
    index = json.loads((SUMMARY_ROOT / "index.json").read_text(encoding="utf-8"))
    alias_to_file = index["alias_to_file"]

    for alias in ["m31", "messier 31", "ngc 224", "m42", "m45", "jupiter", "moon", "sun", "57 cygni"]:
        assert alias in alias_to_file
        assert (SUMMARY_ROOT / alias_to_file[alias]).exists()


def test_local_summary_files_include_provenance_and_attribution_links() -> None:
    for path in SUMMARY_ROOT.glob("*.json"):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if path.name == "index.json":
            continue
        assert payload["title"]
        assert payload["summary"]
        assert payload["source"]
        assert payload["source_urls"]
        assert payload["provenance"]

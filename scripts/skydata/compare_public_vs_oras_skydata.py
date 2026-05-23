#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

IMAGE_EQUIV_EXTS = {".jpg", ".jpeg", ".webp", ".png"}


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Compare mirrored public Stellarium assets against ORAS skydata.")
    p.add_argument("--mirror-root", type=Path, default=Path("data/runtime-packs"))
    p.add_argument("--oras-root", type=Path, default=Path("frontend/public/oras-sky-engine/skydata"))
    p.add_argument("--out-json", type=Path, default=Path("captured_assets/parity_diff.json"))
    p.add_argument("--out-md", type=Path, default=Path("captured_assets/parity_diff_summary.md"))
    return p.parse_args()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def classify_family(rel: str) -> str:
    p = rel.lower()
    if p.startswith("packs/") and "/stars/" in p:
        return "stars"
    if p.startswith("stars/"):
        return "stars"
    if p.startswith("packs/") and "/dso/" in p:
        return "dso"
    if p.startswith("dso/"):
        return "dso"
    if p.startswith("surveys/dss") or "hips" in p or "surveys/milkyway" in p:
        return "surveys/dss|hips"
    if p.startswith("surveys/sso/"):
        return "sso/planet_textures"
    if "mpcorb" in p or "comet" in p or "tle_satellite" in p:
        return "mpc/comets"
    if p.startswith("landscapes/"):
        return "landscapes"
    if p.startswith("skycultures/"):
        return "skycultures"
    if p.endswith("/properties") or p.endswith(".json") or p.endswith(".js") or p.endswith(".wasm"):
        return "runtime_support"
    return "unknown"


def collect_mirror_files(mirror_root: Path) -> dict[str, Path]:
    files: dict[str, Path] = {}
    if not mirror_root.exists():
        return files
    for p in mirror_root.rglob("*"):
        if not p.is_file():
            continue
        parts = p.parts
        if "runtime-ready" not in parts:
            continue
        idx = parts.index("runtime-ready")
        tail = parts[idx + 1 :]
        if not tail:
            continue
        try:
            sky_idx = tail.index("skydata")
            rel = Path(*tail[sky_idx + 1 :]).as_posix()
        except ValueError:
            rel = Path(*tail).as_posix()
        if rel:
            files[rel] = p
    return files


def collect_oras_files(oras_root: Path) -> dict[str, Path]:
    files: dict[str, Path] = {}
    if not oras_root.exists():
        return files
    for p in oras_root.rglob("*"):
        if p.is_file():
            files[p.relative_to(oras_root).as_posix()] = p
    return files


def image_stem_for_equivalence(rel: str) -> str | None:
    path = Path(rel)
    suffix = path.suffix.lower()
    if suffix not in IMAGE_EQUIV_EXTS:
        return None
    rel_lower = rel.lower()
    if not (
        rel_lower.startswith("surveys/dss/")
        or rel_lower.startswith("surveys/milkyway/")
        or "hips" in rel_lower
    ):
        return None
    return path.with_suffix("").as_posix()


def build_parity_diff(mirror_root: Path, oras_root: Path) -> dict[str, Any]:
    mirror = collect_mirror_files(mirror_root)
    oras = collect_oras_files(oras_root)
    keys = sorted(set(mirror) | set(oras))
    matched_mirror: set[str] = set()
    matched_oras: set[str] = set()

    rows: list[dict[str, Any]] = []
    status_counts = Counter()
    family_counts = Counter()
    family_status_counts: dict[str, Counter] = defaultdict(Counter)
    bytes_by_status = Counter()

    oras_equiv_by_stem: dict[str, list[str]] = defaultdict(list)
    for rel in oras:
        stem = image_stem_for_equivalence(rel)
        if stem:
            oras_equiv_by_stem[stem].append(rel)

    # Equivalence pass: treat same survey tile stem with different image extension as parity-equivalent.
    for mirror_rel in sorted(mirror.keys()):
        if mirror_rel in oras:
            continue
        stem = image_stem_for_equivalence(mirror_rel)
        if not stem:
            continue
        oras_candidates = [candidate for candidate in sorted(oras_equiv_by_stem.get(stem, [])) if candidate not in matched_oras]
        if not oras_candidates:
            continue
        oras_rel = oras_candidates[0]
        m = mirror[mirror_rel]
        o = oras[oras_rel]
        mirror_size = m.stat().st_size
        oras_size = o.stat().st_size
        row = {
            "relative_path": mirror_rel,
            "family": classify_family(mirror_rel),
            "status": "format_equivalent",
            "mirror_path": str(m),
            "oras_path": str(o),
            "mirror_size": mirror_size,
            "oras_size": oras_size,
            "mirror_sha256": sha256_file(m),
            "oras_sha256": sha256_file(o),
            "equivalent_oras_relative_path": oras_rel,
        }
        rows.append(row)
        matched_mirror.add(mirror_rel)
        matched_oras.add(oras_rel)
        status_counts["format_equivalent"] += 1
        family_counts[row["family"]] += 1
        family_status_counts[row["family"]]["format_equivalent"] += 1
        bytes_by_status["format_equivalent"] += int(mirror_size)

    for rel in keys:
        if rel in matched_mirror or rel in matched_oras:
            continue
        m = mirror.get(rel)
        o = oras.get(rel)
        family = classify_family(rel)
        mirror_size = m.stat().st_size if m else None
        oras_size = o.stat().st_size if o else None
        mirror_sha = sha256_file(m) if m else None
        oras_sha = sha256_file(o) if o else None

        if m and o:
            status = "present_both" if mirror_sha == oras_sha else "checksum_mismatch"
        elif m and not o:
            status = "missing_local"
        else:
            status = "extra_local"

        size_for_rollup = mirror_size if mirror_size is not None else (oras_size or 0)
        row = {
            "relative_path": rel,
            "family": family,
            "status": status,
            "mirror_path": str(m) if m else None,
            "oras_path": str(o) if o else None,
            "mirror_size": mirror_size,
            "oras_size": oras_size,
            "mirror_sha256": mirror_sha,
            "oras_sha256": oras_sha,
        }
        rows.append(row)
        status_counts[status] += 1
        family_counts[family] += 1
        family_status_counts[family][status] += 1
        bytes_by_status[status] += int(size_for_rollup)

    mismatch_total = status_counts["checksum_mismatch"] + status_counts["missing_local"] + status_counts["extra_local"]
    mismatch_rate = (mismatch_total / len(rows)) if rows else 0.0

    top_missing = [
        r for r in rows if r["status"] in {"missing_local", "checksum_mismatch"}
    ]
    top_missing = sorted(top_missing, key=lambda r: (r["family"], r["relative_path"]))[:100]

    return {
        "mirror_root": str(mirror_root),
        "oras_root": str(oras_root),
        "file_count": len(rows),
        "status_counts": dict(status_counts),
        "bytes_by_status": dict(bytes_by_status),
        "family_counts": dict(family_counts),
        "family_status_counts": {k: dict(v) for k, v in family_status_counts.items()},
        "mismatch_rate": mismatch_rate,
        "rows": rows,
        "top_missing_or_mismatch": top_missing,
    }


def build_summary(diff: dict[str, Any]) -> str:
    lines = [
        "# Public vs ORAS Skydata Parity Diff Summary",
        "",
        f"- Compared files: {diff['file_count']}",
        f"- Mismatch rate: {diff['mismatch_rate']:.4f}",
        "",
        "## Status counts",
        "",
    ]
    for k in ["present_both", "format_equivalent", "missing_local", "extra_local", "checksum_mismatch"]:
        lines.append(f"- {k}: {diff['status_counts'].get(k, 0)}")
    lines += ["", "## Family rollup", ""]
    for family in sorted(diff["family_counts"].keys()):
        c = diff["family_counts"][family]
        sc = diff["family_status_counts"].get(family, {})
        lines.append(
            f"- {family}: total={c}, present_both={sc.get('present_both', 0)}, "
            f"missing_local={sc.get('missing_local', 0)}, extra_local={sc.get('extra_local', 0)}, checksum_mismatch={sc.get('checksum_mismatch', 0)}"
        )
    lines += ["", "## Top missing/mismatch paths", ""]
    for row in diff["top_missing_or_mismatch"][:40]:
        lines.append(f"- [{row['status']}] {row['relative_path']}")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    diff = build_parity_diff(args.mirror_root, args.oras_root)
    args.out_json.parent.mkdir(parents=True, exist_ok=True)
    args.out_md.parent.mkdir(parents=True, exist_ok=True)
    args.out_json.write_text(json.dumps(diff, indent=2), encoding="utf-8")
    args.out_md.write_text(build_summary(diff), encoding="utf-8")
    print(json.dumps({"out_json": str(args.out_json), "out_md": str(args.out_md), "file_count": diff["file_count"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

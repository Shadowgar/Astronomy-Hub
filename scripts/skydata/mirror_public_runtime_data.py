#!/usr/bin/env python3

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import shutil
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.error import HTTPError
from urllib.request import Request, urlopen

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.skydata.common import REPO_ROOT, write_json

MANIFEST_PATH = REPO_ROOT / "data/manifests/public_stellarium_runtime_parity_manifest.json"
RUNTIME_PACKS_ROOT = REPO_ROOT / "data/runtime-packs"
VENDOR_TEST_SKYDATA_ROOT = REPO_ROOT / "vendor/stellarium-web-engine/apps/test-skydata"
PUBLIC_SKYDATA_ROOT = REPO_ROOT / "frontend/public/oras-sky-engine/skydata"

SUPPORTED_CLASSES = {
    "dss_survey",
    "star_pack_minimal",
    "star_pack_base",
    "star_pack_extended",
    "dso_pack_base",
    "dso_pack_extended",
    "milkyway_survey",
    "landscape_guereins",
    "moon_survey",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Mirror public Stellarium runtime resources into ORAS-managed paths.")
    parser.add_argument(
        "--class",
        dest="classes",
        action="append",
        choices=sorted(SUPPORTED_CLASSES),
        help="Runtime class to process. Repeat to process multiple classes.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Plan work without writing downloads.")
    parser.add_argument(
        "--confirm-download",
        action="store_true",
        help="Required when class source uses network HTTP(S).",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume by reusing existing files under raw/processed/runtime-pack roots.",
    )
    parser.add_argument("--checksum-manifest", action="store_true", help="Write checksum manifest JSON per class.")
    parser.add_argument("--max-files", type=int, default=0, help="Maximum files downloaded per class (0 = unlimited).")
    parser.add_argument("--max-bytes", type=int, default=0, help="Maximum bytes downloaded per class (0 = unlimited).")
    parser.add_argument(
        "--promote-runtime-pack",
        action="store_true",
        help="Explicitly copy runtime-ready output to vendor and frontend runtime trees.",
    )
    parser.add_argument("--order-min", type=int, default=0, help="HiPS order min (default: 0).")
    parser.add_argument("--order-max", type=int, default=7, help="HiPS order max (default: 7).")
    parser.add_argument("--full", "--download-all", action="store_true", dest="full", help="Download all missing files in order range.")
    parser.add_argument("--progress", action="store_true", help="Enable human-readable progress output.")
    parser.add_argument("--workers", type=int, default=1, help="Download workers for missing files (default: 1).")
    parser.add_argument(
        "--rate-limit-per-worker",
        type=float,
        default=0.0,
        help="Optional per-worker delay in seconds between downloads (default: none).",
    )
    parser.add_argument(
        "--progress-interval",
        type=int,
        default=10,
        help="Progress print interval seconds (default: 10).",
    )
    parser.add_argument("--quiet", action="store_true", help="Suppress progress output except final JSON summary.")
    parser.add_argument("--jsonl-progress", action="store_true", help="Emit JSONL progress events.")
    parser.add_argument("--status", action="store_true", help="Read latest mirror-status.json for the selected class and exit.")
    parser.add_argument("--retry-count", type=int, default=3, help="Retry attempts per file (default: 3).")
    parser.add_argument("--request-timeout", type=int, default=20, help="HTTP timeout seconds per request (default: 20).")
    parser.add_argument("--verbose", action="store_true", help="Print per-file output.")
    return parser.parse_args()


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_manifest() -> dict[str, Any]:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def parse_properties(raw: str) -> dict[str, str]:
    parsed: dict[str, str] = {}
    for line in raw.splitlines():
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        parsed[key.strip()] = value.strip()
    return parsed


def sha256_bytes(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def resolve_tile_extension(properties: dict[str, str]) -> list[str]:
    fmt = properties.get("hips_tile_format", "")
    candidates: list[str] = []
    for token in fmt.split():
        token = token.strip().lower()
        if token == "jpeg":
            candidates.extend(["jpg", "jpeg", "webp"])
        elif token:
            candidates.append(token)
    for fallback in ("jpg", "jpeg", "png"):
        if fallback not in candidates:
            candidates.append(fallback)
    return candidates


def tile_rel_paths(order_min: int, order_max: int, extension: str) -> list[str]:
    rel: list[str] = []
    for order in range(order_min, order_max + 1):
        npix_count = 12 * (4 ** order)
        for npix in range(npix_count):
            rel.append(f"Norder{order}/Dir{npix // 10000}/Npix{npix}.{extension}")
    return rel


def fetch_bytes(url: str, *, resume_to: Path | None = None, max_bytes: int = 0, timeout: int = 20) -> bytes:
    if resume_to and resume_to.exists():
        return resume_to.read_bytes()
    headers = {"User-Agent": "oras-mirror/1.0"}
    parsed = urlparse(url)
    if parsed.netloc == "stellarium.sfo2.cdn.digitaloceanspaces.com":
        headers["Origin"] = "https://stellarium-web.org"
    with urlopen(Request(url, headers=headers), timeout=timeout) as response:
        payload = response.read()
    if max_bytes > 0 and len(payload) > max_bytes:
        raise ValueError(f"download exceeded max-bytes guard: {url}")
    return payload


def maybe_write(path: Path, payload: bytes, dry_run: bool) -> None:
    if dry_run:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)


def write_atomic(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part_path = path.with_name(path.name + ".part")
    part_path.write_bytes(payload)
    part_path.replace(path)


def dir_file_count_and_size(root: Path) -> tuple[int, int]:
    if not root.exists():
        return 0, 0
    count = 0
    size = 0
    for p in root.rglob("*"):
        if p.is_file():
            count += 1
            size += p.stat().st_size
    return count, size


def summarize_status(missing_after: int, failed_count: int) -> str:
    if missing_after == 0 and failed_count == 0:
        return "complete"
    if failed_count > 0:
        return "incomplete_with_failures"
    return "blocked"


def format_hms(seconds: float) -> str:
    total = max(0, int(seconds))
    h = total // 3600
    m = (total % 3600) // 60
    s = total % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


def class_roots(class_cfg: dict[str, Any]) -> tuple[Path, Path, Path, Path, Path]:
    raw_root = REPO_ROOT / class_cfg["raw_mirror_path"]
    processed_root = REPO_ROOT / class_cfg["processed_path"]
    relative_target = class_cfg["oras_runtime_target_path"].lstrip("/")
    if not relative_target.startswith("oras-sky-engine/skydata/"):
        raise ValueError(f"unsupported oras_runtime_target_path: {relative_target}")
    sky_rel = Path(relative_target[len("oras-sky-engine/skydata/") :])
    if any(part in {"..", ""} for part in sky_rel.parts):
        raise ValueError(f"invalid target path traversal: {sky_rel}")
    runtime_pack_root = RUNTIME_PACKS_ROOT / sky_rel
    runtime_ready_root = runtime_pack_root / "runtime-ready" / sky_rel
    return raw_root, processed_root, runtime_pack_root, runtime_ready_root, sky_rel


def process_hips_class(
    class_name: str,
    class_cfg: dict[str, Any],
    *,
    dry_run: bool,
    confirm_download: bool,
    resume: bool,
    checksum_manifest: bool,
    max_files: int,
    max_bytes: int,
    order_min: int,
    order_max: int,
    full: bool = False,
    retry_count: int = 3,
    request_timeout: int = 20,
    verbose: bool = False,
    workers: int = 1,
    rate_limit_per_worker: float = 0.0,
    progress_interval: int = 10,
    progress: bool = False,
    quiet: bool = False,
    jsonl_progress: bool = False,
) -> dict[str, Any]:
    base_url = str(class_cfg.get("public_base_url") or "").rstrip("/")
    if not base_url:
        return {"class": class_name, "status": "blocked", "reason": "missing public_base_url"}
    if base_url.startswith("http") and not confirm_download and not dry_run:
        return {"class": class_name, "status": "blocked", "reason": "--confirm-download required"}

    raw_root, processed_root, runtime_pack_root, runtime_ready_root, _ = class_roots(class_cfg)
    log_path = runtime_pack_root / "download-log.jsonl"
    checksum_path = runtime_pack_root / "checksums.json"
    failed_path = runtime_pack_root / "failed-files.json"
    status_path = runtime_pack_root / "mirror-status.json"

    if not dry_run and not resume:
        shutil.rmtree(raw_root, ignore_errors=True)
        shutil.rmtree(processed_root, ignore_errors=True)
        shutil.rmtree(runtime_pack_root, ignore_errors=True)

    properties_url = f"{base_url}/properties"
    try:
        properties_raw = fetch_bytes(
            properties_url, resume_to=(raw_root / "properties" if resume else None), max_bytes=max_bytes, timeout=request_timeout
        )
    except HTTPError as exc:
        return {"class": class_name, "status": "blocked", "reason": f"properties fetch failed: {exc.code}"}
    properties_text = properties_raw.decode("utf-8", errors="replace")
    props = parse_properties(properties_text)
    tile_exts = resolve_tile_extension(props)
    planned_rel = tile_rel_paths(order_min, order_max, tile_exts[0])
    if dry_run:
        return {
            "class": class_name,
            "status": "ok",
            "base_url": base_url,
            "downloaded_files": 0,
            "planned_files": len(planned_rel),
            "bytes": len(properties_raw),
            "order_min": order_min,
            "order_max": order_max,
            "runtime_ready_root": str(runtime_ready_root),
            "runtime_pack_root": str(runtime_pack_root),
            "log_path": str(log_path),
            "checksum_path": str(checksum_path) if checksum_manifest else None,
        }

    record_log: list[dict[str, Any]] = []
    failed_files: list[dict[str, Any]] = []
    checksums: dict[str, str] = {"properties": sha256_bytes(properties_raw)}
    downloaded = 0
    resumed = 0
    byte_count = len(properties_raw)

    maybe_write(raw_root / "properties", properties_raw, dry_run)
    maybe_write(processed_root / "properties", properties_raw, dry_run)
    maybe_write(runtime_ready_root / "properties", properties_raw, dry_run)

    expected_files = len(planned_rel) + 1
    existing_files = 1 if (raw_root / "properties").exists() else 0
    missing_stems: list[tuple[str, int, list[str]]] = []
    for rel in planned_rel:
        stem = rel.rsplit(".", 1)[0]
        local_existing_rel = None
        for ext in tile_exts:
            rel_try = f"{stem}.{ext}"
            if (raw_root / rel_try).exists():
                local_existing_rel = rel_try
                break
        if local_existing_rel:
            resumed += 1
            existing_files += 1
            continue
        order_value = int(stem.split("/", 1)[0].replace("Norder", ""))
        missing_stems.append((stem, order_value, [f"{stem}.{ext}" for ext in tile_exts]))
    missing_files_before = len(missing_stems)
    start = time.time()
    last_progress = 0.0
    capped_missing = missing_stems[:max_files] if max_files > 0 else missing_stems
    workers = max(1, int(workers))
    progress_interval = max(1, int(progress_interval))
    progress_enabled = (progress or full) and not quiet
    interrupted = False
    completed_candidates = 0
    last_completed: str | None = None
    status_state: dict[str, Any] = {
        "started_at": utc_now(),
        "updated_at": utc_now(),
        "class": class_name,
        "source_root": base_url,
        "order_min": order_min,
        "order_max": order_max,
        "expected_files": expected_files,
        "existing_files": existing_files,
        "missing_files_before": missing_files_before,
        "downloaded_files": 0,
        "failed_files": 0,
        "remaining_estimate": len(capped_missing),
        "percent_complete": 0.0,
        "bytes_downloaded": byte_count,
        "bytes_per_second": 0.0,
        "files_per_second": 0.0,
        "eta_seconds": None,
        "workers": workers,
        "complete": False,
        "interrupted": False,
        "failed_files_path": str(failed_path),
        "checksum_path": str(checksum_path) if checksum_manifest else None,
        "download_log_path": str(log_path),
    }

    def write_status() -> None:
        if dry_run:
            return
        runtime_pack_root.mkdir(parents=True, exist_ok=True)
        status_state["updated_at"] = utc_now()
        write_json(status_path, status_state)

    def print_progress(current_order: int) -> None:
        nonlocal last_progress
        now = time.time()
        if now - last_progress < progress_interval:
            return
        elapsed = max(0.001, now - start)
        remaining = max(0, len(capped_missing) - completed_candidates)
        files_per_second = downloaded / elapsed
        mb_per_second = (byte_count / (1024 * 1024)) / elapsed
        eta_seconds = (remaining / files_per_second) if files_per_second > 0 else None
        active_workers = max(0, min(workers, remaining))
        percent = (completed_candidates / max(1, len(capped_missing))) * 100
        line = (
            f"[{class_name}] elapsed={format_hms(elapsed)} workers={workers} active={active_workers} order={current_order} "
            f"files={completed_candidates}/{len(capped_missing)} {percent:.2f}% expected={expected_files} existing={existing_files} "
            f"missing_before={missing_files_before} downloaded={downloaded} failed={len(failed_files)} remaining={remaining} "
            f"speed={files_per_second:.2f} files/s {mb_per_second:.2f} MB/s eta={format_hms(eta_seconds or 0) if eta_seconds is not None else '--:--:--'}"
            f"{f' last={last_completed}' if last_completed else ''}"
        )
        if progress_enabled:
            print(line, flush=True)
        if jsonl_progress and not quiet:
            print(
                json.dumps(
                    {
                        "event": "progress",
                        "class": class_name,
                        "elapsed_seconds": elapsed,
                        "workers": workers,
                        "current_order": current_order,
                        "completed": completed_candidates,
                        "total": len(capped_missing),
                        "downloaded": downloaded,
                        "failed": len(failed_files),
                        "remaining": remaining,
                        "percent": percent,
                        "files_per_second": files_per_second,
                        "mb_per_second": mb_per_second,
                        "eta_seconds": eta_seconds,
                        "last_completed": last_completed,
                    },
                    sort_keys=True,
                ),
                flush=True,
            )
        status_state.update(
            {
                "downloaded_files": downloaded,
                "failed_files": len(failed_files),
                "remaining_estimate": remaining,
                "percent_complete": round(percent, 4),
                "bytes_downloaded": byte_count,
                "bytes_per_second": mb_per_second * 1024 * 1024,
                "files_per_second": files_per_second,
                "eta_seconds": eta_seconds,
                "complete": False,
                "interrupted": interrupted,
            }
        )
        write_status()
        last_progress = now

    def process_one(stem: str, order_value: int, rel_candidates: list[str]) -> dict[str, Any]:
        last_error = ""
        for rel_try in rel_candidates:
            url = f"{base_url}/{rel_try}"
            for attempt in range(1, max(1, retry_count) + 1):
                try:
                    payload = fetch_bytes(url, max_bytes=0, timeout=request_timeout)
                    if max_bytes > 0 and (byte_count + len(payload)) > max_bytes:
                        return {"status": "blocked_max_bytes", "order": order_value}
                    write_atomic(raw_root / rel_try, payload)
                    write_atomic(processed_root / rel_try, payload)
                    write_atomic(runtime_ready_root / rel_try, payload)
                    digest = sha256_bytes(payload)
                    if rate_limit_per_worker > 0:
                        time.sleep(rate_limit_per_worker)
                    return {
                        "status": "downloaded",
                        "order": order_value,
                        "relative_path": rel_try,
                        "url": url,
                        "bytes": len(payload),
                        "sha256": digest,
                    }
                except HTTPError as exc:
                    last_error = f"http_{exc.code}"
                    if exc.code in {403, 404} or attempt >= retry_count:
                        break
                except Exception as exc:  # noqa: BLE001
                    last_error = str(exc)
                    if attempt >= retry_count:
                        break
        return {"status": "failed", "stem": stem, "order": order_value, "candidates": rel_candidates, "error": last_error}

    def consume_item(item: dict[str, Any]) -> None:
        nonlocal downloaded, byte_count, completed_candidates, last_completed
        completed_candidates += 1
        current_order = int(item.get("order", order_min))
        if item["status"] == "downloaded":
            downloaded += 1
            byte_count += int(item["bytes"])
            checksums[item["relative_path"]] = item["sha256"]
            last_completed = item["relative_path"]
            record = {
                "timestamp": utc_now(),
                "class": class_name,
                "order": current_order,
                "url": item["url"],
                "relative_path": item["relative_path"],
                "bytes": int(item["bytes"]),
                "sha256": item["sha256"],
                "status": "downloaded",
            }
            record_log.append(record)
            if verbose and not quiet:
                print(json.dumps(record, sort_keys=True), flush=True)
        elif item["status"] == "failed":
            failed_files.append(
                {
                    "stem": item.get("stem", ""),
                    "order": current_order,
                    "candidates": item.get("candidates", []),
                    "error": item.get("error", "unknown"),
                }
            )
        print_progress(current_order)

    try:
        if workers == 1:
            for stem, order_value, rel_candidates in capped_missing:
                consume_item(process_one(stem, order_value, rel_candidates))
        else:
            with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
                futures_map = {
                    pool.submit(process_one, stem, order_value, rel_candidates): (stem, order_value)
                    for stem, order_value, rel_candidates in capped_missing
                }
                for fut in concurrent.futures.as_completed(futures_map):
                    try:
                        consume_item(fut.result())
                    except KeyboardInterrupt:
                        interrupted = True
                        for pending in futures_map:
                            pending.cancel()
                        break
                    except Exception as exc:  # noqa: BLE001
                        stem, order_value = futures_map[fut]
                        consume_item({"status": "failed", "stem": stem, "order": order_value, "error": str(exc), "candidates": []})
    except KeyboardInterrupt:
        interrupted = True

    if not dry_run:
        runtime_pack_root.mkdir(parents=True, exist_ok=True)
        with log_path.open("a", encoding="utf-8") as handle:
            for row in record_log:
                handle.write(json.dumps(row, sort_keys=True) + "\n")
        write_json(failed_path, {"class": class_name, "failed_files": failed_files, "generated_at": utc_now()})
        if checksum_manifest:
            write_json(checksum_path, {"class": class_name, "generated_at": utc_now(), "checksums": checksums})
    runtime_file_count, runtime_size = dir_file_count_and_size(runtime_ready_root)
    missing_files_after = max(0, missing_files_before - downloaded)
    complete = missing_files_after == 0 and not failed_files and not interrupted
    elapsed_seconds = round(time.time() - start, 2)
    files_per_second = round(downloaded / max(0.001, elapsed_seconds), 3)
    mb_per_second = round((byte_count / (1024 * 1024)) / max(0.001, elapsed_seconds), 3)
    status_state.update(
        {
            "downloaded_files": downloaded,
            "failed_files": len(failed_files),
            "remaining_estimate": missing_files_after,
            "percent_complete": round((downloaded / max(1, missing_files_before)) * 100, 4),
            "bytes_downloaded": byte_count,
            "bytes_per_second": mb_per_second * 1024 * 1024,
            "files_per_second": files_per_second,
            "eta_seconds": None,
            "complete": complete,
            "interrupted": interrupted,
        }
    )
    write_status()

    return {
        "class": class_name,
        "status": summarize_status(missing_files_after, len(failed_files)),
        "base_url": base_url,
        "expected_files": expected_files,
        "existing_files": existing_files,
        "missing_files_before": missing_files_before,
        "downloaded_files": downloaded,
        "failed_files": len(failed_files),
        "missing_files_after": missing_files_after,
        "runtime_file_count": runtime_file_count,
        "runtime_size": runtime_size,
        "complete": complete,
        "resumed_files": resumed,
        "bytes": byte_count,
        "workers": workers,
        "order_min": order_min,
        "order_max": order_max,
        "runtime_ready_root": str(runtime_ready_root),
        "runtime_pack_root": str(runtime_pack_root),
        "log_path": str(log_path),
        "failed_path": str(failed_path),
        "checksum_path": str(checksum_path) if checksum_manifest else None,
        "status_path": str(status_path),
        "interrupted": interrupted,
        "elapsed_seconds": elapsed_seconds,
        "files_per_second": files_per_second,
        "mb_per_second": mb_per_second,
    }


def process_eph_pack_class(
    class_name: str,
    class_cfg: dict[str, Any],
    *,
    dry_run: bool,
    confirm_download: bool,
    resume: bool,
    checksum_manifest: bool,
    max_files: int,
    max_bytes: int,
    order_min: int,
    order_max: int,
    full: bool = False,
    retry_count: int = 3,
    request_timeout: int = 20,
    verbose: bool = False,
) -> dict[str, Any]:
    base_url = str(class_cfg.get("public_base_url") or "").rstrip("/")
    if not base_url:
        return {"class": class_name, "status": "blocked", "reason": "missing public_base_url"}
    if base_url.startswith("http") and not confirm_download and not dry_run:
        return {"class": class_name, "status": "blocked", "reason": "--confirm-download required"}

    raw_root, processed_root, runtime_pack_root, runtime_ready_root, _ = class_roots(class_cfg)
    log_path = runtime_pack_root / "download-log.jsonl"
    checksum_path = runtime_pack_root / "checksums.json"

    if not dry_run and not resume:
        shutil.rmtree(raw_root, ignore_errors=True)
        shutil.rmtree(processed_root, ignore_errors=True)
        shutil.rmtree(runtime_pack_root, ignore_errors=True)

    properties_url = f"{base_url}/properties"
    try:
        properties_raw = fetch_bytes(
            properties_url,
            resume_to=(raw_root / "properties" if resume else None),
            max_bytes=max_bytes,
            timeout=request_timeout,
        )
    except HTTPError as exc:
        return {"class": class_name, "status": "blocked", "reason": f"properties fetch failed: {exc.code}"}
    properties_text = properties_raw.decode("utf-8", errors="replace")
    props = parse_properties(properties_text)
    if "eph" not in props.get("hips_tile_format", "").lower():
        return {"class": class_name, "status": "blocked", "reason": "properties hips_tile_format does not include eph"}
    planned_rel = tile_rel_paths(order_min, order_max, "eph")

    if dry_run:
        return {
            "class": class_name,
            "status": "ok",
            "base_url": base_url,
            "properties_url": properties_url,
            "expected_format": "eph",
            "downloaded_files": 0,
            "planned_files": len(planned_rel),
            "first_tile_url_planned": f"{base_url}/{planned_rel[0]}" if planned_rel else None,
            "bytes": len(properties_raw),
            "order_min": order_min,
            "order_max": order_max,
            "runtime_ready_root": str(runtime_ready_root),
            "runtime_pack_root": str(runtime_pack_root),
            "log_path": str(log_path),
            "checksum_path": str(checksum_path) if checksum_manifest else None,
        }

    record_log: list[dict[str, Any]] = []
    failed_files: list[dict[str, Any]] = []
    checksums: dict[str, str] = {"properties": sha256_bytes(properties_raw)}
    downloaded = 0
    resumed = 0
    byte_count = len(properties_raw)
    failed_path = runtime_pack_root / "failed-files.json"
    start = time.time()
    last_progress = 0.0
    total_planned = len(planned_rel)

    maybe_write(raw_root / "properties", properties_raw, dry_run)
    maybe_write(processed_root / "properties", properties_raw, dry_run)
    maybe_write(runtime_ready_root / "properties", properties_raw, dry_run)

    for rel in planned_rel:
        if max_files > 0 and downloaded >= max_files:
            break
        if max_bytes > 0 and byte_count >= max_bytes:
            break
        local_existing = raw_root / rel
        if resume and local_existing.exists():
            payload = local_existing.read_bytes()
            resumed += 1
            status = "resumed"
        else:
            url = f"{base_url}/{rel}"
            payload = b""
            status = "failed"
            failure = ""
            for attempt in range(1, max(1, retry_count) + 1):
                try:
                    payload = fetch_bytes(url, max_bytes=0, timeout=request_timeout)
                    status = "downloaded"
                    break
                except HTTPError as exc:
                    failure = f"http_{exc.code}"
                    if exc.code in {403, 404}:
                        break
                    if attempt >= retry_count:
                        break
                except Exception as exc:  # noqa: BLE001
                    failure = str(exc)
                    if attempt >= retry_count:
                        break
            if status != "downloaded":
                failed_files.append({"relative_path": rel, "order": int(rel.split('/', 1)[0].replace('Norder', '')), "url": url, "error": failure})
                continue
            downloaded += 1
            byte_count += len(payload)
        if max_bytes > 0 and (byte_count + len(payload)) > max_bytes and status == "downloaded":
            break
        digest = sha256_bytes(payload)
        checksums[rel] = digest
        order_value = int(rel.split("/", 1)[0].replace("Norder", ""))
        record_log.append(
            {
                "timestamp": utc_now(),
                "class": class_name,
                "order": order_value,
                "url": f"{base_url}/{rel}",
                "relative_path": rel,
                "bytes": len(payload),
                "sha256": digest,
                "status": status,
            }
        )
        maybe_write(raw_root / rel, payload, dry_run)
        maybe_write(processed_root / rel, payload, dry_run)
        maybe_write(runtime_ready_root / rel, payload, dry_run)
        if verbose:
            print(json.dumps(record_log[-1], sort_keys=True))
        now = time.time()
        if now - last_progress >= 5:
            done = downloaded + resumed + len(failed_files)
            percent = (done / max(1, total_planned)) * 100
            print(
                f"[{class_name}] planned={total_planned} existing={resumed} downloaded={downloaded} "
                f"failed={len(failed_files)} percent={percent:.1f}% bytes={byte_count}"
            )
            last_progress = now

    runtime_pack_root.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as handle:
        for row in record_log:
            handle.write(json.dumps(row, sort_keys=True) + "\n")
    write_json(failed_path, {"class": class_name, "failed_files": failed_files, "generated_at": utc_now()})
    if checksum_manifest:
        write_json(checksum_path, {"class": class_name, "generated_at": utc_now(), "checksums": checksums})
    runtime_file_count, runtime_size = dir_file_count_and_size(runtime_ready_root)
    expected_files = len(planned_rel) + 1
    existing_files = 1 + resumed
    missing_files_before = len(planned_rel) - resumed
    missing_files_after = max(0, missing_files_before - downloaded)
    complete = missing_files_after == 0 and not failed_files

    return {
        "class": class_name,
        "status": summarize_status(missing_files_after, len(failed_files)),
        "base_url": base_url,
        "properties_url": properties_url,
        "expected_format": "eph",
        "expected_files": expected_files,
        "existing_files": existing_files,
        "missing_files_before": missing_files_before,
        "downloaded_files": downloaded,
        "failed_files": len(failed_files),
        "missing_files_after": missing_files_after,
        "runtime_file_count": runtime_file_count,
        "runtime_size": runtime_size,
        "complete": complete,
        "resumed_files": resumed,
        "bytes": byte_count,
        "order_min": order_min,
        "order_max": order_max,
        "runtime_ready_root": str(runtime_ready_root),
        "runtime_pack_root": str(runtime_pack_root),
        "log_path": str(log_path),
        "failed_path": str(failed_path),
        "checksum_path": str(checksum_path) if checksum_manifest else None,
        "elapsed_seconds": round(time.time() - start, 2),
    }


def promote_runtime_class(class_name: str, class_cfg: dict[str, Any]) -> dict[str, Any]:
    _, _, runtime_pack_root, runtime_ready_root, sky_rel = class_roots(class_cfg)
    if str(sky_rel) == "stars":
        return {"class": class_name, "promoted": False, "reason": "legacy skydata/stars promotion is forbidden"}
    runtime_pack_root = runtime_pack_root / "runtime-ready"
    if not runtime_pack_root.exists():
        return {"class": class_name, "promoted": False, "reason": "runtime-ready pack missing"}

    src = runtime_pack_root
    while src.is_dir():
        entries = [p for p in src.iterdir()]
        if len(entries) == 1 and entries[0].is_dir():
            src = entries[0]
            continue
        break
    vendor_target = VENDOR_TEST_SKYDATA_ROOT / sky_rel
    public_target = PUBLIC_SKYDATA_ROOT / sky_rel
    vendor_target.parent.mkdir(parents=True, exist_ok=True)
    public_target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, vendor_target, dirs_exist_ok=True)
    shutil.copytree(src, public_target, dirs_exist_ok=True)
    return {
        "class": class_name,
        "promoted": True,
        "source": str(src),
        "vendor_target": str(vendor_target),
        "public_target": str(public_target),
    }


def status_path_for_class(class_cfg: dict[str, Any]) -> Path:
    _, _, runtime_pack_root, _, _ = class_roots(class_cfg)
    return runtime_pack_root / "mirror-status.json"


def main() -> int:
    args = parse_args()
    manifest = load_manifest()
    classes = args.classes or ["dss_survey"]
    if args.status:
        class_name = classes[0]
        class_cfg = manifest["classes"][class_name]
        status_path = status_path_for_class(class_cfg)
        if not status_path.exists():
            print(f"No status file found for {class_name}: {status_path}")
            return 0
        print(json.dumps(json.loads(status_path.read_text(encoding="utf-8")), indent=2, sort_keys=True))
        return 0
    results: list[dict[str, Any]] = []
    for class_name in classes:
        class_cfg = manifest["classes"][class_name]
        source_type = class_cfg.get("source_type")
        if source_type == "hips-survey":
            result = process_hips_class(
                class_name,
                class_cfg,
                dry_run=args.dry_run,
                confirm_download=args.confirm_download,
                resume=args.resume,
                checksum_manifest=args.checksum_manifest,
                max_files=args.max_files,
                max_bytes=args.max_bytes,
                order_min=args.order_min,
                order_max=args.order_max,
                full=args.full,
                retry_count=args.retry_count,
                request_timeout=args.request_timeout,
                verbose=args.verbose,
                workers=args.workers,
                rate_limit_per_worker=args.rate_limit_per_worker,
                progress_interval=args.progress_interval,
                progress=args.progress,
                quiet=args.quiet,
                jsonl_progress=args.jsonl_progress,
            )
        elif source_type == "eph-pack":
            result = process_eph_pack_class(
                class_name,
                class_cfg,
                dry_run=args.dry_run,
                confirm_download=args.confirm_download,
                resume=args.resume,
                checksum_manifest=args.checksum_manifest,
                max_files=args.max_files,
                max_bytes=args.max_bytes,
                order_min=args.order_min,
                order_max=args.order_max,
                full=args.full,
                retry_count=args.retry_count,
                request_timeout=args.request_timeout,
                verbose=args.verbose,
            )
        else:
            result = {
                "class": class_name,
                "status": "blocked",
                "reason": f"unsupported source_type={source_type}",
            }
        results.append(result)
        should_promote = result.get("status") == "ok" or (
            result.get("status") not in {"blocked"} and (
            int(result.get("runtime_file_count", 0) or 0) > 0
            or int(result.get("downloaded_files", 0) or 0) > 0
            or int(result.get("resumed_files", 0) or 0) > 0
            )
        )
        if args.promote_runtime_pack and should_promote and not args.dry_run:
            results.append(promote_runtime_class(class_name, class_cfg))

    report = {"generated_at": utc_now(), "classes": classes, "results": results}
    report_path = RUNTIME_PACKS_ROOT / "public-runtime-mirror.latest.json"
    if not args.dry_run:
        write_json(report_path, report)
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.skydata.common import REPO_ROOT

DEFAULT_SCAN_ROOTS = [
    REPO_ROOT / "frontend/public/oras-sky-engine",
    REPO_ROOT / "vendor/stellarium-web-engine/apps/web-frontend",
    REPO_ROOT / "frontend/src/features/sky-engine",
]

DEFAULT_IGNORED_DIR_NAMES = {
    ".git",
    ".hg",
    ".svn",
    ".venv",
    "__pycache__",
    "build",
    "dist",
    "node_modules",
}

DEFAULT_IGNORED_FILE_NAMES = {
    "bun.lockb",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
}

DEFAULT_IGNORED_SUFFIXES = {
    ".eph",
    ".gz",
    ".ico",
    ".jpeg",
    ".jpg",
    ".map",
    ".png",
    ".svg",
    ".ttf",
    ".wasm",
    ".webp",
    ".woff",
    ".woff2",
}

ALLOW_MARKER = "ORAS_EXTERNAL_DEPENDENCY_ALLOW:"
URL_PATTERN = re.compile(r"https?://[^\s\"'<>`]+")
MARKDOWN_URL_PATTERN = re.compile(r"\[[^\]]+\]\((https?://[^)]+)\)")

RUNTIME_HINTS = (
    "fetch(",
    "jsonp(",
    "url:",
    "href=",
    "link =",
    "link=",
    "adddatasource",
    "service_url",
    "hips_service_url",
    "proxy",
    "target:",
    "vue_app_",
    "remote_",
    "tile-layer",
)

ATTRIBUTION_HINTS = (
    "target=\"_blank\"",
    "rel=\"noopener\"",
    "this work has made use",
    "all data comes from",
    "all images from",
    "copyright",
    "citation",
    "references",
    "operated at cds",
)

NAMESPACE_HINTS = (
    "xmlns",
    "rdf:resource",
    "creativecommons.org/ns#",
    "w3.org/1999",
    "w3.org/2000/svg",
    "purl.org/dc/",
)

FORBIDDEN_HOST_REASONS = {
    "stellarium-web.org": "Public Stellarium Web host must not remain a runtime dependency.",
    "data.stellarium.org": "Public Stellarium data host must not remain a runtime dependency.",
    "noctuasky": "NoctuaSky endpoints must be replaced by ORAS-owned APIs.",
    "gea.esac.esa.int": "Gaia Archive live calls are admin/import-only, never runtime.",
    "cds": "CDS live calls are admin/import-only, never runtime.",
    "celestrak": "CelesTrak live calls are admin/import-only, never runtime.",
    "minorplanetcenter": "MPC live calls are admin/import-only, never runtime.",
    "opensky": "OpenSky live calls are admin/import-only, never runtime.",
}

DEV_ONLY_HOSTS = {"127.0.0.1", "0.0.0.0", "localhost"}


def scan_runtime_external_dependencies(
    *,
    scan_roots: list[str | Path] | None = None,
    fail_on_runtime_forbidden: bool = False,
    allowlist_path: str | Path | None = None,
) -> dict[str, Any]:
    roots = [Path(path).resolve() for path in (scan_roots or DEFAULT_SCAN_ROOTS)]
    allowlist = _load_allowlist(allowlist_path)

    findings: list[dict[str, Any]] = []
    for root in roots:
        if not root.exists():
            continue
        findings.extend(_scan_root(root, allowlist))

    findings.sort(key=lambda item: (item["path"], item["line"], item["url"]))
    classification_counts = {
        "runtime_forbidden": sum(1 for item in findings if item["classification"] == "runtime_forbidden"),
        "admin_import_allowed": sum(1 for item in findings if item["classification"] == "admin_import_allowed"),
        "attribution_allowed": sum(1 for item in findings if item["classification"] == "attribution_allowed"),
        "unknown": sum(1 for item in findings if item["classification"] == "unknown"),
    }
    passed = not (fail_on_runtime_forbidden and classification_counts["runtime_forbidden"])
    return {
        "scan_roots": [str(root) for root in roots],
        "findings": findings,
        "finding_count": len(findings),
        "runtime_forbidden_count": classification_counts["runtime_forbidden"],
        "classification_counts": classification_counts,
        "status": "pass" if passed else "fail",
        "fail_on_runtime_forbidden": fail_on_runtime_forbidden,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scan Sky Engine runtime surfaces for external URLs")
    parser.add_argument(
        "--path",
        action="append",
        dest="paths",
        help="Optional root path to scan. Can be repeated. Defaults to the runtime surfaces.",
    )
    parser.add_argument(
        "--allowlist",
        help="Optional JSON allowlist file for explicit URL classification overrides.",
    )
    parser.add_argument(
        "--fail-on-runtime-forbidden",
        action="store_true",
        help="Exit nonzero when runtime-forbidden URLs are found.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    report = scan_runtime_external_dependencies(
        scan_roots=args.paths,
        fail_on_runtime_forbidden=args.fail_on_runtime_forbidden,
        allowlist_path=args.allowlist,
    )
    print(json.dumps(report, indent=2, sort_keys=True))
    return 1 if report["status"] == "fail" else 0


def _scan_root(root: Path, allowlist: list[dict[str, str]]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for path in _iter_files(root):
        findings.extend(_scan_file(path, allowlist))
    return findings


def _iter_files(root: Path):
    for path in root.rglob("*"):
        if path.is_dir():
            continue
        if _should_skip_path(path):
            continue
        yield path


def _scan_file(path: Path, allowlist: list[dict[str, str]]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    previous_line = ""
    try:
        with path.open("r", encoding="utf-8", errors="ignore") as handle:
            for line_number, line in enumerate(handle, start=1):
                findings.extend(_scan_line(path, line_number, line, previous_line, allowlist))
                previous_line = line
    except OSError:
        return findings
    return findings


def _scan_line(
    path: Path,
    line_number: int,
    line: str,
    previous_line: str,
    allowlist: list[dict[str, str]],
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for match in URL_PATTERN.finditer(line):
        url = match.group(0).rstrip(').,;')
        start, end = match.span()
        snippet = line[max(0, start - 120) : min(len(line), end + 120)]
        if _is_namespace_context(snippet):
            continue
        classification, reason = _classify_url(
            path=path,
            url=url,
            snippet=snippet,
            line=line,
            previous_line=previous_line,
            allowlist=allowlist,
        )
        findings.append(
            {
                "path": str(path),
                "line": line_number,
                "url": url,
                "classification": classification,
                "reason": reason,
            }
        )
    return findings


def _classify_url(
    *,
    path: Path,
    url: str,
    snippet: str,
    line: str,
    previous_line: str,
    allowlist: list[dict[str, str]],
) -> tuple[str, str]:
    explicit_allow = _explicit_allow(path, url, line, previous_line, allowlist)
    if explicit_allow is not None:
        return explicit_allow

    host = (urlparse(url).hostname or "").lower()
    lower_snippet = snippet.lower()
    lower_path = str(path).lower()

    if host in DEV_ONLY_HOSTS:
        return "admin_import_allowed", "Local development host is allowed outside production runtime."

    if _is_attribution_context(lower_path, lower_snippet):
        return "attribution_allowed", "Citation, credit, or attribution context is allowed."

    forbidden_reason = _forbidden_reason(host)
    if forbidden_reason:
        return "runtime_forbidden", forbidden_reason

    if _is_runtime_context(lower_snippet):
        return "runtime_forbidden", "External URL appears in runtime code or configuration."

    return "unknown", "External URL found outside an explicit allowlist or forbidden-host match."


def _explicit_allow(
    path: Path,
    url: str,
    line: str,
    previous_line: str,
    allowlist: list[dict[str, str]],
) -> tuple[str, str] | None:
    marker = _extract_allow_marker(line) or _extract_allow_marker(previous_line)
    if marker is not None:
        return marker, "Explicit inline allow marker."

    path_text = str(path)
    for rule in allowlist:
        path_substring = rule.get("path_substring", "")
        url_substring = rule.get("url_substring", "")
        if path_substring and path_substring not in path_text:
            continue
        if url_substring and url_substring not in url:
            continue
        classification = rule.get("classification", "unknown")
        reason = rule.get("reason", "Explicit allowlist rule.")
        return classification, reason
    return None


def _extract_allow_marker(line: str) -> str | None:
    marker_index = line.find(ALLOW_MARKER)
    if marker_index == -1:
        return None
    marker_value = line[marker_index + len(ALLOW_MARKER) :].strip().split()[0]
    if marker_value in {"runtime_forbidden", "admin_import_allowed", "attribution_allowed", "unknown"}:
        return marker_value
    return None


def _is_runtime_context(snippet: str) -> bool:
    return any(hint in snippet for hint in RUNTIME_HINTS)


def _is_attribution_context(path_text: str, snippet: str) -> bool:
    if "data-credits" in path_text or "skycultures" in path_text:
        return True
    if path_text.endswith("readme.md") or "description" in Path(path_text).name.lower():
        return True
    if any(hint in snippet for hint in ATTRIBUTION_HINTS):
        return True
    if MARKDOWN_URL_PATTERN.search(snippet):
        return True
    return False


def _is_namespace_context(snippet: str) -> bool:
    lower_snippet = snippet.lower()
    return any(hint in lower_snippet for hint in NAMESPACE_HINTS)


def _forbidden_reason(host: str) -> str | None:
    if not host:
        return None
    for needle, reason in FORBIDDEN_HOST_REASONS.items():
        if needle in host:
            return reason
    return None


def _should_skip_path(path: Path) -> bool:
    if any(part in DEFAULT_IGNORED_DIR_NAMES for part in path.parts):
        return True
    if path.name in DEFAULT_IGNORED_FILE_NAMES:
        return True
    suffixes = {suffix.lower() for suffix in path.suffixes}
    return bool(suffixes & DEFAULT_IGNORED_SUFFIXES)


def _load_allowlist(path: str | Path | None) -> list[dict[str, str]]:
    if not path:
        return []
    allowlist_path = Path(path)
    with allowlist_path.open("r", encoding="utf-8") as handle:
        raw_rules = json.load(handle)
    if not isinstance(raw_rules, list):
        raise ValueError("Allowlist must be a JSON array")
    normalized_rules: list[dict[str, str]] = []
    for rule in raw_rules:
        if not isinstance(rule, dict):
            raise ValueError("Allowlist rules must be JSON objects")
        classification = str(rule.get("classification", "unknown"))
        if classification not in {"runtime_forbidden", "admin_import_allowed", "attribution_allowed", "unknown"}:
            raise ValueError(f"Unsupported allowlist classification: {classification}")
        normalized_rules.append(
            {
                "path_substring": str(rule.get("path_substring", "")),
                "url_substring": str(rule.get("url_substring", "")),
                "classification": classification,
                "reason": str(rule.get("reason", "Explicit allowlist rule.")),
            }
        )
    return normalized_rules


if __name__ == "__main__":
    raise SystemExit(main())
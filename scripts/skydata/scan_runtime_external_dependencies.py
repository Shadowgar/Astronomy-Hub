#!/usr/bin/env python3

from __future__ import annotations

import argparse
import fnmatch
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.skydata.common import REPO_ROOT

DEFAULT_POLICY_PATH = Path(__file__).with_name("runtime_external_dependency_policy.json")

DEFAULT_SCAN_ROOTS = [
    REPO_ROOT / "frontend/public/oras-sky-engine",
    REPO_ROOT / "vendor/stellarium-web-engine/apps/web-frontend",
    REPO_ROOT / "frontend/src/features/sky-engine",
]

ALLOW_MARKER = "ORAS_EXTERNAL_DEPENDENCY_ALLOW:"
URL_PATTERN = re.compile(r"https?://[^\s\"'<>`]+")
MARKDOWN_URL_PATTERN = re.compile(r"\[[^\]]+\]\((https?://[^)]+)\)")
SUPPORTED_CLASSIFICATIONS = {"runtime_forbidden", "admin_import_allowed", "attribution_allowed", "unknown"}


def scan_runtime_external_dependencies(
    *,
    scan_roots: list[str | Path] | None = None,
    fail_on_runtime_forbidden: bool = False,
    policy_path: str | Path | None = None,
    allowlist_path: str | Path | None = None,
) -> dict[str, Any]:
    roots = [Path(path).resolve() for path in (scan_roots or DEFAULT_SCAN_ROOTS)]
    policy = _load_policy(policy_path)
    allowlist = policy["explicit_rules"] + _load_allowlist(allowlist_path)

    findings: list[dict[str, Any]] = []
    for root in roots:
        if not root.exists():
            continue
        findings.extend(_scan_root(root, allowlist, policy))

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
        "policy_path": str(policy["policy_path"]),
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
        "--policy",
        default=str(DEFAULT_POLICY_PATH),
        help="Policy JSON file for host rules, ignore lists, and explicit classifications.",
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
        policy_path=args.policy,
        allowlist_path=args.allowlist,
    )
    print(json.dumps(report, indent=2, sort_keys=True))
    return 1 if report["status"] == "fail" else 0


def _scan_root(root: Path, allowlist: list[dict[str, str]], policy: dict[str, Any]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for path in _iter_files(root, policy):
        findings.extend(_scan_file(path, allowlist, policy))
    return findings


def _iter_files(root: Path, policy: dict[str, Any]):
    for path in root.rglob("*"):
        if path.is_dir():
            continue
        if _should_skip_path(path, policy):
            continue
        yield path


def _scan_file(path: Path, allowlist: list[dict[str, str]], policy: dict[str, Any]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    previous_line = ""
    try:
        with path.open("r", encoding="utf-8", errors="ignore") as handle:
            for line_number, line in enumerate(handle, start=1):
                findings.extend(_scan_line(path, line_number, line, previous_line, allowlist, policy))
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
    policy: dict[str, Any],
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for match in URL_PATTERN.finditer(line):
        url = match.group(0).rstrip(').,;')
        start, end = match.span()
        snippet = line[max(0, start - 120) : min(len(line), end + 120)]
        if _is_namespace_context(snippet, policy):
            continue
        classification, reason = _classify_url(
            path=path,
            url=url,
            snippet=snippet,
            line=line,
            previous_line=previous_line,
            allowlist=allowlist,
            policy=policy,
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
    policy: dict[str, Any],
) -> tuple[str, str]:
    explicit_allow = _explicit_allow(path, url, line, previous_line, allowlist)
    if explicit_allow is not None:
        return explicit_allow

    host = (urlparse(url).hostname or "").lower()
    lower_snippet = snippet.lower()
    lower_path = str(path).lower()

    if host in policy["dev_only_hosts"]:
        return "admin_import_allowed", "Local development host is allowed outside production runtime."

    if _is_attribution_context(lower_path, lower_snippet, policy):
        return "attribution_allowed", "Citation, credit, or attribution context is allowed."

    forbidden_reason = _forbidden_reason(host, policy)
    if forbidden_reason:
        return "runtime_forbidden", forbidden_reason

    if _is_runtime_context(lower_snippet, policy):
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
    host = (urlparse(url).hostname or "").lower()
    for rule in allowlist:
        if not _rule_matches(rule, path_text, url, host):
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
    if marker_value in SUPPORTED_CLASSIFICATIONS:
        return marker_value
    return None


def _is_runtime_context(snippet: str, policy: dict[str, Any]) -> bool:
    return any(hint in snippet for hint in policy["runtime_context_hints"])


def _is_attribution_context(path_text: str, snippet: str, policy: dict[str, Any]) -> bool:
    if "data-credits" in path_text or "skycultures" in path_text:
        return True
    if path_text.endswith("readme.md") or "description" in Path(path_text).name.lower():
        return True
    if any(hint in snippet for hint in policy["attribution_hints"]):
        return True
    if MARKDOWN_URL_PATTERN.search(snippet):
        return True
    return False


def _is_namespace_context(snippet: str, policy: dict[str, Any]) -> bool:
    lower_snippet = snippet.lower()
    return any(hint in lower_snippet for hint in policy["namespace_hints"])


def _forbidden_reason(host: str, policy: dict[str, Any]) -> str | None:
    if not host:
        return None
    for rule in policy["runtime_forbidden_hosts"]:
        if rule["match"] in host:
            return rule["reason"]
    return None


def _should_skip_path(path: Path, policy: dict[str, Any]) -> bool:
    if any(part in policy["ignored_dir_names"] for part in path.parts):
        return True
    if path.name in policy["ignored_file_names"]:
        return True
    path_text = str(path)
    for ignored_path in policy["ignored_paths"]:
        if ignored_path and ignored_path in path_text:
            return True
    for pattern in policy["ignored_file_patterns"]:
        if fnmatch.fnmatch(path.name, pattern) or fnmatch.fnmatch(path_text, pattern):
            return True
    suffixes = {suffix.lower() for suffix in path.suffixes}
    return bool(suffixes & policy["ignored_suffixes"])


def _rule_matches(rule: dict[str, str], path_text: str, url: str, host: str) -> bool:
    path_substring = rule.get("path_substring", "")
    if path_substring and path_substring not in path_text:
        return False

    url_substring = rule.get("url_substring", "")
    if url_substring and url_substring not in url:
        return False

    host_substring = rule.get("host_substring", "")
    if host_substring and host_substring not in host:
        return False

    path_pattern = rule.get("path_pattern", "")
    if path_pattern and re.search(path_pattern, path_text, re.IGNORECASE) is None:
        return False

    url_pattern = rule.get("url_pattern", "")
    if url_pattern and re.search(url_pattern, url, re.IGNORECASE) is None:
        return False

    host_pattern = rule.get("host_pattern", "")
    if host_pattern and re.search(host_pattern, host, re.IGNORECASE) is None:
        return False

    return True


def _load_policy(path: str | Path | None) -> dict[str, Any]:
    policy_path = Path(path or DEFAULT_POLICY_PATH)
    with policy_path.open("r", encoding="utf-8") as handle:
        raw_policy = json.load(handle)
    if not isinstance(raw_policy, dict):
        raise ValueError("Policy file must be a JSON object")

    policy = {
        "policy_path": policy_path,
        "ignored_dir_names": {str(value) for value in raw_policy.get("ignored_dir_names", [])},
        "ignored_file_names": {str(value) for value in raw_policy.get("ignored_file_names", [])},
        "ignored_suffixes": {str(value).lower() for value in raw_policy.get("ignored_suffixes", [])},
        "ignored_paths": [str(value) for value in raw_policy.get("ignored_paths", [])],
        "ignored_file_patterns": [str(value) for value in raw_policy.get("ignored_file_patterns", [])],
        "runtime_context_hints": tuple(str(value).lower() for value in raw_policy.get("runtime_context_hints", [])),
        "attribution_hints": tuple(str(value).lower() for value in raw_policy.get("attribution_hints", [])),
        "namespace_hints": tuple(str(value).lower() for value in raw_policy.get("namespace_hints", [])),
        "dev_only_hosts": {str(value).lower() for value in raw_policy.get("dev_only_hosts", [])},
        "runtime_forbidden_hosts": _normalize_forbidden_host_rules(raw_policy.get("runtime_forbidden_hosts", [])),
        "explicit_rules": [],
    }

    policy["explicit_rules"].extend(
        _normalize_classified_rules(raw_policy.get("admin_import_allowed_hosts", []), "admin_import_allowed")
    )
    policy["explicit_rules"].extend(
        _normalize_classified_rules(raw_policy.get("attribution_allowed_hosts", []), "attribution_allowed")
    )
    policy["explicit_rules"].extend(
        _normalize_classified_rules(raw_policy.get("allowed_attribution_patterns", []), "attribution_allowed")
    )
    policy["explicit_rules"].extend(
        _normalize_classified_rules(raw_policy.get("known_unknowns", []), "unknown")
    )
    return policy


def _normalize_forbidden_host_rules(raw_rules: Any) -> list[dict[str, str]]:
    if not isinstance(raw_rules, list):
        raise ValueError("runtime_forbidden_hosts must be a JSON array")
    normalized_rules: list[dict[str, str]] = []
    for rule in raw_rules:
        if isinstance(rule, str):
            normalized_rules.append({"match": rule.lower(), "reason": "Runtime-forbidden host."})
            continue
        if not isinstance(rule, dict):
            raise ValueError("runtime_forbidden_hosts rules must be strings or JSON objects")
        match = str(rule.get("match", "")).lower()
        if not match:
            raise ValueError("runtime_forbidden_hosts rules require a non-empty 'match'")
        normalized_rules.append({"match": match, "reason": str(rule.get("reason", "Runtime-forbidden host."))})
    return normalized_rules


def _load_allowlist(path: str | Path | None) -> list[dict[str, str]]:
    if not path:
        return []
    allowlist_path = Path(path)
    with allowlist_path.open("r", encoding="utf-8") as handle:
        raw_rules = json.load(handle)
    return _normalize_classified_rules(raw_rules, None)


def _normalize_classified_rules(raw_rules: Any, default_classification: str | None) -> list[dict[str, str]]:
    if not isinstance(raw_rules, list):
        raise ValueError("Rule file must be a JSON array")
    normalized_rules: list[dict[str, str]] = []
    for rule in raw_rules:
        if not isinstance(rule, dict):
            raise ValueError("Rules must be JSON objects")
        classification = str(rule.get("classification", default_classification or "unknown"))
        if classification not in SUPPORTED_CLASSIFICATIONS:
            raise ValueError(f"Unsupported rule classification: {classification}")
        normalized_rules.append(
            {
                "path_substring": str(rule.get("path_substring", "")),
                "url_substring": str(rule.get("url_substring", "")),
                "host_substring": str(rule.get("host_substring", rule.get("match", ""))).lower(),
                "path_pattern": str(rule.get("path_pattern", "")),
                "url_pattern": str(rule.get("url_pattern", "")),
                "host_pattern": str(rule.get("host_pattern", "")),
                "classification": classification,
                "reason": str(rule.get("reason", "Explicit rule.")),
            }
        )
    return normalized_rules


if __name__ == "__main__":
    raise SystemExit(main())
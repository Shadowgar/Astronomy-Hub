from __future__ import annotations

import json
from pathlib import Path

from scripts.skydata.scan_runtime_external_dependencies import main, scan_runtime_external_dependencies


def test_scanner_detects_forbidden_runtime_url_in_fixture(tmp_path: Path) -> None:
    runtime_file = tmp_path / "runtime" / "app.js"
    runtime_file.parent.mkdir(parents=True)
    runtime_file.write_text(
        'fetch("https://api.noctuasky.com/api/v1/skysources/?q=capella&limit=10")\n',
        encoding="utf-8",
    )

    report = scan_runtime_external_dependencies(scan_roots=[runtime_file.parent])

    assert report["runtime_forbidden_count"] == 1
    assert report["findings"][0]["classification"] == "runtime_forbidden"
    assert report["findings"][0]["url"] == "https://api.noctuasky.com/api/v1/skysources/?q=capella&limit=10"


def test_scanner_loads_policy_with_host_path_and_pattern_rules(tmp_path: Path) -> None:
    policy_path = tmp_path / "policy.json"
    policy_path.write_text(
        json.dumps(
            {
                "ignored_dir_names": [],
                "ignored_file_names": [],
                "ignored_suffixes": [],
                "runtime_context_hints": ["fetch(", "href="],
                "attribution_hints": ["target=\"_blank\"", "rel=\"noopener\""],
                "namespace_hints": [],
                "dev_only_hosts": [],
                "runtime_forbidden_hosts": [
                    {
                        "match": "gea.esac.esa.int",
                        "reason": "Gaia runtime calls are forbidden."
                    }
                ],
                "admin_import_allowed_hosts": [
                    {
                        "match": "gea.esac.esa.int",
                        "path_pattern": "(?:^|/)(?:admin|docs|scripts)(?:/|$)",
                        "reason": "Admin-only Gaia access."
                    }
                ],
                "attribution_allowed_hosts": [
                    {
                        "match": "cosmos.esa.int",
                        "path_substring": "data-credits",
                        "reason": "Source attribution host rule."
                    }
                ],
                "allowed_attribution_patterns": [
                    {
                        "path_pattern": "compiled/app\\.js$",
                        "url_pattern": "dpac/consortium",
                        "reason": "Compiled attribution rule."
                    }
                ],
                "known_unknowns": []
            }
        ),
        encoding="utf-8",
    )

    credits_file = tmp_path / "credits" / "data-credits-dialog.vue"
    credits_file.parent.mkdir(parents=True)
    credits_file.write_text(
        '<a href="https://www.cosmos.esa.int/gaia" target="_blank" rel="noopener">Gaia</a>\n',
        encoding="utf-8",
    )

    compiled_file = tmp_path / "compiled" / "app.js"
    compiled_file.parent.mkdir(parents=True)
    compiled_file.write_text(
        'const credit = "https://www.cosmos.esa.int/web/gaia/dpac/consortium"\n',
        encoding="utf-8",
    )

    admin_file = tmp_path / "scripts" / "gaia_import.py"
    admin_file.parent.mkdir(parents=True)
    admin_file.write_text(
        'GAIA_URL = "https://gea.esac.esa.int/tap-server/tap"\n',
        encoding="utf-8",
    )

    runtime_file = tmp_path / "runtime" / "gaia_fetch.js"
    runtime_file.parent.mkdir(parents=True)
    runtime_file.write_text(
        'fetch("https://gea.esac.esa.int/tap-server/tap")\n',
        encoding="utf-8",
    )

    report = scan_runtime_external_dependencies(scan_roots=[tmp_path], policy_path=policy_path)
    findings = {(finding["path"], finding["url"]): finding for finding in report["findings"]}

    assert findings[(str(credits_file), "https://www.cosmos.esa.int/gaia")]["classification"] == "attribution_allowed"
    assert findings[(str(compiled_file), "https://www.cosmos.esa.int/web/gaia/dpac/consortium")]["classification"] == "attribution_allowed"
    assert findings[(str(admin_file), "https://gea.esac.esa.int/tap-server/tap")]["classification"] == "admin_import_allowed"
    assert findings[(str(runtime_file), "https://gea.esac.esa.int/tap-server/tap")]["classification"] == "runtime_forbidden"


def test_scanner_loads_known_unknown_rule_from_policy(tmp_path: Path) -> None:
    policy_path = tmp_path / "policy.json"
    policy_path.write_text(
        json.dumps(
            {
                "ignored_dir_names": [],
                "ignored_file_names": [],
                "ignored_suffixes": [],
                "runtime_context_hints": ["http://"],
                "attribution_hints": [],
                "namespace_hints": [],
                "dev_only_hosts": [],
                "runtime_forbidden_hosts": [],
                "admin_import_allowed_hosts": [],
                "attribution_allowed_hosts": [],
                "allowed_attribution_patterns": [],
                "known_unknowns": [
                    {
                        "path_pattern": "stellariumRuntimeDiscovery\\.ts$",
                        "url_pattern": "http://\\$\\{resolvedHost\\}:\\$\\{STELLARIUM_RUNTIME_PORT\\}",
                        "reason": "Local legacy runtime discovery only."
                    }
                ]
            }
        ),
        encoding="utf-8",
    )

    runtime_discovery_file = tmp_path / "frontend" / "stellariumRuntimeDiscovery.ts"
    runtime_discovery_file.parent.mkdir(parents=True)
    runtime_discovery_file.write_text(
        'const legacyRuntimeUrl = "http://${resolvedHost}:${STELLARIUM_RUNTIME_PORT}"\n',
        encoding="utf-8",
    )

    report = scan_runtime_external_dependencies(scan_roots=[tmp_path], policy_path=policy_path)

    assert report["findings"][0]["classification"] == "unknown"
    assert report["findings"][0]["reason"] == "Local legacy runtime discovery only."


def test_scanner_allows_attribution_and_admin_fixture(tmp_path: Path) -> None:
    credits_file = tmp_path / "credits" / "data-credits-dialog.vue"
    credits_file.parent.mkdir(parents=True)
    credits_file.write_text(
        '<a href="https://www.cosmos.esa.int/gaia" target="_blank" rel="noopener">Gaia</a> '
        '<!-- ORAS_EXTERNAL_DEPENDENCY_ALLOW: attribution_allowed -->\n',
        encoding="utf-8",
    )

    admin_file = tmp_path / "admin" / "gaia_import.py"
    admin_file.parent.mkdir(parents=True)
    admin_file.write_text(
        '# ORAS_EXTERNAL_DEPENDENCY_ALLOW: admin_import_allowed\n'
        'GAIA_URL = "https://gea.esac.esa.int/tap-server/tap"\n',
        encoding="utf-8",
    )

    report = scan_runtime_external_dependencies(scan_roots=[tmp_path])
    classifications = {finding["url"]: finding["classification"] for finding in report["findings"]}

    assert classifications["https://www.cosmos.esa.int/gaia"] == "attribution_allowed"
    assert classifications["https://gea.esac.esa.int/tap-server/tap"] == "admin_import_allowed"


def test_scanner_exits_nonzero_with_fail_on_runtime_forbidden(tmp_path: Path) -> None:
    runtime_file = tmp_path / "runtime" / "host.ts"
    runtime_file.parent.mkdir(parents=True)
    runtime_file.write_text('const share = "https://stellarium-web.org/"\n', encoding="utf-8")

    exit_code = main(["--path", str(runtime_file.parent), "--fail-on-runtime-forbidden"])

    assert exit_code == 1


def test_scanner_skips_default_ignored_directories(tmp_path: Path) -> None:
    for relative_path in (
        Path("node_modules/pkg/app.js"),
        Path("dist/app.js"),
        Path("build/app.js"),
        Path(".venv/bin/app.py"),
    ):
        blocked_file = tmp_path / relative_path
        blocked_file.parent.mkdir(parents=True, exist_ok=True)
        blocked_file.write_text('fetch("https://api.noctuasky.com/api/v1/skysources/name/Capella")\n', encoding="utf-8")

    report = scan_runtime_external_dependencies(scan_roots=[tmp_path])

    assert report["finding_count"] == 0


def test_scanner_cli_uses_policy_and_fails_only_on_runtime_forbidden(tmp_path: Path) -> None:
    policy_path = tmp_path / "policy.json"
    policy_path.write_text(
        json.dumps(
            {
                "ignored_dir_names": [],
                "ignored_file_names": [],
                "ignored_suffixes": [],
                "runtime_context_hints": ["fetch("],
                "attribution_hints": [],
                "namespace_hints": [],
                "dev_only_hosts": [],
                "runtime_forbidden_hosts": [
                    {
                        "match": "stellarium-web.org",
                        "reason": "Forbidden runtime host."
                    }
                ],
                "admin_import_allowed_hosts": [],
                "attribution_allowed_hosts": [],
                "allowed_attribution_patterns": [],
                "known_unknowns": []
            }
        ),
        encoding="utf-8",
    )

    runtime_file = tmp_path / "runtime" / "host.ts"
    runtime_file.parent.mkdir(parents=True)
    runtime_file.write_text('const share = "https://stellarium-web.org/"\n', encoding="utf-8")

    exit_code = main([
        "--path",
        str(runtime_file.parent),
        "--policy",
        str(policy_path),
        "--fail-on-runtime-forbidden",
    ])

    assert exit_code == 1
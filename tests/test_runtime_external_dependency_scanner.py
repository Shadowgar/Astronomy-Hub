from __future__ import annotations

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
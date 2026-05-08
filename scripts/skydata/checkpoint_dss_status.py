#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H-%M-%SZ')


def main() -> int:
    p = argparse.ArgumentParser(description='Checkpoint current DSS mirror status into captured_assets and docs/restart.')
    p.add_argument('--status-json', type=Path, default=Path('data/runtime-packs/surveys/dss/v1/mirror-status.json'))
    p.add_argument('--failed-json', type=Path, default=Path('data/runtime-packs/surveys/dss/v1/failed-files.json'))
    p.add_argument('--out-dir', type=Path, default=Path('captured_assets/checkpoints'))
    p.add_argument('--docs-dir', type=Path, default=Path('docs/restart'))
    args = p.parse_args()

    status_path = (REPO_ROOT / args.status_json).resolve()
    failed_path = (REPO_ROOT / args.failed_json).resolve()

    if not status_path.exists():
        raise SystemExit(f'missing status file: {status_path}')

    status = json.loads(status_path.read_text(encoding='utf-8'))
    failed = {'failed_files': [], 'sparse_missing_files': []}
    if failed_path.exists():
        failed = json.loads(failed_path.read_text(encoding='utf-8'))

    failed_count = len(failed.get('failed_files', []) or [])
    sparse_count = len(failed.get('sparse_missing_files', []) or [])

    stamp = utc_stamp()
    out_dir = (REPO_ROOT / args.out_dir).resolve()
    docs_dir = (REPO_ROOT / args.docs_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    docs_dir.mkdir(parents=True, exist_ok=True)

    payload = {
        'checkpoint_at_utc': stamp,
        'class': 'dss_survey',
        'status_file': str(status_path),
        'failed_file': str(failed_path),
        'status': status,
        'failed_count': failed_count,
        'sparse_count': sparse_count,
    }

    json_out = out_dir / f'dss_survey_checkpoint_{stamp}.json'
    json_out.write_text(json.dumps(payload, indent=2, sort_keys=True) + '\n', encoding='utf-8')

    md_out = docs_dir / f'ORAS_DSS_SURVEY_CHECKPOINT_{stamp[:10]}.md'
    md_lines = [
        '# ORAS DSS Survey Checkpoint',
        '',
        f'- Captured at (UTC): `{stamp}`',
        f'- Status: `{status.get("status")}`',
        f'- Downloaded files: `{status.get("downloaded_files", 0)}`',
        f'- Failed files: `{status.get("failed_files", 0)}` (detail list count: `{failed_count}`)',
        f'- Sparse missing files: `{status.get("sparse_missing_files", 0)}` (detail list count: `{sparse_count}`)',
        f'- Remaining estimate: `{status.get("remaining_estimate")}`',
        f'- Runtime file count: `{status.get("runtime_file_count")}`',
        f'- Runtime size bytes: `{status.get("runtime_size")}`',
        '',
        '## Artifacts',
        '',
        f'- JSON checkpoint: `{json_out.relative_to(REPO_ROOT)}`',
        f'- Status source: `{status_path.relative_to(REPO_ROOT)}`',
        f'- Failure source: `{failed_path.relative_to(REPO_ROOT)}`',
    ]
    md_out.write_text('\n'.join(md_lines) + '\n', encoding='utf-8')

    print(json.dumps({'ok': True, 'checkpoint_json': str(json_out.relative_to(REPO_ROOT)), 'checkpoint_md': str(md_out.relative_to(REPO_ROOT))}, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

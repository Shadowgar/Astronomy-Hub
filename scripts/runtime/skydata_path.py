#!/usr/bin/env python3
"""Select already-installed owner skydata, including from linked worktrees.

This is a startup prerequisite check, not catalog or coverage qualification.
No downloads, copies, or dataset changes are performed.
"""
import os
import subprocess
import sys
from pathlib import Path


def resolve_skydata(repo: Path, override: str | None = None) -> Path:
    if override:
        selected = Path(override).expanduser()
        if not selected.is_absolute():
            selected = repo / selected
    else:
        result = subprocess.run(
            ['git', 'worktree', 'list', '--porcelain', '-z'], cwd=repo,
            check=True, capture_output=True, text=True,
        )
        owner = next(part.removeprefix('worktree ') for part in result.stdout.split('\0')
                     if part.startswith('worktree '))
        selected = Path(owner) / 'frontend/public/oras-sky-engine/skydata'
    selected = selected.resolve()
    survey = selected / 'surveys/gaia/v1'
    for relative in ('properties', 'Norder3/Dir0/Npix0.eph'):
        if not (survey / relative).is_file():
            raise ValueError(f'Installed Gaia data unavailable at {selected}; '
                             'set ORAS_SKYDATA_HOST_DIR to an installed skydata directory')
    return selected


if __name__ == '__main__':
    try:
        print(resolve_skydata(Path.cwd(), os.environ.get('ORAS_SKYDATA_HOST_DIR')))
    except (ValueError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error))

#!/usr/bin/env python3
"""Atomically publish a validated local release, retaining its rollback generation.

Linux renameat2(RENAME_EXCHANGE) keeps the active directory present throughout.
Unsupported filesystems fail closed; Docker directory bind mounts must be recreated
following promotion because they continue to reference the old directory inode.
"""
from __future__ import annotations
import argparse
import ctypes
from datetime import datetime, timezone
import fcntl
import os
from pathlib import Path
import uuid


def _exchange(left: Path, right: Path) -> None:
    libc = ctypes.CDLL(None, use_errno=True)
    renameat2 = libc.renameat2
    renameat2.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint]
    renameat2.restype = ctypes.c_int
    if renameat2(-100, os.fsencode(left), -100, os.fsencode(right), 2):
        err = ctypes.get_errno()
        raise OSError(err, os.strerror(err))


def promote_release(staging: Path, active: Path) -> Path | None:
    staging, active = Path(staging).absolute(), Path(active).absolute()
    if staging.is_symlink() or active.is_symlink():
        raise ValueError('refusing symlink release paths')
    if staging == active or not staging.is_dir():
        raise ValueError('staging must be a distinct release directory')
    active.parent.mkdir(parents=True, exist_ok=True)
    with (active.parent / ('.' + active.name + '.promotion.lock')).open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if not active.exists():
            staging.rename(active)
            return None
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        backup = active.with_name(f'{active.name}.previous-{stamp}-{uuid.uuid4().hex[:8]}')
        _exchange(staging, active)
        try:
            staging.rename(backup)
        except OSError:
            _exchange(staging, active)
            raise
        return backup


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('staging', type=Path)
    parser.add_argument('active', type=Path)
    args = parser.parse_args()
    previous = promote_release(args.staging, args.active)
    print(f'Promoted {args.active}; rollback generation: {previous}')

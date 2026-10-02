#!/usr/bin/env python3
"""Copy only hashed, recovered source inputs into an external reconstruction."""
from pathlib import Path
import hashlib,json,shutil,sys
repo=Path(__file__).resolve().parents[2];out=Path(sys.argv[1]).resolve();lock=json.loads((repo/'integrations/renderers.lock.json').read_text())
for relative,digest in lock['sky']['overlay'].items():
 file=repo/'integrations/sky-overlay'/relative
 if hashlib.sha256(file.read_bytes()).hexdigest()!=digest:raise SystemExit('Overlay mismatch: '+relative)
 dest=out/relative
 if not dest.resolve().is_relative_to(out):raise SystemExit('Invalid overlay path')
 dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,dest)
print('SOURCE OVERLAY VERIFIED:',len(lock['sky']['overlay']))

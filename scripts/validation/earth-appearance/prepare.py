"""Prepare a disposable proof harness; do not modify renderer inputs or artifacts."""
import argparse
import shutil
import subprocess
from pathlib import Path

BASE = 'eea3e295ed5d234edae9053b3119f61e15e8371b'
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=False)
for name in ('index.html', 'proof.mjs', 'vite.config.mjs'):
    shutil.copyfile(HERE/name, args.output/name)
(args.output/'base').mkdir()
(args.output/'base/ViewerController.mjs').write_bytes(subprocess.check_output(
    ['git', 'show', BASE+':runtimes/earth-runtime/core/ViewerController.mjs'], cwd=ROOT))
(args.output/'public').mkdir()
(args.output/'public/cesium').symlink_to('/source/node_modules/cesium/Build/Cesium')
print(args.output.resolve())

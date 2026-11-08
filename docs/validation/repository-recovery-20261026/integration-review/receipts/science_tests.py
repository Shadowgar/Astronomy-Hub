import json,pathlib,subprocess
R=pathlib.Path('/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026')
O=pathlib.Path('/tmp/pr107-integration-review')
(O/'docker-science-fixture-error.log').write_bytes((O/'docker-science-tests.log').read_bytes())
args=['docker','run','--rm','--name','pr107-review-science-tests','--network','none','--read-only','--tmpfs','/tmp','-w','/work','-e','PYTHONPATH=/work','-e','PYTHONDONTWRITEBYTECODE=1','-e','ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/oras-planetary-ephemeris','-e','ORAS_LUNAR_ORIENTATION_DIR=/runtime/oras-lunar-orientation','-e','ORAS_PLANETARY_SYSTEMS_DIR=/runtime/oras-planetary-systems']
for src,dst in [(R,'/work'),(R.parent/'r4-a-planet-view-1/data/runtime-packs/lunar-orientation/release','/runtime/oras-lunar-orientation'),(R/'data/runtime-packs/planetary-systems/release','/runtime/oras-planetary-systems'),(R.parent/'integration-main-20261005/data/runtime-packs/planetary-ephemeris/release','/runtime/oras-planetary-ephemeris')]:
 args+=['--mount',f'type=bind,src={src},dst={dst},readonly']
args+=['sha256:00e343c5943ae02f94c5312d17fec4ab6c5aaa2376d27ce9ff2486793dc15c6a','python3','-m','pytest','backend/tests/test_planet_view.py','backend/tests/test_planetary_systems.py','backend/tests/test_horizons_systems.py','backend/tests/test_solar_exploration.py','-q','-p','no:cacheprovider']
(O/'science-test-command.json').write_text(json.dumps(args,indent=2))
with (O/'docker-science-tests.log').open('w') as out: p=subprocess.run(args,stdout=out,stderr=subprocess.STDOUT,timeout=180)
print((O/'docker-science-tests.log').read_text()[-3000:]);raise SystemExit(p.returncode)

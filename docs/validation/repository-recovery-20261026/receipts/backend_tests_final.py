import pathlib,json,subprocess
P=pathlib.Path('/tmp/astronomy-recovery-20261026');scratch=P/'backend-test-tree-final';(scratch/'.venv/bin').mkdir(parents=True,exist_ok=True)
(scratch/'.venv/bin/python').symlink_to('/usr/local/bin/python3')
c=json.loads(subprocess.check_output(['docker','inspect','oras-repository-recovery-20261026-backend'],text=True))[0]
args=['docker','run','--rm','--name','oras-recovery-disposable-tests-20261026','-u','0','-w','/work','-e','PYTHONPATH=/work','-e','PYTHONDONTWRITEBYTECODE=1','-e','PYTHON_BIN=/usr/local/bin/python3','-e','ORAS_STAR_RELEASE_LOCK_FILE=/tmp/fixture-promotion.lock','-e','ORAS_PLANETARY_EPHEMERIS_DIR=','-e','SATELLITE_TLE_FEED_PATH=/work/frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz']
for e in c['Config']['Env']:
 if e.startswith(('ORAS_LUNAR_','ORAS_PLANETARY_SYSTEMS_')):args+=['-e',e]
args+=['--mount',f'type=bind,src={scratch},dst=/work']
for m in c['Mounts']:
 if m['Destination']=='/work' or m['Destination']=='/runtime/recovery-satellites':continue
 args+=['--mount',f'type=bind,src={m["Source"]},dst={m["Destination"]},readonly']
 if m['Destination']=='/app/frontend/public/oras-sky-engine/skydata':args+=['--mount',f'type=bind,src={m["Source"]},dst=/work/frontend/public/oras-sky-engine/skydata,readonly']
 if m['Destination']=='/runtime/planetary-ephemeris':args+=['--mount',f'type=bind,src={m["Source"]},dst=/work/data/runtime-packs/planetary-ephemeris/release,readonly']
args+=[c['Image'],'sh','-c','apt-get update -qq && apt-get install -y -qq --no-install-recommends git >/tmp/git-install.log && git config --global --add safe.directory /work && python3 -m pytest backend/tests -q -p no:cacheprovider']
(P/'backend-test-command-final.json').write_text(json.dumps(args,indent=2))
with (P/'backend-disposable-final.log').open('w') as f:p=subprocess.run(args,stdout=f,stderr=subprocess.STDOUT)
print('disposable backend suite exit',p.returncode);print('\n'.join((P/'backend-disposable-final.log').read_text().splitlines()[-22:]));raise SystemExit(p.returncode)

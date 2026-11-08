"""Run original R3 return/race suites with only preview and time-dialog adaptation."""
from pathlib import Path
import os, subprocess
root=Path(__file__).resolve().parents[2]
out=root/'output/solar-cinematic';out.mkdir(parents=True,exist_ok=True)
for kind,env,seconds in [('identity','R3_IDENTITY_EVIDENCE',90),('history_race','R3_RACE_EVIDENCE',40),('entry_race','R3_ENTRY_EVIDENCE',90)]:
 source=(root/f'scripts/validation/verify_r3_{kind}.mjs').read_text()
 assert 'http://127.0.0.1:4210/' in source
 source=source.replace('http://127.0.0.1:4210/','http://127.0.0.1:4211/')
 if kind=='identity':
  needle="await p.getByLabel('Epoch (UTC)',{exact:true}).fill"
  assert source.count(needle)==1
  source=source.replace(needle,"await p.getByRole('button',{name:'Simulation time',exact:true}).click();"+needle)
 runner=out/f'run_{kind}.mjs';runner.write_text(source)
 with (out/(kind.replace('_','-')+'.log')).open('w')as log:
  subprocess.run(['node',str(runner)],cwd=root,env={**os.environ,env:'output/playwright/cinematic-'+kind.replace('_','-')},stdout=log,stderr=subprocess.STDOUT,timeout=seconds,check=True)
 print('PASS original suite: '+kind)

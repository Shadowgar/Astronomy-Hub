"""Create only task-owned preview containers; clone existing read-only data mounts.

No existing container/service/network/volume is restarted or changed. No secrets
are printed. Source code is mounted read-only; no database is required by Solar.
"""
from pathlib import Path
import subprocess, json
ROOT=Path(__file__).resolve().parents[2]
out=ROOT/'output/r3-a'
def call(*args):return subprocess.check_output(args,text=True).strip()
def inspect(name):return json.loads(call('docker','inspect',name))[0]
backend=inspect('oras-r2-earth-ux-backend');preview=inspect('oras-r2-earth-ux-live')
network='oras-r3-a-preview'
call('docker','network','create',network)
args=['docker','run','-d','--name','oras-r3-a-backend','--network',network,'-w','/app']
for env in backend['Config']['Env']:
 if env.startswith(('ORAS_','PYTHONUNBUFFERED=')):args+=['-e',env]
for m in backend['Mounts']:
 source=m['Source'].replace('/.worktrees/r2-earth-ux-performance-1','/.worktrees/r3-a-solar-system-1') if m['Destination'] in ['/app/backend','/app/scripts','/app/frontend/src/config','/work'] else m['Source']
 args+=['-v',source+':'+m['Destination']+':ro']
args+=[backend['Image'],*backend['Config']['Cmd']]
print('Created backend',call(*args)[:12])
conf=Path('/home/rocco/Astronomy-Hub/.worktrees/r2-earth-ux-performance-1/output/r2-earth-ux/nginx-live.conf').read_text().replace('oras-r2-earth-ux-backend','oras-r3-a-backend')
(out/'nginx.conf').write_text(conf)
args=['docker','run','-d','--name','oras-r3-a-preview','--network',network,'-p','127.0.0.1:4210:8877']
for m in preview['Mounts']:
 source=str(out/'nginx.conf')if m['Destination']=='/etc/nginx/conf.d/default.conf'else str(out/'hub-first')if m['Destination']=='/frontend'else str(ROOT/'output')if m['Destination']=='/evidence'else m['Source']
 args+=['-v',source+':'+m['Destination']+':ro']
args+=[preview['Image']]
print('Created preview',call(*args)[:12], 'http://127.0.0.1:4210/solar-system?date=2026-02-28T00:00:00Z')
(out/'preview-configuration.json').write_text(json.dumps({'backendImage':backend['Image'],'previewImage':preview['Image'],'network':network,'port':4210,'source':str(ROOT)},indent=2)+'\n')

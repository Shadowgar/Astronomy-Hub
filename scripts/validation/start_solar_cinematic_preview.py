"""Start only the authorized cinematic preview, using existing images/data read-only."""
from pathlib import Path
import subprocess,json
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'output/solar-cinematic'
def call(*args):return subprocess.check_output(args,text=True).strip()
def inspect(name):return json.loads(call('docker','inspect',name))[0]
backend=inspect('oras-r3-a-backend');preview=inspect('oras-r3-a-preview')
network='oras-solar-cinematic';call('docker','network','create',network)
args=['docker','run','-d','--name','oras-solar-cinematic-backend','--network',network,'-w','/app']
for env in backend['Config']['Env']:
 if env.startswith(('ORAS_','PYTHONUNBUFFERED=')):args+=['-e',env]
for mount in backend['Mounts']:
 source=mount['Source'].replace('/.worktrees/r3-a-solar-system-1','/.worktrees/r3-a-cinematic-solar-1') if mount['Destination'] in ['/app/backend','/app/scripts','/app/frontend/src/config','/work'] else mount['Source']
 args+=['-v',source+':'+mount['Destination']+':ro']
args+=[backend['Image'],*backend['Config']['Cmd']]
print('Created task backend',call(*args)[:12])
config=(ROOT.parent/'r3-a-solar-system-1/output/r3-a/nginx.conf').read_text().replace('oras-r3-a-backend','oras-solar-cinematic-backend')
(OUT/'nginx.conf').write_text(config)
args=['docker','run','-d','--name','oras-solar-cinematic-preview','--network',network,'-p','127.0.0.1:4211:8877']
for mount in preview['Mounts']:
 source=str(OUT/'nginx.conf') if mount['Destination']=='/etc/nginx/conf.d/default.conf' else str(OUT/'hub-first') if mount['Destination']=='/frontend' else str(ROOT/'output') if mount['Destination']=='/evidence' else mount['Source']
 args+=['-v',source+':'+mount['Destination']+':ro']
args+=[preview['Image']]
print('Created task preview',call(*args)[:12],'http://127.0.0.1:4211/solar-system?date=2026-02-28T00:00:00Z')
(OUT/'preview-configuration.json').write_text(json.dumps({'backendImage':backend['Image'],'previewImage':preview['Image'],'network':network,'port':4211,'source':str(ROOT)},indent=2)+'\n')

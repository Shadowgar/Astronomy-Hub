import ipaddress, json, pathlib, subprocess, time, urllib.request
R=pathlib.Path('/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026')
O=pathlib.Path('/tmp/pr107-integration-review')
commands=[]
def run(args, timeout=60):
 commands.append(args); (O/'docker-commands.json').write_text(json.dumps(commands,indent=2))
 p=subprocess.run(args,text=True,capture_output=True,timeout=timeout)
 if p.returncode: raise RuntimeError(str(args)+': '+p.stdout+p.stderr)
 return p.stdout
def snapshot():
 ids=run(['docker','ps','-aq']).split()
 rows=json.loads(run(['docker','inspect',*ids])) if ids else []
 return {'containers':{x['Id']:{'status':x['State']['Status'],'started':x['State']['StartedAt'],'image':x['Image']} for x in rows},'volumes':sorted(run(['docker','volume','ls','-q']).split())}
(O/'preservation-before.json').write_text(json.dumps(snapshot(),indent=2))
image='astronomy-hub-earth-runtime' # installed nginx1.27.5 from canonical1.27 line
backend='sha256:00e343c5943ae02f94c5312d17fec4ab6c5aaa2376d27ce9ff2486793dc15c6a'
net='pr107-integration-review'
networks=json.loads(run(['docker','network','inspect',*run(['docker','network','ls','-q']).split()]))
used=[ipaddress.ip_network(v['Subnet']) for n in networks for v in (n['IPAM']['Config'] or []) if v.get('Subnet')]
subnet=ipaddress.ip_network('10.254.107.0/28')
assert not any(subnet.version==v.version and subnet.overlaps(v) for v in used)
run(['docker','network','create','--internal','--subnet',str(subnet),net])
def mount(src,dst): return ['--mount',f'type=bind,src={src},dst={dst},readonly']
def start(name,alias,im,bindings,extra,cmd):
 args=['docker','run','-d','--name',name,'--network',net,'--network-alias',alias,'--label','pr107.integration-review=true','--read-only','--tmpfs','/tmp','--tmpfs','/var/cache/nginx','--tmpfs','/var/run']
 for src,dst in bindings: args+=mount(src,dst)
 args+=extra+[im]+cmd
 return run(args).strip()
parent=R.parent
orientation=parent/'r4-a-planet-view-1/data/runtime-packs/lunar-orientation/release'
surface=parent/'r4-a-planet-view-1/data/runtime-packs/lunar-surface/release'
ephemeris=parent/'integration-main-20261005/data/runtime-packs/planetary-ephemeris/release'
planet=parent/'r4-a-planet-view-1/output/r4-a/planet'
earth=parent/'cinematic-earth-completion-1/output/earth-sky-completion/earth'
start('pr107-review-backend','backend',backend,[(R/'backend','/app/backend'),(R/'scripts','/app/scripts'),(R/'frontend/src/config','/app/frontend/src/config'),(orientation,'/runtime/oras-lunar-orientation'),(R/'data/runtime-packs/planetary-systems/release','/runtime/oras-planetary-systems'),(ephemeris,'/runtime/oras-planetary-ephemeris')],['-e','PYTHONDONTWRITEBYTECODE=1','-e','ORAS_LUNAR_ORIENTATION_DIR=/runtime/oras-lunar-orientation','-e','ORAS_PLANETARY_SYSTEMS_DIR=/runtime/oras-planetary-systems','-e','ORAS_PLANETARY_EPHEMERIS_DIR=/runtime/oras-planetary-ephemeris'],['python3','-m','uvicorn','backend.app.main:app','--host','0.0.0.0','--port','8000'])
for name,alias,config,binds in [
 ('pr107-review-earth','earth-runtime',R/'runtimes/earth-runtime/nginx.conf',[(earth,'/runtime')]),
 ('pr107-review-planet','planet-runtime',R/'integrations/planet-runtime/nginx.conf',[(planet,'/runtime'),(surface,'/planet-data')]),
 ('pr107-review-gateway','gateway',R/'frontend/nginx.conf',[(R/'output/integration-review/hub','/usr/share/nginx/html')]),
]:
 extra=['--entrypoint','nginx']
 if alias=='gateway': extra+=['-p','127.0.0.1:4236:80']
 start(name,alias,image,[(config,'/etc/nginx/conf.d/default.conf'),*binds],extra,['-g','daemon off;'])
result=[]
for path in ['/planet-runtime/','/planet-runtime/moon-source-manifest.json','/planet-data/moon-wac.png','/earth-runtime/cesium/Widgets/widgets.css','/api/v1/planet-view/moon?time=2026-10-26T12:00:00Z','/api/v1/planetary-systems/mars?epoch=2026-10-26T12:00:00Z']:
 for attempt in range(30):
  try:
   with urllib.request.urlopen('http://127.0.0.1:4236'+path,timeout=10) as response:
    body=response.read();result.append({'path':path,'status':response.status,'bytes':len(body),'content_type':response.headers.get('Content-Type')})
    if '/api/' in path: (O/('moon-api.json' if 'planet-view' in path else 'mars-api.json')).write_bytes(body)
   break
  except Exception:
   if attempt==29: raise
   time.sleep(.2)
for path in ['/planet-runtime/missing.js','/planet-data/missing.png']:
 try: urllib.request.urlopen('http://127.0.0.1:4236'+path);raise AssertionError('missing data did not fail closed')
 except urllib.error.HTTPError as error:
  assert error.code==404;result.append({'path':path,'status':error.code})
(O/'docker-http.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))

import ipaddress,json,pathlib,subprocess
R=pathlib.Path('/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026')
O=R/'output/source-qualification';commands=[]
def run(args):
 commands.append(args);(O/'preview-commands.json').write_text(json.dumps(commands,indent=2));p=subprocess.run(args,text=True,capture_output=True,timeout=60)
 if p.returncode:raise RuntimeError(p.stdout+p.stderr)
 return p.stdout
config=O/'preview-nginx.conf'
config.write_text('''server {
 listen 8879; server_name _; root /frontend;
 include /etc/nginx/mime.types;
 types { application/javascript mjs; application/wasm wasm; }
 add_header Cache-Control no-store;
 location /source-distribution/ { alias /distribution/; }
 location = /oras-sky-engine/skydata/tle_satellite.jsonl.gz { alias /skydata/tle_satellite.jsonl.gz; add_header Content-Encoding gzip; }
 location /oras-sky-engine/skydata/ { alias /skydata/; }
 location /oras-sky-engine/ { try_files $uri $uri/ /oras-sky-engine/index.html; }
 location /api/ { default_type application/json; return 503 '{"detail":"Isolated source-only preview: science API not started"}'; }
 location / { try_files $uri $uri/ /index.html; }
}''')
net='pr107-source-qualification';subnet=ipaddress.ip_network('10.254.108.0/28')
networks=json.loads(run(['docker','network','inspect',*run(['docker','network','ls','-q']).split()]))
used=[ipaddress.ip_network(v['Subnet']) for n in networks for v in (n['IPAM']['Config'] or []) if v.get('Subnet')]
assert not any(subnet.version==v.version and subnet.overlaps(v) for v in used)
run(['docker','network','create','--internal','--subnet',str(subnet),net])
args=['docker','run','-d','--name','pr107-source-preview','--network',net,'--read-only','--tmpfs','/var/cache/nginx','--tmpfs','/var/run','--tmpfs','/tmp','--entrypoint','nginx']
for src,dst in [(config,'/etc/nginx/conf.d/default.conf'),(O/'extracted-f7cb702c/astronomy-hub-source/hub/frontend/dist','/frontend'),(O/'distribution-f7cb702c','/distribution'),(R.parents[1]/'frontend/public/oras-sky-engine/skydata','/skydata'),(R.parent/'integration-main-20261005/data/runtime-packs/catalog-packs','/skydata/catalog-packs'),(R.parent/'integration-main-20261005/data/runtime-packs/dense-star-tiles','/skydata/dense-star-tiles')]:
 assert src.exists(),str(src)
 args+=['--mount',f'type=bind,src={src},dst={dst},readonly']
run(args+['astronomy-hub-earth-runtime','-g','daemon off;'])
details=json.loads(run(['docker','inspect','pr107-source-preview']))[0];ip=details['NetworkSettings']['Networks'][net]['IPAddress'];receipt={'url':'http://'+ip+':8879','container_id':details['Id'],'image':details['Image'],'all_binds_readonly':all(not m['RW'] for m in details['Mounts'] if m['Type']=='bind')};(O/'preview.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt,indent=2))

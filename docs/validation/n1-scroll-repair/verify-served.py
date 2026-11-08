import hashlib,json,re,subprocess,urllib.request
from pathlib import Path
root=Path('/home/rocco/Astronomy-Hub/.worktrees/n1-sky-earth-navigation-1');base='http://127.0.0.1:4202'
sha=lambda b:hashlib.sha256(b).hexdigest()
def get(path):
 with urllib.request.urlopen(base+path) as response:
  assert response.status==200;assert response.headers.get('Cache-Control')=='no-store';return response.read()
lock=json.loads((root/'integrations/renderers.lock.json').read_text());release=json.loads((root/'output/n1/earth/release.json').read_text())
html=get('/').decode();hub=re.search(r'src="(/assets/[^" ]+\.js)"',html)[1];hub_bytes=get(hub);assert hub_bytes==(root/('frontend/dist'+hub)).read_bytes();assert b'Pause, then scroll' not in hub_bytes
rows=[{'url':hub,'sha256':sha(hub_bytes)}]
for row in lock['sky']['artifact_files']:
 if row['path'].endswith('.js') or row['path'].endswith('.mjs'):
  url='/oras-sky-engine/'+row['path'];assert sha(get(url))==row['sha256'];rows.append({'url':url,'sha256':row['sha256']})
earth_html=get('/earth-runtime/index.html').decode();earth_js=re.search(r'src="(/earth-runtime/[^" ]+\.js)"',earth_html)[1]
row=next(r for r in release['files'] if '/earth-runtime/'+r['path']==earth_js);assert sha(get(earth_js))==row['sha256'];rows.append({'url':earth_js,'sha256':row['sha256']})
versions=json.loads(get('/runtime-versions.json'));assert versions['sky']['artifact_sha256']==lock['sky']['artifact_sha256'];assert versions['earth']['artifact_sha256']==release['artifact_sha256']
for url,file in [('/oras-sky-engine/oras-runtime-build.json','frontend/public/oras-sky-engine/oras-runtime-build.json'),('/earth-runtime/release.json','output/n1/earth/release.json')]:assert get(url)==(root/file).read_bytes()
proof={'deliveryHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'testedApplicationHead':'746e5f8a8131a4bb4ebdadaa89784dfeb59923f5','base':base,'status':'PASS','cacheControl':'no-store','skyArtifact':lock['sky']['artifact_sha256'],'earthArtifact':release['artifact_sha256'],'servedJavaScript':rows,'verifiedAt':subprocess.check_output(['date','-u','+%Y-%m-%dT%H:%M:%SZ'],text=True).strip()}
(root/'output/n1/scroll-preview.json').write_text(json.dumps(proof,indent=2)+'\n');print('Served Hub, Sky JavaScript, Earth entry and admission metadata: PASS; '+proof['deliveryHead'])

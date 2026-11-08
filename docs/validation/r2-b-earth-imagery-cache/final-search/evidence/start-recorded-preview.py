import json,subprocess
from pathlib import Path
root=Path.cwd();out=root/'output/r2-b-final-search'
def run(*args):return subprocess.check_output(args,text=True).strip()
backend=json.loads(run('docker','inspect','oras-r2-b-backend'))[0]
a=['docker','run','-d','--name','oras-r2-b-search-recorded-backend','--network','oras-r2-b-preview','--label','astronomy.task=R2-B-final-search-recorded','-w','/work','-e','ORAS_RECORDED_SEARCH_QUALIFICATION=1']
for m in backend['Mounts']:a+=['-v',m['Source']+':'+m['Destination']+':ro']
for v in backend['Config'].get('Env',[]):
 if v.split('=',1)[0].startswith('ORAS_')or v.split('=',1)[0]in['SATELLITE_TLE_FEED_PATH','REDIS_URL','DATABASE_URL']:a+=['-e',v]
a += [backend['Config']['Image'],'python','-m','scripts.validation.recorded_earth_search_app'];print('Recorded qualification backend:',run(*a))
nginx=(root/'output/r2-b/nginx.conf').read_text().replace('oras-r2-b-backend','oras-r2-b-search-recorded-backend').replace(' location /api/', ' location /__qualification__/ { proxy_pass http://oras-r2-b-search-recorded-backend:8000; }\n location /api/')
(out/'nginx-recorded.conf').write_text(nginx)
preview=json.loads(run('docker','inspect','oras-r2-b-preview'))[0]
a=['docker','run','-d','--name','oras-r2-b-search-recorded-preview','--network','oras-r2-b-preview','--label','astronomy.task=R2-B-final-search-recorded','-p','127.0.0.1:4205:8877']
for m in preview['Mounts']:
 src=str(out/'nginx-recorded.conf')if m['Destination']=='/etc/nginx/conf.d/default.conf'else m['Source'];a+=['-v',src+':'+m['Destination']+':ro']
a += [preview['Config']['Image']];print('Recorded qualification preview:',run(*a))

"""Anchor the roadmap to every pinned upstream layer and public export."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
source=Path(sys.argv[1]);target=Path(__file__).resolve().parents[2]/'integrations/gods-eye-capabilities.json'
pin='e7707d9a0f34d9fbffc300023c319f95caa5be30'
assert subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()==pin
assert not subprocess.check_output(['git','-C',str(source),'status','--porcelain'],text=True).strip()
package=json.loads((source/'package.json').read_text())
registry=(source/'src/data/layerState.js').read_text().split('export const LAYER_STATE_REGISTRY = Object.freeze([',1)[1].split(']);',1)[0]
ids=sorted(set(re.findall(r"\bid:\s*'([^']+)'",registry))|{'local-adsb'})
used={'./sources/adsb-lol','./sources/live','./layers/satellites/source','./sources/space','./sources/regional'}
restricted={'local-dams','local-datacenters','military-installations','telegeography-submarine-cables','bhote-koshi-2026'}
entries=[]
for id in ids:
 status='ADAPTED NOW' if id in {'flights','satellites'} else 'LICENSE/DATA BLOCKED' if id in restricted else 'PLANNED'
 entries.append({'id':id,'anchor':'src/data/layerState.js' if id!='local-adsb' else 'src/app/constructCatalog.js','status':status,'scope':'Bounded civil aircraft near observer' if id=='flights' else 'Stations only; Earth wall-clock SGP4, separate from ORAS authority' if id=='satellites' else 'Retained roadmap; not included in this PR'})
features={'weather-current':('./sources/regional','ADAPTED NOW'),'terrain/maps/3D':('./maps/controller','PLANNED'),'infrastructure':('./infrastructure','PLANNED'),'drawing':('./application/tools','UPSTREAM HOOK REQUIRED'),'annotations':('./annotations','PLANNED'),'scenes/director':('./director','PLANNED'),'search':('./search','PLANNED'),'tracking/cockpit':('./ui/cockpit','UPSTREAM HOOK REQUIRED'),'display-effects':('./ui/effects','UPSTREAM HOOK REQUIRED')}
for id,(anchor,status) in features.items():entries.append({'id':id,'anchor':anchor,'status':status,'scope':'Current modeled point conditions only' if id=='weather-current' else 'Retained roadmap; UI adapters require qualification'})
exports=[]
for surface,target_path in package['exports'].items():
 paths=[target_path] if isinstance(target_path,str) else list(target_path.values())
 exports.append({'surface':surface,'targets':paths,'target_sha256':{p:hashlib.sha256((source/p).read_bytes()).hexdigest() for p in paths},'status':'ADAPTED NOW' if surface in used else 'NOT APPLICABLE TO ASTRONOMY HUB' if surface in {'./application','./application/viewer','./build/html','./build/vite','./standalone/catalog','./application/chrome','./ui/shell'} else 'PLANNED','scope':'Full application composition excluded; individual feature roadmap retained' if surface in {'./application','./application/viewer'} else 'Only exported modules imported; remaining exports require separate qualification'})
ledger={'schema':1,'upstream_sha':pin,'catalog_sha256':hashlib.sha256((source/'src/data/layerState.js').read_bytes()).hexdigest(),'catalog_layer_count':len(ids),'public_export_count':len(exports),'capabilities':entries,'exports':exports,'too_coupled':['Whole FlightsLayer controller requires terrain/cache/tracking services: ADAPTER WORK REQUIRED; use exported normalization only','Satellite renderer controller requires upstream tracking/UI services: ADAPTER WORK REQUIRED; reuse exported source only','Upstream weather rendering lacks clean layer export: UPSTREAM HOOK REQUIRED; use exported regional normalization'],'provider_decisions':{'aircraft':'B: bounded FastAPI adsb.lol transport, typed subset, 30s coalesced cache, browser normalization','satellites':'A: CORS-safe CelesTrak stations via exported source/URL helpers; satellite.js wall-clock visualization','weather':'A: CORS-safe Open-Meteo point conditions via exported normalization; non-commercial free endpoint'},'data_policy':'No bundled upstream datasets/models/events, dynamic local_data imports rejected by build; live data attribution and terms retained. No blanket Node sidecar.'}
target.write_text(json.dumps(ledger,indent=2)+'\n');print(f'LEDGER: {len(ids)} catalog layers, {len(entries)} capabilities, {len(exports)} public exports')

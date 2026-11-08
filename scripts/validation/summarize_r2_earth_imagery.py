"""Summarize observations; texture/decode/idle never stand in for visual acceptance."""
import hashlib,json,statistics,sys
from pathlib import Path
root=Path(sys.argv[1]);p=json.loads((root/'proof.json').read_text());rows=[]
for r in p['runs']:
 if not r['checkpoints']:continue
 d=r['checkpoints'][-1]['state']['diagnostics'];trace=d['imageryTrace'];events=trace['events'];delays=[]
 for i,e in enumerate(events):
  if e['type']=='camera.end':
   next_update=next((x for x in events[i+1:]if x['type']=='update.start'),None)
   if next_update:delays.append(round(next_update['pageMs']-e['pageMs'],3))
 first=lambda prefix:[{'event':k,'caseMs':round(v['caseMs'],3),'pageMs':round(v['pageMs'],3),'level':v.get('level'),'maxLevel':v.get('maxLevel')}for k,v in trace['first'].items()if k.startswith(prefix)]
 requests=r.get('requests',[]);latency=[x['timing']['receiveHeadersStart']-x['timing']['sendEnd']for x in requests if x.get('timing',{}).get('sendEnd',-1)>=0 and x['timing'].get('receiveHeadersStart',-1)>=0];transfer=[(x['finished']-x['responseTimestamp'])*1000 for x in requests if x.get('finished',0)>=x.get('responseTimestamp',float('inf'))]
 stats=lambda a:{'n':len(a),'median':round(statistics.median(a),3)if a else None,'max':round(max(a),3)if a else None}
 row={k:r[k]for k in ['width','phase','name']};row.update({'pageTimings':d['timings'],'pageFirst':trace['pageFirst'],'settlementToUpdateMs':delays,'firstDecoded':first('decode.'),'firstNativeTexture':first('target.visible.'),'finalSource':d['imagery']['metadata'],'finalTexture':trace['visible'],'sourceCounters':d['imagery']['sources'],'finalNativeIdle':d['globeTilesLoaded'],'controllersCreated':d['imagery']['controllersCreated'],'localAllocations':d['imagery']['localAllocations'],'network':{'requests':len(requests),'status':{str(s):sum(x.get('status')==s for x in requests)for s in sorted({x.get('status')for x in requests if x.get('status')is not None})},'failures':[{'url':x['url'],'error':x['error']}for x in requests if 'error'in x],'bytes':sum(x.get('encodedBytes',0)for x in requests),'diskCache':sum(bool(x.get('fromDiskCache'))for x in requests),'worker':sum(bool(x.get('fromServiceWorker'))for x in requests),'headersWaitMs':stats(latency),'afterHeadersObservedMs':stats(transfer)},'worker':r.get('cache',{'status':'not sampled in baseline driver version'}),'checkpoints':[]})
 for c in r['checkpoints']:
  s=c['state']['diagnostics'];row['checkpoints'].append({'file':c['file'],'sha256':hashlib.sha256((root/c['file']).read_bytes()).hexdigest(),'requestedAfterFlightMs':c['requestedMs'],'captureCompletedAfterFlightMs':c['actualMs'],'observedByNativeCaseMs':round(s['monotonicMs']-s['imageryTrace']['caseOriginMs'],2),'source':s['imagery']['actual'],'visible':s['imageryTrace']['visible'],'nativeIdle':s['globeTilesLoaded']})
 rows.append(row)
summary={'inputProofSha256':hashlib.sha256((root/'proof.json').read_bytes()).hexdigest(),'status':p.get('status'),'rows':rows,'units':'milliseconds; screenshot completion/diagnostic receipt is an upper bound, not exact displayed frame onset','limits':['Single run per viewport/location/cache phase; pooled phase statistics are descriptive, not repeated same-condition hardware benchmarks.','Native texture means ready image on selected surface tiles, not full source coverage or recognizable geography.','HTTP body completion and decoded-image promise are separate observations. Exact image decode duration is not directly exposed; do not equate promise elapsed with decode CPU.','Ring holds latest256 events; first event and aggregate counters survive ring truncation. Network window contains requests initiated during this camera case.']}
(root/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
for width in sorted({r['width']for r in rows}):
 delays=[d for r in rows if r['width']==width for d in r['settlementToUpdateMs']];print(width,'settlement-to-update',stats(delays))
print('rows',len(rows),'status',summary['status'])

import json, pathlib, subprocess, collections, datetime
P=pathlib.Path('/tmp/astronomy-recovery-20261026')
def git(*a):
 r=subprocess.run(['git',*a],text=True,capture_output=True)
 if r.returncode: return None
 return r.stdout.strip()
def ancestor(a,b): return subprocess.run(['git','merge-base','--is-ancestor',a,b],capture_output=True).returncode==0
def read(n,default=None):
 f=P/(n+'.json');return json.loads(f.read_text()) if f.exists() else default
main=git('rev-parse','origin/main'); candidate=git('rev-parse','recovery/reconcile-20261026')
rawprs=read('prs'); prs=[]
head_numbers=collections.defaultdict(list)
for pr in rawprs:head_numbers[pr['head']['ref']].append(pr['number'])
for raw in sorted(rawprs,key=lambda x:x['number']):
 n=raw['number'];p=read(f'pr-{n}',raw);head=p['head']['sha'];base=p['base']['sha'];mb=git('merge-base',main,head)
 diff=git('diff','--name-status',mb,head) if mb else None
 changes=[{'status':l.split('\t')[0],'path':l.split('\t')[-1]} for l in diff.splitlines()] if diff else []
 pr={'number':n,'url':p['html_url'],'title':p['title'],'state':p['state'],'draft':p['draft'],'merged':p.get('merged',False),'merge_commit_sha':p.get('merge_commit_sha'),'head':p['head']['ref'],'head_sha':head,'base':p['base']['ref'],'base_sha':base,'merge_base_main':mb,'ahead_behind_main':git('rev-list','--left-right','--count',main+'...'+head),'head_reachable_main':ancestor(head,main),'head_reachable_recovery':ancestor(head,candidate),'commit_count':p.get('commits'),'changed_file_count':p.get('changed_files'),'parent_prs':head_numbers.get(p['base']['ref'],[]),'github_mergeable':p.get('mergeable'),'github_mergeable_state':p.get('mergeable_state'),'delta_commits':git('log','--format=%H %s',base+'..'+head),'changes_from_main':changes,'checks':[{k:c.get(k) for k in ('name','conclusion','status','details_url','head_sha')} for c in read(f'pr-{n}-checks',{}).get('check_runs',[])],'reviews':[{k:r.get(k) for k in ('state','commit_id','submitted_at','html_url','body')} for r in read(f'pr-{n}-reviews',[])],'owner_acceptance':'Not inferred from CI or author claims; see captured conversation and disposition reason','disposition':'F','reason':'Exact integration qualification and owner acceptance missing'}
 if pr['head_reachable_main'] or (pr['merged'] and pr['merge_commit_sha'] and ancestor(pr['merge_commit_sha'],main)):
  pr.update(disposition='E',reason='Head or recorded merge commit is reachable from live main')
 elif n in (102,104): pr.update(disposition='D',reason='Explicit owner rejection; closed unmerged; branch retained')
 elif n==103: pr.update(disposition='C',reason='Owner identifies source proposal as superseded; closed unmerged; branch retained')
 elif n==75: pr.update(disposition='F',reason='Merged only into PR74, not main; retained in recovery candidate; integration and outstanding acceptance gates remain')
 elif p['state']=='closed' and not pr['merged']:pr.update(disposition='F',reason='Closed unmerged; unique work requires comparison with retained branches before any destructive cleanup')
 if n==76:pr.update(disposition='B',reason='Vue 2 to Vue 3 and Vuetify 2 to 4 major changes in native Sky overlay require compatibility repair and build qualification')
 if n==77:pr.update(disposition='F',reason='Independent lockfile update needs overlay build and runtime qualification; ordinary CI does not build the Sky overlay')
 prs.append(pr)
wt=[]
for block in git('worktree','list','--porcelain').split('\n\n'):
 d=dict(line.split(' ',1) for line in block.splitlines() if ' ' in line)
 if 'worktree' not in d:continue
 path=d['worktree']; r=subprocess.run(['git','-C',path,'status','--porcelain=v1','--untracked-files=normal'],text=True,capture_output=True)
 d['status_exit_code']=r.returncode;d['status']=r.stdout;d['error']=r.stderr
 d['preserved_ignored_paths']=[str(pathlib.Path(path)/v) for v in ['data','output','frontend/node_modules','frontend/dist','frontend/public/oras-sky-engine/skydata'] if (pathlib.Path(path)/v).exists()]
 wt.append(d)
containers=read('containers',[]);remote=read('remote-branches',[])
branchmap={}
for r in remote:branchmap[r['name']]={'name':r['name'],'remote_sha':r['commit']['sha'],'protected':r['protected']}
for l in git('for-each-ref','--format=%(refname:short) %(objectname)','refs/heads').splitlines():
 name,sha=l.split();branchmap.setdefault(name,{'name':name})['local_sha']=sha
branches=[]
for name,b in sorted(branchmap.items()):
 sha=b.get('remote_sha',b.get('local_sha'));mb=git('merge-base',main,sha)
 b.update(prs=head_numbers.get(name,[]),tip_sha=sha,merge_base_main=mb,ahead_behind_main=git('rev-list','--left-right','--count',main+'...'+sha),reachable_main=ancestor(sha,main),reachable_recovery=ancestor(sha,candidate))
 b['worktrees']=[w for w in wt if w.get('branch')=='refs/heads/'+name]
 b['container_consumers']=[c['Name'] for c in containers if any(m['Source']==w['worktree'] or m['Source'].startswith(w['worktree']+'/') for w in b['worktrees'] for m in c['Mounts'])]
 b['changes_from_main']=(git('diff','--name-status',mb,sha) or '').splitlines()
 b['local_tip_analysis']={'sha':b['local_sha'],'ahead_behind_main':git('rev-list','--left-right','--count',main+'...'+b['local_sha']),'unique_commits_vs_main_and_recovery':(git('log','--format=%H %s',b['local_sha'],'--not',main,candidate) or '').splitlines()} if 'local_sha' in b else None
 b['unique_commits_vs_main_and_recovery']=(git('log','--format=%H %s',sha,'--not',main,candidate) or '').splitlines()
 others=list({v[key] for k,v in branchmap.items() if k!=name for key in ['remote_sha','local_sha'] if key in v})
 b['exclusive_commits_vs_all_other_branches']=(git('log','--format=%H %s',sha,'--not',*others) or '').splitlines()
 b['supports_open_prs']=[p['number'] for p in prs if p['state']=='open' and p['head']!=name and ancestor(sha,p['head_sha'])]
 diff=git('diff','--numstat',mb,sha) if mb else ''
 b['binary_or_data_evidence_changes']=[l for l in (diff or '').splitlines() if l.startswith('-\t') or any(s in l.lower() for s in ('data/','evidence/','.wasm','.bsp','.png','.gz'))]
 b['classification']='MAIN' if name=='main' else ('INTEGRATED_IN_MAIN' if b['reachable_main'] else 'RETAINED_IN_CANDIDATE' if b['reachable_recovery'] else 'UNMERGED_UNIQUE_WORK')
 if any(n in (102,104) for n in b['prs']):b['classification']='REJECTED_PRESERVED'
 if 103 in b['prs']:b['classification']='SUPERSEDED_PRESERVED'
 b['deletion_safe_now']=False
 b['final_disposition']='RETAIN; owner deletion approval absent'
 b['deletion_conditions']=['Owner approval','Fresh exact-tip reachability against approved protected retained refs','No PR/worktree/preview/deployment/workflow consumers','Preserve ignored artifacts and evidence']
 branches.append(b)
result={'captured_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'main_sha':main,'recovery_head_sha':candidate,'pull_requests':prs,'branches':branches,'worktrees':wt,'counts':{'prs':len(prs),'open_prs':sum(p['state']=='open' for p in prs),'remote_branches':len(remote),'local_branches':sum('local_sha' in b for b in branches),'branch_names_union':len(branches),'worktrees':len(wt)}}
(P/'inventory.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result['counts']))
print('PRs not in main:',[(p['number'],p['disposition'],p['head_reachable_recovery']) for p in prs if not p['head_reachable_main'] and p['disposition']!='E'])
print('Worktrees with changes:',[(w['worktree'],w['status'][:250]) for w in wt if w['status'] or w['status_exit_code']])
print('Exclusive branches:',[(b['name'],len(b['exclusive_commits_vs_all_other_branches'])) for b in branches if b['exclusive_commits_vs_all_other_branches']])

import json,pathlib,subprocess,collections,hashlib,shutil,datetime,gzip
R=pathlib.Path('/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026');P=pathlib.Path('/tmp/astronomy-recovery-20261026');D=R/'docs/validation/repository-recovery-20261026';D.mkdir(exist_ok=True);(D/'receipts').mkdir(exist_ok=True)
def read(n,default=None):
 p=P/(n+'.json');return json.loads(p.read_text()) if p.exists() else default
def git(*args):return subprocess.check_output(['git','-C',str(R),*args],text=True).strip()
x=read('inventory');candidate=git('rev-parse','0075b201');stack=[73,74,*range(78,96),101,105];consolidated=read('consolidated-pr',{});url=consolidated.get('html_url',consolidated.get('url','DRAFT_REVIEW_NOT_YET_CREATED'));closures=read('closures',[]);closed={p['number'] for p in closures if p.get('state')=='closed'}
x['runtime_qualified_sha']=candidate;x['consolidated_review_url']=url;x['inventory_scope']='Every PR 1-105 and all baseline remote/local branch names; new recovery PR is recorded separately. No mainline integration inferred from candidate reachability.'
for p in x['pull_requests']:
 n=p['number'];raw=read(f'pr-{n}');fs=read(f'pr-{n}-files',[]);comments=read(f'pr-{n}-comments',[])
 p['pr_delta_files']=[{k:f.get(k) for k in ['filename','status','additions','deletions','previous_filename']} for f in fs];p['functionality']=p['title'];p['children_prs']=[q['number'] for q in x['pull_requests'] if n in q['parent_prs']]
 p['incremental_commits']=(git('log','--format=%H %s',raw['base']['sha']+'..'+raw['head']['sha']) or '').splitlines()
 p['excluded_unique_commits_vs_candidate']=(git('log','--format=%H %s',p['head_sha'],'--not',candidate,x['main_sha']) or '').splitlines()
 p['review_threads']=read(f'pr-{n}-threads',[]);p['independent_exact_candidate_review']='Not performed; historical reviews do not approve the consolidated candidate'
 p['conversation_evidence']=[{'url':c['html_url'],'author':c['user']['login'],'excerpt':c['body'][:1800]} for c in comments if c['user']['type']=='User' and not c['body'].startswith('@')]
 p['reviews']=[{k:v for k,v in r.items() if k!='body'} for r in p['reviews']]
 p['owner_acceptance']='No whole-product acceptance inferred from historical author descriptions or passing CI'
 if n in (74,75):p['owner_acceptance']='N1 accepted explicitly on PR74 on 2026-10-17; historical 5/22 desktop and 7/22 mobile test limitation retained; not acceptance of later product changes'
 if n in stack:p.update(disposition='C',reason='Review vehicle superseded by one consolidated recovery draft; exact head reachable from candidate. Functionality retained, NOT integrated into main; candidate remains BLOCKED.',replacement=url,product_gate='Fresh unselected satellite pixel motion, security triage, source offer, exact-head independent review, owner/device acceptance')
 if n==71:p.update(disposition='C',reason='Automatic imagery/cache implementation carried into PR79 and evolved in candidate; seven distinct historical commits and evidence preserved in branch and verified bundle. No claim of whole-tree equivalence or mainline integration.',replacement=url)
 if n in [1,2,4,5,8,41,56,57]:p.update(disposition='C',reason='Closed historical dependency proposal on obsolete base; current locks supersede its review context. No claim of patch equivalence or vulnerability remediation; original head retained in rollback bundle.')
 if n==3:p.update(disposition='C',reason='Closed historical Phase B/Phase1 rescue review superseded by subsequent current architecture/runtime delivery; all excluded commit identities retained in fetched PR ref and verified bundle. Do not restore old shell wholesale.')
 if n==9:p.update(disposition='C',reason='Explicit closure points to merged PR10 as clean DSO-only replacement; unrelated older work retained in rollback bundle.')
 if n==40:p.update(disposition='F',reason='Closed identity-validation proposal contains unresolved leading-zero NORAD handling; preserve its two commits and tests. Native five-digit lookup and fresh admission were independently checked; old patch is not admitted.')
 if n==67:p.update(disposition='D',reason='Owner rejected dense overlapping aircraft visuals; live provider/device gates unresolved. Preserve 20 unique commits and acquisition/record contracts; do not restore rejected UI.')
 if n==76:p.update(disposition='F',reason='Exact dependency install fails ERESOLVE: ESLint10/import-plugin peer mismatch; grouped Vue3/Vuetify4 upgrades retain Vue2 dependencies. Requires a separate qualified migration or narrowed updates; excluded from candidate.')
 if n==77:p.update(disposition='F',reason='Exact lock installs and builds with pinned Node20; native/vendor output unchanged but app bundle differs. No browser qualification for that rebuilt variant, and broader legacy security/source-offer gates remain. Excluded from candidate; retained as focused dependency work.')
 if n in closed:p['state']='closed';p['closed_by_reconciliation']=True
 p['historical_ci_only']=True
for b in x['branches']:
 prs=[p for p in x['pull_requests'] if p['number'] in b['prs']];b['associated_prs']=[{'number':p['number'],'state':p['state'],'disposition':p['disposition']} for p in prs]
 b['supports_open_prs']=[p['number'] for p in x['pull_requests'] if p['state']=='open' and p['base']==b['name']]
 b['local_diverges_remote']=bool(b.get('local_sha') and b.get('remote_sha') and b['local_sha']!=b['remote_sha'])
 b['exclusive_changes']={c.split()[0]:git('show','--format=','--name-status',c.split()[0]).splitlines() for c in b['exclusive_commits_vs_all_other_branches']}
 b['workflow_consumers']=[str(f.relative_to(R)) for f in (R/'.github/workflows').glob('*') if b['name'] in f.read_text()]
 b['deployment_consumers']='No GitHub deployment records; local container/worktree consumers enumerated; external unregistered consumers cannot be excluded'
 eligible=bool(b.get('remote_sha') and b['name']!='main' and b['reachable_main'] and not b['worktrees'] and not b['container_consumers'] and not b['workflow_consumers'] and not b['supports_open_prs'] and not any(p['state']=='open' for p in prs))
 b['remote_cleanup_review_candidate']=eligible;b['deletion_safe_now']=False;b['final_disposition']='RETAIN pending consolidated owner deletion approval; local worktrees/artifacts not deletion targets'
 b['preservation']='Exact tips and unique histories in repository-preservation.bundle; existing branches/worktrees/data retained'
x['counts']['open_baseline_prs_after']=sum(p['state']=='open' for p in x['pull_requests']);x['counts']['dispositions']=dict(collections.Counter(p['disposition'] for p in x['pull_requests']));x['generated_at']=datetime.datetime.now(datetime.timezone.utc).isoformat()
(D/'inventory-detail.json.gz').write_bytes(gzip.compress((json.dumps(x,indent=2)+'\n').encode(),mtime=0))
for p in x['pull_requests']:
 p['changes_from_main_count']=len(p.pop('changes_from_main'));p['cumulative_changes_evidence']='inventory-detail.json.gz:pull_requests[number='+str(p['number'])+'].changes_from_main'
for b in x['branches']:
 for key in ['changes_from_main','binary_or_data_evidence_changes']:
  b[key+'_count']=len(b.pop(key))
 b['cumulative_change_evidence']='inventory-detail.json.gz:branches[name='+b['name']+']'
(D/'inventory.json').write_text(json.dumps(x,indent=2)+'\n')
prlines=['# PR disposition ledger','',f'Runtime candidate: `{candidate}`. C for the stack means superseded review vehicle, **not mainline integration**. New review: {url}.','', '| PR | Disposition | State | Implementation / reason |','|---|---|---|---|']
for p in x['pull_requests']:prlines.append(f"| [#{p['number']}]({p['url']}) | {p['disposition']} | {p['state']} | {p['title'].replace('|','/')} — {p['reason'].replace('|','/')} |")
(D/'PR_DISPOSITIONS.md').write_text('\n'.join(prlines)+'\n')
bl=['# Branch disposition ledger','','All baseline branches retained. No local worktree, ignored data or artifact is proposed for deletion. Exact tips, divergence, unique commits, changed paths and consumers are in inventory.json.','', '| Branch | Remote tip | Local tip | Classification | PRs | Worktree / container consumers |','|---|---|---|---|---|---|']
for b in x['branches']:bl.append(f"| {b['name']} | {b.get('remote_sha','—')[:12]} | {b.get('local_sha','—')[:12]} | {b['classification']} | {', '.join('#'+str(n) for n in b['prs']) or 'none'} | {len(b['worktrees'])} / {len(b['container_consumers'])} |")
(D/'BRANCH_DISPOSITIONS.md').write_text('\n'.join(bl)+'\n')
cleanup=[{'branch':b['name'],'expected_remote_sha':b['remote_sha'],'reachable_from_main':x['main_sha'],'delete_local_branch':False,'delete_worktree':False} for b in x['branches'] if b['remote_cleanup_review_candidate']]
(D/'remote-cleanup-proposal.json').write_text(json.dumps({'status':'NOT_AUTHORIZED_NOT_EXECUTED','conditions':['Owner consolidated approval','Fresh remote SHA equality and reachability','Recheck registered and owner external consumers immediately before deletion'],'branches':cleanup},indent=2)+'\n')
(D/'proposed-main-protection.json').write_text(json.dumps({'required_status_checks':{'strict':True,'contexts':['Repository source checks','CodeQL']},'enforce_admins':True,'required_pull_request_reviews':{'dismiss_stale_reviews':True,'require_code_owner_reviews':False,'required_approving_review_count':1,'require_last_push_approval':True},'restrictions':None,'required_linear_history':False,'allow_force_pushes':False,'allow_deletions':False,'block_creations':False,'required_conversation_resolution':True,'lock_branch':False,'allow_fork_syncing':False},indent=2)+'\n')
# Small, selected receipts; raw full API capture remains preserved locally.
for name in ['backend-disposable-full.log','backend-test-command.json','backend_tests.py','candidate-node.log','frontend-tests.log','typecheck.log','hub-build.log','runtime-baseline.log','sky-artifact-red.log','runtime-green.log','source-validation.log','clean-build-comparison.json','preview-receipt.json','feed-live.json','frontend-audit.json','sky-audit.json','pr76-install.log','pr77-install-network.log','pr77-pinned-build.log','browser-smoke-corrected.log','browser-planetary.log','browser-earth-search.log','browser-sky-controls.log','browser-sky-search.log','browser-sky-search-current.log','browser-moon-return.log','browser-current-moon.log','native-count.log','source-package.json','bundle.sha256','bundle-verify.log','analysis-final.log','backend-disposable-final.log','backend-test-command-final.json','backend_tests_final.py','candidate-node-final.log','frontend-tests-at-sha.log','typecheck-at-sha.log','hub-mobile-fix-build.log','browser-sky-search-final.log']:
 if (P/name).exists():shutil.copy2(P/name,D/'receipts'/name)
for path,name in [('output/playwright/recovery/smoke.json','browser-smoke.json'),('output/playwright/recovery/planetary/proof.json','planetary-browser.json'),('output/playwright/recovery/sky-controls/proof.json','sky-controls.json'),('output/playwright/recovery/sky-search-final/proof.json','sky-search.json'),('output/playwright/recovery/earth-search-cases.json','earth-search.json'),('output/playwright/recovery/native-count.json','native-count.json'),('output/playwright/recovery/native-inventory.json','native-photometry.json'),('output/playwright/recovery/native-moon/receipt.json','native-moon.json')]:
 if (R/path).exists():shutil.copy2(R/path,D/'receipts'/name)
for name in ['collect.py','analyze.py','collect_remaining.py','package_report.py']:shutil.copy2(P/name,D/'receipts'/name)
print('Packaged',x['counts'],'cleanup proposals',len(cleanup))

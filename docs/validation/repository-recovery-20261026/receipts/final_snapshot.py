import json,pathlib,subprocess,datetime
P=pathlib.Path('/tmp/astronomy-recovery-20261026');R=pathlib.Path('/home/rocco/Astronomy-Hub');C=R/'.worktrees/repository-recovery-20261026'
def run(a):return subprocess.check_output(a,text=True)
def api(path):return json.loads(run(['gh','api',path]))
def pages(path):return [v for page in json.loads(run(['gh','api','--paginate','--slurp',path])) for v in page]
old=json.load(open(P/'remote-branches.json'));bs=pages('repos/Shadowgar/Astronomy-Hub/branches?per_page=100');prs=pages('repos/Shadowgar/Astronomy-Hub/pulls?state=all&per_page=100');by={b['name']:b for b in bs};assert all(by[b['name']]['commit']['sha']==b['commit']['sha'] for b in old)
(P/'remote-branches-after.json').write_text(json.dumps(bs,indent=2));(P/'prs-after.json').write_text(json.dumps(prs,indent=2))
before=json.load(open(P/'containers.json'));ids=run(['docker','ps','-aq']).split();current=json.loads(run(['docker','inspect',*ids]));byid={v['Id']:v for v in current};container_changes=[]
for c in before:
 now=byid.get(c['Id']);diff=[]
 if not now:diff=['missing']
 else:
  for k in ['Image','State','Mounts']:
   if k=='Mounts':
    if sorted(now[k],key=lambda m:m['Destination'])!=sorted(c[k],key=lambda m:m['Destination']):diff.append(k)
   elif k=='State':
    if {z:v for z,v in now[k].items() if z!='Health'}!={z:v for z,v in c[k].items() if z!='Health'}:diff.append(k)
    if now[k].get('Health',{}).get('Status')!=c[k].get('Health',{}).get('Status'):diff.append('Health.Status')
   elif now[k]!=c[k]:diff.append(k)
 if diff:container_changes.append({'name':c['Name'],'changed':diff})
volbefore=json.load(open(P/'docker-volumes.json'));volafter=run(volbefore['command']);oldvol={json.loads(l)['Name'] for l in volbefore['stdout'].splitlines()};newvol={json.loads(l)['Name'] for l in volafter.splitlines()}
rootbefore=json.load(open(P/'root-status.json'));rootafter=subprocess.check_output(rootbefore['command'],text=True,cwd=R);treebefore=json.load(open(P/'inventory.json'))['worktrees'];treechanges=[]
for w in treebefore:
 if w['worktree']==str(C):continue
 st=run(['git','-C',w['worktree'],'status','--porcelain=v1','--untracked-files=normal']);head=run(['git','-C',w['worktree'],'rev-parse','HEAD']).strip()
 if st!=w['status'] or head!=w['HEAD']:treechanges.append({'path':w['worktree'],'status':st,'head':head})
checks=api('repos/Shadowgar/Astronomy-Hub/commits/'+run(['git','-C',str(C),'rev-parse','HEAD']).strip()+'/check-runs?per_page=100');(P/'candidate-checks.json').write_text(json.dumps(checks,indent=2))
result={'captured_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'main_sha':by['main']['commit']['sha'],'open_prs':[{'number':p['number'],'url':p['html_url'],'draft':p['draft'],'head_sha':p['head']['sha']} for p in prs if p['state']=='open'],'pr_count':len(prs),'remote_branch_count':len(bs),'original_branch_tips_unchanged':True,'closed_without_merge':[{'number':p['number'],'state':p['state'],'merged_at':p['merged_at'],'head_sha':p['head']['sha']} for p in prs if p['number'] in [71,73,74,*range(78,96),101,105]],'original_container_count':len(before),'original_container_changes':container_changes,'new_containers':[{'name':v['Name'],'image':v['Image']} for v in current if v['Id'] not in {c['Id'] for c in before}],'volumes_before':len(oldvol),'volumes_after':len(newvol),'volumes_added':sorted(newvol-oldvol),'volumes_removed':sorted(oldvol-newvol),'owner_status_unchanged':rootafter==rootbefore['stdout'],'owner_status':rootafter,'existing_worktree_changes':treechanges,'candidate_head':run(['git','-C',str(C),'rev-parse','HEAD']).strip(),'tested_code_sha':'e1bd2e57a2658552815f661609c5177315eb2731','application_diff_after_tested_sha':run(['git','-C',str(C),'diff','--name-only','e1bd2e57','HEAD','--','frontend','backend','runtimes','integrations','packages','scripts','tests'])}
(P/'final-snapshot.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))

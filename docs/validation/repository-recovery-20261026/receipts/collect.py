import concurrent.futures, datetime, json, pathlib, subprocess

OUT = pathlib.Path('/tmp/astronomy-recovery-20261026')
REPO = 'repos/Shadowgar/Astronomy-Hub'

def run(args):
    p = subprocess.run(args, text=True, capture_output=True)
    return {'command': args, 'exit_code': p.returncode, 'stdout': p.stdout, 'stderr': p.stderr}

def api(path, name, pages=False):
    args = ['gh', 'api'] + (['--paginate', '--slurp'] if pages else []) + [REPO + path]
    r = run(args)
    if r['exit_code'] == 0:
        value = json.loads(r['stdout'])
        if pages: value = [v for page in value for v in page]
        (OUT / (name + '.json')).write_text(json.dumps(value, indent=2) + '\n')
    else: value = None
    (OUT / (name + '.receipt.json')).write_text(json.dumps({k:v for k,v in r.items() if k != 'stdout'}, indent=2))
    return value

prs = api('/pulls?state=all&per_page=100', 'prs', True)
branches = api('/branches?per_page=100', 'remote-branches', True)
api('', 'repository')
api('/branches/main/protection', 'main-protection')
api('/rulesets?per_page=100', 'rulesets', True)
api('/actions/workflows?per_page=100', 'workflows')
api('/environments?per_page=100', 'environments')
api('/deployments?per_page=100', 'deployments', True)
jobs = []
for pr in prs:
    n = pr['number']
    jobs.append((f'/pulls/{n}', f'pr-{n}'))
    if pr['state'] == 'open' or n >= 71:
        for suffix, endpoint in [('files', f'/pulls/{n}/files'), ('commits', f'/pulls/{n}/commits'), ('reviews', f'/pulls/{n}/reviews'), ('comments', f'/issues/{n}/comments'), ('review-comments', f'/pulls/{n}/comments')]:
            jobs.append((endpoint+'?per_page=100', f'pr-{n}-{suffix}', True))
        jobs.append((f'/commits/{pr["head"]["sha"]}/check-runs?per_page=100', f'pr-{n}-checks'))
        jobs.append((f'/commits/{pr["head"]["sha"]}/status', f'pr-{n}-status'))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(lambda args: api(*args), jobs))
for name, args in [
    ('remote-refs', ['git','ls-remote','origin']),
    ('refs', ['git','for-each-ref','--format=%(refname) %(objectname)']),
    ('worktrees', ['git','worktree','list','--porcelain']),
    ('root-status', ['git','status','--porcelain=v1']),
    ('docker-ps', ['docker','ps','-a','--format','{{json .}}']),
    ('docker-volumes', ['docker','volume','ls','--format','{{json .}}']),
    ('docker-images', ['docker','image','ls','--format','{{json .}}'])]:
    (OUT / (name+'.json')).write_text(json.dumps(run(args), indent=2))
ids = run(['docker','ps','-aq'])['stdout'].split()
containers = []
if ids:
    r = run(['docker','inspect',*ids])
    if r['exit_code'] == 0:
        for c in json.loads(r['stdout']):
            containers.append({k:c.get(k) for k in ['Id','Name','Image','State','Mounts']} | {'labels':c.get('Config',{}).get('Labels'), 'ports':c.get('HostConfig',{}).get('PortBindings')})
(OUT/'containers.json').write_text(json.dumps(containers,indent=2))
(OUT/'snapshot.json').write_text(json.dumps({'captured_at':datetime.datetime.now(datetime.timezone.utc).isoformat(), 'prs':len(prs), 'open_prs':sum(p['state']=='open' for p in prs), 'remote_branches':len(branches), 'failed_detail_calls':sum(r is None for r in results), 'containers':len(containers)}, indent=2))
print((OUT/'snapshot.json').read_text())

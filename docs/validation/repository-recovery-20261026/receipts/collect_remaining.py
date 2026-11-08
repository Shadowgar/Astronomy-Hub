import concurrent.futures,json,pathlib,subprocess
P=pathlib.Path('/tmp/astronomy-recovery-20261026')
def job(args):
 n,kind,endpoint=args
 p=subprocess.run(['gh','api','--paginate','--slurp','repos/Shadowgar/Astronomy-Hub'+endpoint+'?per_page=100'],capture_output=True,text=True)
 if p.returncode==0:(P/f'pr-{n}-{kind}.json').write_text(json.dumps([item for page in json.loads(p.stdout) for item in page],indent=2))
 else:(P/f'pr-{n}-{kind}.error.txt').write_text(p.stderr)
 return p.returncode
jobs=json.loads((P/'remaining-api-jobs.json').read_text())
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:res=list(pool.map(job,jobs))
print('historical detail endpoints',len(res),'failures',sum(bool(x) for x in res))
query='''query($n:Int!,$cursor:String){repository(owner:"Shadowgar",name:"Astronomy-Hub"){pullRequest(number:$n){reviewThreads(first:100,after:$cursor){nodes{id isResolved isOutdated path comments(first:100){nodes{url body author{login} commit{oid}}}} pageInfo{hasNextPage endCursor}}}}}'''
for pr in json.loads((P/'prs.json').read_text()):
 if pr['state']!='open':continue
 rows=[];cursor=None
 while True:
  args=['gh','api','graphql','-f','query='+query,'-F','n='+str(pr['number'])]
  if cursor:args+=['-f','cursor='+cursor]
  p=subprocess.run(args,capture_output=True,text=True)
  if p.returncode:print('threads error',pr['number'],p.stderr);break
  data=json.loads(p.stdout)['data']['repository']['pullRequest']['reviewThreads'];rows+=data['nodes']
  if not data['pageInfo']['hasNextPage']:break
  cursor=data['pageInfo']['endCursor']
 (P/f'pr-{pr["number"]}-threads.json').write_text(json.dumps(rows,indent=2))
print('open PR review threads captured')

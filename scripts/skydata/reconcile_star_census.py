import json, importlib.util, subprocess
from pathlib import Path
from collections import Counter,defaultdict
import sys
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT))
from backend.app.services import star_science as new
from scripts.skydata.catalog_sources.stars import load_vizier_stars
oldtext=subprocess.check_output(['git','show','54c9c58f:scripts/skydata/build_oras_dense_star_tiles.py'],cwd=ROOT,text=True)
old=type(sys)('baseline_dense');old.__file__=str(ROOT/'scripts/skydata/build_oras_dense_star_tiles.py');exec(compile(oldtext,old.__file__,'exec'),old.__dict__)
bright=list(load_vizier_stars(ROOT/'data/catalog-sources/oras-major-catalog-update-1/hipparcos_bright.tsv','hipparcos_bright'))
def read(root):
 m=json.loads((root/'manifest.json').read_text());return [json.loads(line) for p in m['packs'] if p['pack_id']=='stars-core' for c in p['chunks'] for line in (root/c['path']).read_text().splitlines()]+bright

def details(records,modern):
 eligible=[r for r in records if str(r.get('catalog','')).casefold() not in new.SUPPLEMENTAL_RENDER_CATALOGS or new._record_identity(r)]
 groups=new._identity_groups(eligible);ambiguous=[]
 unsafe_groups=[g for g in groups if new._isolate_ambiguous_components(g)[1]]
 unsafe_edges=sum(len(g)-1 for g in unsafe_groups)
 if modern:
  refined=[]
  for g in groups:
   gs,affected=new._isolate_ambiguous_components(g)
   if affected:
    ambiguous.append({'records':[{'catalog':r['catalog'],'source_id':r['source_id'],'ids':new._record_identity(r),'ra':r['ra'],'dec':r['dec']} for r in g], 'preserved_groups':len(gs)})
   refined+=gs
  groups=refined
 # Count a deterministic spanning forest: same-catalog edges before cross-catalog edges (unsafe foreign-ID edges are labeled separately).
 parents=list(range(len(eligible))); ids_to_index={id(r):i for i,r in enumerate(eligible)}
 categories=Counter(); group_compositions=Counter()
 for g in groups:
  localparent=list(range(len(g)))
  def find(i):
   while localparent[i]!=i:i=localparent[i]
   return i
  def fam(r):
   c=r['catalog'].casefold();return 'Gaia' if c.startswith('gaia') else 'HIP' if 'hipparcos' in c else 'Tycho' if 'tycho' in c else c
  edges=[];owners=defaultdict(list)
  for i,r in enumerate(g):
   for k,v in new._record_identity(r).items():owners[(k,v)].append(i)
  for (key,value),members in owners.items():
   for n,i in enumerate(members):
    for j in members[n+1:]:
     pair=sorted([fam(g[i]),fam(g[j])]);cat=('exact-ID' if new._record_identity(g[i]) == new._record_identity(g[j]) else 'ambiguous-same-catalog') if pair[0]==pair[1] else '/'.join(pair)
     edges.append((pair[0]!=pair[1],cat,key,value,i,j))
  for _,cat,key,value,i,j in sorted(edges):
   if find(i)!=find(j):localparent[find(i)]=find(j);categories[cat]+=1
  assert len({find(i) for i in range(len(g))})==1
  group_compositions['+'.join(sorted(set(fam(r) for r in g)))]+=1
 canonical,stats=(new.reconcile_star_records(records) if modern else old.reconcile_star_records(records))
 return {'ambiguous_groups_before_guard':len(unsafe_groups),'unsafe_union_edges_before_guard':unsafe_edges,'source_records':len(records),'merge_edges':dict(categories),'positional_merges':0,'malformed_rejected':0,'duplicate_source_identity_records':sum(n-1 for n in Counter((r['catalog'],r['source_id']) for r in records).values()),'stats':stats,'group_compositions':dict(group_compositions),'ambiguous_components':ambiguous,'canonical_catalogs':dict(Counter(r['catalog'] for r in canonical))}
import argparse
parser=argparse.ArgumentParser(description='Explain star census by exact source-ID union edges; never position matching.')
parser.add_argument('baseline_root',type=Path)
parser.add_argument('rebuilt_root',type=Path)
parser.add_argument('--output',type=Path,default=ROOT/'output/playwright/star-contract-repair/census-reconciliation.json')
args=parser.parse_args()
oldroot=args.baseline_root
newroot=args.rebuilt_root
report={'baseline':details(read(oldroot),False),'rebuilt_current_rules':details(read(newroot),True),'method':'Deterministic spanning forest: same-catalog edges first, then catalog-pair lexical order; same-catalog foreign-ID collapses are labeled ambiguous, never exact duplicates. Each successful union counted once. No coordinate/name edges.'}
p=args.output;p.write_text(json.dumps(report,indent=2));print(json.dumps({k:{x:y for x,y in v.items() if x!='ambiguous_components'} for k,v in report.items() if isinstance(v,dict)},indent=2))

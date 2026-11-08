import {it,expect,vi,beforeEach,afterEach} from 'vitest'
import {validateSourceOffer,loadSourceOffer} from '../src/features/workspace/sourceOffer'
const manifest=()=>({schema:1,status:'candidate',source_revision:'a'.repeat(40),archive:{url:'/source-distribution/astronomy-hub-source-'+'a'.repeat(40)+'.tar.gz',sha256:'b'.repeat(64),bytes:123456},runtime:{sky_artifact_sha256:'c'.repeat(64),native_wasm_sha256:'d'.repeat(64)},licenses:[{name:'GNU AGPL v3',url:'/licenses/stellarium-web-engine-AGPL-3.0.txt'},{name:'Hub MIT',url:'/licenses/astronomy-hub-MIT.txt'}],limitations:['Public retrieval is unqualified.']})
const versions=()=>({sky:{artifact_sha256:'c'.repeat(64),native_horizon:{native_output_sha256:{'stellarium-web-engine.wasm':'d'.repeat(64)}}}})
beforeEach(()=>vi.stubEnv('VITE_SOURCE_REVISION','a'.repeat(40)))
afterEach(()=>vi.unstubAllEnvs())
it('admits a versioned local candidate and a separately declared published release',()=>{
 expect(validateSourceOffer(manifest()).status).toBe('candidate')
 expect(validateSourceOffer({...manifest(),status:'published'}).status).toBe('published')
})
it('rejects absent or malformed source identity instead of offering an old branch archive',()=>{
 for(const change of [(m:any)=>m.schema=2,(m:any)=>m.status='verified',(m:any)=>m.source_revision='main',(m:any)=>m.archive.sha256='old',(m:any)=>m.archive.bytes=0,(m:any)=>m.archive.bytes=Number.MAX_SAFE_INTEGER+1,(m:any)=>m.runtime.native_wasm_sha256=null,(m:any)=>m.licenses=[],(m:any)=>m.licenses[0].url='/licenses/unrelated.txt',(m:any)=>m.limitations=['']]){
  const m=manifest();change(m);expect(()=>validateSourceOffer(m)).toThrow()
 }
 for(const value of [null,{},[],{schema:1}])expect(()=>validateSourceOffer(value)).toThrow()
})
it.each(['https://outside.example/archive.tar.gz','//outside.example/archive.tar.gz','javascript:alert(1)','/source-distribution/../old.tar.gz','/source-distribution/%2e%2e/old.tar.gz','/source-distribution/archive.tar.gz?redirect=x','/source-distribution//old.tar.gz'])('rejects untrusted or noncanonical archive retrieval location %s',url=>{
 expect(()=>validateSourceOffer({...manifest(),archive:{...manifest().archive,url}})).toThrow()
})
it('rejects remote license links and bounds display text',()=>{
 const m=manifest();m.licenses[1].url='https://outside.example/license';expect(()=>validateSourceOffer(m)).toThrow()
 m.licenses[1].url='/licenses/hub-MIT.txt';m.limitations=['x'.repeat(1001)];expect(()=>validateSourceOffer(m)).toThrow()
})
it('loads the current manifest without HTTP cache and retains its exact release identity',async()=>{
 const controller=new AbortController(),fetcher=vi.fn(async(path:RequestInfo|URL)=>new Response(JSON.stringify(path==='/runtime-versions.json'?versions():manifest())))
 expect(await loadSourceOffer(controller.signal,fetcher)).toEqual(manifest())
 expect(fetcher).toHaveBeenCalledWith('/source-distribution/manifest.json',{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}})
 expect(fetcher).toHaveBeenCalledWith('/runtime-versions.json',{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}})
})
it('withholds a source offer when retrieval is unavailable, returns a SPA page, or aborts',async()=>{
 const controller=new AbortController()
 for(const response of [new Response('missing',{status:404}),new Response('<html>Hub</html>'),new Response('{}'),new Response('x'.repeat(65537))])await expect(loadSourceOffer(controller.signal,async()=>response)).rejects.toThrow()
 controller.abort();await expect(loadSourceOffer(controller.signal,async()=>new Response(JSON.stringify(manifest())))).rejects.toThrow()
})

it('rejects an archive filename for a different source revision',()=>{
 const m=manifest();m.archive.url='/source-distribution/astronomy-hub-source-'+'e'.repeat(40)+'.tar.gz';expect(()=>validateSourceOffer(m)).toThrow()
})
it('withholds matching-source claims when the Hub build has no pinned source revision',async()=>{
 vi.stubEnv('VITE_SOURCE_REVISION','');const fetcher=vi.fn(async()=>new Response(JSON.stringify(manifest())))
 await expect(loadSourceOffer(new AbortController().signal,fetcher)).rejects.toThrow()
})
it('rejects a well-formed sidecar for a different compiled Hub revision',async()=>{
 const old=manifest();old.source_revision='e'.repeat(40);old.archive.url='/source-distribution/astronomy-hub-source-'+old.source_revision+'.tar.gz'
 await expect(loadSourceOffer(new AbortController().signal,async path=>new Response(JSON.stringify(path==='/runtime-versions.json'?versions():old)))).rejects.toThrow()
})
it.each(['artifact','wasm','missing'])('withholds a download when served Sky metadata differs: %s',async field=>{
 const metadata=versions();if(field==='artifact')metadata.sky.artifact_sha256='e'.repeat(64);else if(field==='wasm')metadata.sky.native_horizon.native_output_sha256['stellarium-web-engine.wasm']='e'.repeat(64)
 await expect(loadSourceOffer(new AbortController().signal,async path=>new Response(JSON.stringify(path==='/runtime-versions.json'?(field==='missing'?{}:metadata):manifest())))).rejects.toThrow()
})
it.each([404,200])('rejects unavailable or SPA runtime metadata with HTTP %s',async status=>{
 await expect(loadSourceOffer(new AbortController().signal,async path=>path==='/runtime-versions.json'?new Response('<html>Hub</html>',{status}):new Response(JSON.stringify(manifest())))).rejects.toThrow()
})

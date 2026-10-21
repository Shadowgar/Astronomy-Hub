/** Nonblocking GPU timer. Unsupported/disjoint measurements stay unavailable. */
export function gpuTiming(gl:WebGL2RenderingContext){
 const extension=gl.getExtension('EXT_disjoint_timer_query_webgl2')
 const pending:WebGLQuery[]=[],samples:number[]=[];let active:WebGLQuery|null=null
 function collect(){
  if(!extension||gl.isContextLost())return
  if(gl.getParameter(extension.GPU_DISJOINT_EXT)){for(const q of pending)gl.deleteQuery(q);pending.length=0;samples.length=0;return}
  while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){
   const q=pending.shift()!;samples.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);if(samples.length>180)samples.shift()
  }
 }
 return{
  begin(){collect();if(extension&&pending.length<12&&!gl.isContextLost()){active=gl.createQuery();if(active)gl.beginQuery(extension.TIME_ELAPSED_EXT,active)}},
  end(){if(active){gl.endQuery(extension.TIME_ELAPSED_EXT);pending.push(active);active=null}},
  read(){collect();const sorted=[...samples].sort((a,b)=>a-b);return{supported:!!extension,samples:sorted.length,median:sorted.length?sorted[Math.floor(sorted.length*.5)]:null,p95:sorted.length?sorted[Math.floor(sorted.length*.95)]:null}},
  reset(){for(const q of pending)gl.deleteQuery(q);pending.length=0;samples.length=0},
  dispose(){for(const q of pending)gl.deleteQuery(q);if(active)gl.deleteQuery(active);pending.length=0;active=null}
 }
}

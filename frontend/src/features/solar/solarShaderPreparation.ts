/** Cancellable equivalent of pinned Three r180 compileAsync polling. Its native
 * compileAsync timeout reads disposed material properties after route teardown;
 * this adapter stops before any such access. No validation suppression and no
 * draw, camera change, secondary renderer or independent animation loop.
 * WebGLRenderer.compile/currentProgram/isReady match the pinned r180 source. */
export async function prepareSolarShaders(renderer:any,scene:any,camera:any,signal:AbortSignal):Promise<{state:'ready'|'aborted';supported:boolean;materials:number;milliseconds:number}>{
 const started=performance.now(),supported=renderer.extensions.has('KHR_parallel_shader_compile')
 if(signal.aborted||!supported)return Promise.resolve({state:signal.aborted?'aborted':'ready',supported,materials:0,milliseconds:0})
 const materials:Set<any>=renderer.compile(scene,camera),count=materials.size
 return new Promise((resolve,reject)=>{
  let timer:ReturnType<typeof setTimeout>|undefined,finished=false
  const finish=(state:'ready'|'aborted',error?:Error)=>{if(finished)return;finished=true;clearTimeout(timer);signal.removeEventListener('abort',abort);if(error)reject(error);else resolve({state,supported,materials:count,milliseconds:performance.now()-started})}
  const abort=()=>finish('aborted')
  const poll=()=>{
   if(signal.aborted){abort();return}
   try{
    for(const material of materials){const program=renderer.properties.get(material).currentProgram;if(!program)throw Error('Shader program retired before preparation');if(program.isReady())materials.delete(material)}
    if(!materials.size){finish('ready');return}
    if(performance.now()-started>30000)throw Error('Shader preparation timed out')
    timer=setTimeout(poll,10)
   }catch(error){finish('aborted',error instanceof Error?error:Error('Shader preparation failed'))}
  }
  signal.addEventListener('abort',abort,{once:true});poll()
 })
}

import {describe,it,expect} from 'vitest'
import {gpuTiming} from '../src/features/solar/solarGpuTiming'
function driver(supported=true){
 const pending=new Set<object>();let available=false,disjoint=false,reads=0
 const gl={QUERY_RESULT_AVAILABLE:1,QUERY_RESULT:2,getExtension:()=>supported?{GPU_DISJOINT_EXT:3,TIME_ELAPSED_EXT:4}:null,isContextLost:()=>false,getParameter:()=>disjoint,createQuery:()=>{const q={};pending.add(q);return q},beginQuery:()=>{},endQuery:()=>{},deleteQuery:(q:object)=>pending.delete(q),getQueryParameter:(_q:object,p:number)=>p===1?available:(reads++,8000000)}
 return{gl:gl as unknown as WebGL2RenderingContext,pending,setAvailable:()=>available=true,setDisjoint:()=>disjoint=true,reads:()=>reads}
}
describe('GPU measurements stay asynchronous and honest',()=>{
 it('reports unavailable without allocating queries on unsupported drivers',()=>{const d=driver(false),timer=gpuTiming(d.gl);timer.begin();timer.end();expect(timer.read()).toEqual({supported:false,samples:0,median:null,p95:null});expect(d.pending.size).toBe(0)})
 it('bounds unresolved queries and never reads their results synchronously',()=>{const d=driver(),timer=gpuTiming(d.gl);for(let i=0;i<20;i++){timer.begin();timer.end()}expect(d.pending.size).toBe(12);expect(d.reads()).toBe(0);expect(timer.read().median).toBeNull();d.setAvailable();expect(timer.read()).toEqual({supported:true,samples:12,median:8,p95:8});expect(d.pending.size).toBe(0);timer.reset();expect(timer.read().samples).toBe(0)})
 it('discards disjoint measurements and deletes outstanding queries on teardown',()=>{const d=driver(),timer=gpuTiming(d.gl);timer.begin();timer.end();d.setDisjoint();expect(timer.read().median).toBeNull();expect(d.pending.size).toBe(0);timer.begin();timer.end();timer.dispose();expect(d.pending.size).toBe(0)})
})

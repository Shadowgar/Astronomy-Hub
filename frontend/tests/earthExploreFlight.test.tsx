import {beforeEach,expect,it,vi} from 'vitest'
const hooks=vi.hoisted(()=>({values:[] as any[],index:0,refs:[] as any[]}))
vi.mock('react',async importOriginal=>({...await importOriginal<typeof import('react')>(),useEffect:()=>{},useRef:()=>{const ref={current:null};hooks.refs.push(ref);return ref},useState:(initial:any)=>{const index=hooks.index++;if(!(index in hooks.values))hooks.values[index]=initial;return [hooks.values[index],(value:any)=>{hooks.values[index]=typeof value==='function'?value(hooks.values[index]):value}]}}))
import EarthExplore from '../src/features/workspace/EarthExplore'
const nodes=(node:any):any[]=>!node||typeof node!=='object'?[]:[node,...(Array.isArray(node.props?.children)?node.props.children:[node.props?.children]).flatMap(nodes)]
const render=(props:any)=>{hooks.index=0;hooks.refs=[];return nodes(EarthExplore(props))}
const flush=async()=>{for(let n=0;n<6;n++)await Promise.resolve()}
beforeEach(()=>{hooks.values=['36.1699','-115.1398',false,''];hooks.index=0;hooks.refs=[]})
for(const success of [true,false])it(`blocks Sky handoff during an unresolved coordinate flight and releases it after ${success?'success':'failure'}`,async()=>{
 let finish:(value:boolean)=>void=()=>{};const props={busy:false,onSky:vi.fn(),onLocation:vi.fn(()=>new Promise<boolean>(resolve=>finish=resolve)),center:vi.fn()};let tree=render(props)
 tree.find(n=>n.type==='form').props.onSubmit({preventDefault:vi.fn()});expect(props.onLocation).toHaveBeenCalledWith({lat:36.1699,lon:-115.1398});tree=render(props)
 expect(tree.find(n=>n.type==='button'&&n.props.children==='Enter Sky here').props.disabled).toBe(true)
 expect(tree.find(n=>n.type==='button'&&n.props.type==='submit').props.disabled).toBe(true)
 expect(props.onSky).not.toHaveBeenCalled();finish(success);await flush();tree=render(props)
 expect(tree.find(n=>n.type==='button'&&n.props.children==='Enter Sky here').props.disabled).toBe(false)
 expect(tree.find(n=>n.props?.role==='alert')!==undefined).toBe(!success)
})

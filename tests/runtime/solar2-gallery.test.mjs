import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
const html=readFileSync(new URL('../../docs/validation/solar-system-2/gallery/index.html',import.meta.url),'utf8'),script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'))
function open(){
 class Element{listeners={};attributes={};textContent='';addEventListener(type,fn){this.listeners[type]=fn}setAttribute(key,value){this.attributes[key]=value}set innerHTML(_){throw Error('HTML sink forbidden')}set outerHTML(_){throw Error('HTML sink forbidden')}insertAdjacentHTML(){throw Error('HTML sink forbidden')}}
 const nodes=new Map(['scene','desktop','portrait','landscape','before','before-link','after','after-link','caption'].map(id=>[id,new Element()]))
 vm.runInNewContext(script,{document:{getElementById:id=>nodes.get(id)}})
 return{nodes,choose(value){nodes.get('scene').listeners.change({currentTarget:{value}})},layout(value){nodes.get(value).listeners.click()},urls(){return ['before','before-link','after','after-link'].map(id=>nodes.get(id)[id.endsWith('link')?'href':'src'])}}
}
test('all12 trusted scene/layout combinations preserve safe exact targets',()=>{const g=open();for(const scene of ['overview','saturn','earth','mars'])for(const layout of ['desktop','portrait','landscape']){g.choose(scene);g.layout(layout);assert.deepEqual(g.urls(),[`before/${layout}-${scene}.png`,`before/${layout}-${scene}.png`,`after/${layout}-${scene}.png`,`after/${layout}-${scene}.png`]);assert.equal(g.nodes.get(layout).attributes['aria-pressed'],'true')}})
test('hostile scene text never becomes a URL or interpreted HTML',()=>{const g=open();g.choose('saturn');const previous=g.urls();for(const value of ['','__proto__','constructor','../../outside','javascript:alert(1)','//outside.invalid','\"><img src=x onerror=alert(1)>']){g.choose(value);assert.deepEqual(g.urls(),previous)}g.choose('earth');assert.notDeepEqual(g.urls(),previous)})

import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'

const html=readFileSync(new URL('../../docs/validation/repository-recovery-20261026/visual-fidelity/index.html',import.meta.url),'utf8')
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'))
const modes=['solar','solar-mars','earth','sky','moon'],sizes=['desktop','portrait','landscape']
const references=['solar-primary-cinematic.png','solar-adaptive-explorer.png']
function openGallery(pathname='/owner-review/visual-fidelity/'){
 class Element{
  constructor(tag='div'){this.tagName=tag;this.listeners={};this.attributes={};this.children=[];this.dataset={};this.value='';this.textContent=''}
  addEventListener(type,fn){this.listeners[type]=fn}
  setAttribute(key,value){this.attributes[key]=value}
  append(child){this.children.push(child)}
  set innerHTML(_){throw Error('HTML interpretation is forbidden')}
  set outerHTML(_){throw Error('HTML interpretation is forbidden')}
  insertAdjacentHTML(){throw Error('HTML interpretation is forbidden')}
 }
 const nodes=new Map(['mode','reference','before','after','concept','before-link','after-link','reference-link','reference-caption','originals'].map(id=>[id,new Element()]))
 nodes.get('mode').value='solar';nodes.get('reference').value=references[0]
 const buttons=sizes.map(size=>{const b=new Element('button');b.dataset.size=size;return b})
 const document={getElementById:id=>nodes.get(id),querySelector:selector=>{
  if(selector.startsWith('#'))return nodes.get(selector.slice(1))
  const size=sizes.find(s=>selector===`button[data-size="${s}"]`);return buttons[sizes.indexOf(size)]
 },querySelectorAll:selector=>{assert.equal(selector,'[data-size]');return buttons},createElement:tag=>new Element(tag)}
 vm.runInNewContext(script,{document,location:{pathname}})
 return {nodes,buttons,select(id,value){const e=nodes.get(id);e.value=value;e.listeners.change()},size(key){buttons[sizes.indexOf(key)].listeners.click()},urls(){return ['before','before-link','after','after-link','concept','reference-link'].map(id=>nodes.get(id)[id.endsWith('link')?'href':'src'])}}
}
for(const pathname of ['/owner-review/visual-fidelity/','/docs/validation/repository-recovery-20261026/visual-fidelity/']){
 test(`all supported controls preserve exact URLs, captions and pressed state at ${pathname}`,()=>{
  const g=openGallery(pathname),privateRoot=pathname.startsWith('/owner-review/')
  for(const mode of modes)for(const size of sizes)for(const ref of references){
   g.select('mode',mode);g.size(size);g.select('reference',ref)
   const file=mode.startsWith('solar')?ref:mode==='moon'?(size==='desktop'?'moon-desktop.png':'moon-mobile.png'):`${mode}-cinematic.png`
   const root=privateRoot?'references/':mode==='moon'?'../../../design/adaptive-explorer-r1a/evidence/':'../../../design/cinematic-references-2026-10-21/'
   assert.deepEqual(g.urls(),[`before/${size}-${mode}.png`,`before/${size}-${mode}.png`,`after/${size}-${mode}.png`,`after/${size}-${mode}.png`,root+file,root+file])
   g.buttons.forEach((b,i)=>assert.equal(b.attributes['aria-pressed'],String(sizes[i]===size)))
   assert.match(g.nodes.get('reference-caption').textContent,mode==='moon'?/R1-A/:/APPROVED CONCEPT/)
  }
  const originals=g.nodes.get('originals').children;assert.equal(originals.length,4)
  for(const [i,name]of [...references,'earth-cinematic.png','sky-cinematic.png'].entries()){assert.equal(originals[i].href,(privateRoot?'references/':'../../../design/cinematic-references-2026-10-21/')+name);assert.equal(originals[i].children[0].src,originals[i].href)}
 })
}
const hostile=['','solar-unknown','constructor','toString','__proto__','../../outside','..\\..\\outside','%2e%2e%2foutside','javascript:alert(1)','//outside.invalid/x','data:image/svg+xml,<svg onload=alert(1)>','"><img src=x onerror=alert(1)>']
for(const id of ['mode','reference'])test(`unsupported ${id} values never change image/link targets and valid controls recover`,()=>{
 const g=openGallery();g.select('mode','solar-mars');g.size('portrait');g.select('reference',references[1]);const expected=g.urls()
 for(const payload of hostile){g.select(id,payload);assert.deepEqual(g.urls(),expected,`Rejected ${id}: ${payload}`)}
 g.select(id,id==='mode'?'earth':references[0]);assert.notDeepEqual(g.urls(),expected)
})
test('viewport choice is bound to the trusted button, not mutable data-size text',()=>{
 const g=openGallery();for(const payload of hostile){g.buttons[1].dataset.size=payload;g.buttons[1].listeners.click();assert.equal(g.nodes.get('before').src,'before/portrait-solar.png');assert.equal(g.buttons[1].attributes['aria-pressed'],'true')}
})

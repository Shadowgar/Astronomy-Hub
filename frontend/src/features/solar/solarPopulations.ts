/** The worker owns the full bounded catalog. UI receives source-indexed search rows
 * and geometric ICRF AU buffers, never invented dimensions or inferred TNO classes. */
export type PopulationKind='asteroid-belt'|'trans-neptunian'|'comets'
export type PopulationElements={epoch_jd_tdb:number;a_au:number|null;e:number;q_au:number|null;i_rad:number|null;om_rad:number|null;w_rad:number|null;ma_rad:number|null;n_rad_day:number|null}
export type PopulationBody={catalog:'JPL SBDB';source_id:string;designation:string;name:string;iau_name:string|null;population:PopulationKind;object_class:'asteroid'|'trans-neptunian-object'|'comet';orbit_class:string;dynamical_subclass:null;orbit_domain:'elliptical'|'near-parabolic'|'parabolic'|'hyperbolic';solution_id:string;diameter_km:number|null;absolute_magnitude:number|null;elements:PopulationElements;uncertainty:{condition_code:string|null;data_arc_days:number|null;observations_used:number|null;sigma_e:number|null;sigma_a_au:number|null};representation:'symbolic-approximate'|'catalog-only';unavailable_reason:string|null;coverage:{start_jd_tdb:number;end_jd_tdb:number}|null}
export type PopulationModel={kind:'two-body-osculating-symbols';max_days_from_epoch:180;max_eccentricity_exclusive:0.98;max_semimajor_axis_au:300;ecliptic_obliquity_arcsec:84381.448;population_wide_accuracy_qualified:false;disclosure:string}
export type PopulationSource={url:string;sha256:string;bytes:number;acquired_utc:string}
export type PopulationGroup={id:string;population:PopulationKind;available:number;included:number;limit:number;selection:Record<string,string|number>}
export type PopulationPack={schema:'oras.solar-populations.v1';release:string;pack_sha256:string;acquired_utc:string;catalog:'JPL SBDB';origin:'Sun center (10)';element_frame:'ECLIPJ2000';output_frame:'ICRF';time_scale:'TDB';position_units:'AU';velocity_units:'AU/s';body_count:number;groups:PopulationGroup[];model:PopulationModel;selection:string;sources:Record<string,PopulationSource>;qualification:{reference:string;max_comparison_error_km:number;max_velocity_error_km_s:number;comparisons:unknown[]};bodies:PopulationBody[]}
export type PopulationSearchRow={sourceIndex:number;body:PopulationBody}
export type PopulationSummary={release:string;packSha256:string;acquiredUtc:string;bodyCount:number;counts:Record<PopulationKind,{catalog:number;approximate:number}>;groups:PopulationGroup[];model:PopulationModel;selection:string;sources:Record<string,PopulationSource>;qualification:{maxComparisonErrorKm:number;maxVelocityErrorKmS:number;sampleCount:number;reference:string}}
export type PopulationEvaluation={jdTdb:number;population?:PopulationKind;availableCount:number;unavailableCount:number;coverageStartJdTdb:number|null;coverageEndJdTdb:number|null;indices:Uint32Array;positionsHigh:Float32Array;positionsLow:Float32Array;velocities:Float32Array}
export type PopulationRequest=({type:'load'}|{type:'search';query:string;population?:PopulationKind}|{type:'detail';sourceIndex:number}|{type:'evaluate';jdTdb:number;population?:PopulationKind})&{requestId:number}
export type PopulationReply=({type:'loaded';summary:PopulationSummary}|{type:'search';rows:PopulationSearchRow[]}|({type:'detail'}&PopulationSearchRow)|({type:'evaluated'}&PopulationEvaluation)|{type:'error';message:string})&{requestId:number}
export const SOLAR_POPULATION_PACK_SHA256='15ae0e1177aec67b4917f1e2f42cfe4d8660fbde801a9fd4558b61b654f4dbb0'
const MAX_BYTES=24*1024*1024,TAU=2*Math.PI,EPSILON=84381.448/3600*Math.PI/180
const kinds:PopulationKind[]=['asteroid-belt','trans-neptunian','comets']
const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)
const optionalNumber=(n:unknown)=>n===null||finite(n)
const text=(s:unknown,max=1000):s is string=>typeof s==='string'&&s.length>0&&s.length<=max
const fail=():never=>{throw Error('Invalid local Solar population source contract.')}
function checkPopulation(population:unknown){if(population!==undefined&&!kinds.includes(population as PopulationKind))fail()}
function checkBody(b:PopulationBody){
 const e=b?.elements,u=b?.uncertainty
 if(!b||b.catalog!=='JPL SBDB'||typeof b.source_id!=='string'||!/^\d{1,30}$/.test(b.source_id)||!text(b.designation,100)||!text(b.name,200)||(b.iau_name!==null&&!text(b.iau_name,200))||!kinds.includes(b.population)||b.object_class!==({'asteroid-belt':'asteroid','trans-neptunian':'trans-neptunian-object',comets:'comet'} as const)[b.population]||!text(b.orbit_class,3)||b.orbit_class.length!==3||b.dynamical_subclass!==null||!text(b.solution_id,100)||!optionalNumber(b.diameter_km)||(b.diameter_km!==null&&b.diameter_km<=0)||!optionalNumber(b.absolute_magnitude)||!e||!finite(e.epoch_jd_tdb)||!finite(e.e)||e.e<0||![e.a_au,e.q_au,e.i_rad,e.om_rad,e.w_rad,e.ma_rad,e.n_rad_day].every(optionalNumber)||!u||(u.condition_code!==null&&!text(u.condition_code,10))||![u.data_arc_days,u.observations_used,u.sigma_e,u.sigma_a_au].every(v=>v===null||(finite(v)&&v>=0)))fail()
 const domain=e.e>1?'hyperbolic':e.e===1?'parabolic':e.e>=.98?'near-parabolic':'elliptical'
 if(b.orbit_domain!==domain)fail()
 if(b.representation==='symbolic-approximate'){
  if(b.population==='comets'||Object.values(e).some(v=>!finite(v))||!(e.e<.98&&e.a_au!>0&&e.a_au!<=300&&e.q_au!>0&&e.i_rad!>=0&&e.i_rad!<=Math.PI&&e.n_rad_day!>0&&e.n_rad_day!<TAU)||b.unavailable_reason!==null||!b.coverage||b.coverage.start_jd_tdb!==e.epoch_jd_tdb-180||b.coverage.end_jd_tdb!==e.epoch_jd_tdb+180)fail()
 }else if(b.representation!=='catalog-only'||b.coverage!==null||!text(b.unavailable_reason))fail()
}
/** Backend verifies the immutable manifest+bytes. The client also pins release identity
 * and validates source frame/domain before admitting any values to a GPU buffer. */
export function validateSolarPopulations(raw:unknown):PopulationPack{
 const p=raw as PopulationPack,m=p?.model,q=p?.qualification
 if(!p||p.schema!=='oras.solar-populations.v1'||p.pack_sha256!==SOLAR_POPULATION_PACK_SHA256||p.release!=='sbdb-populations-20261103-v1'||!finite(Date.parse(p.acquired_utc))||p.catalog!=='JPL SBDB'||p.origin!=='Sun center (10)'||p.element_frame!=='ECLIPJ2000'||p.output_frame!=='ICRF'||p.time_scale!=='TDB'||p.position_units!=='AU'||p.velocity_units!=='AU/s'||!text(p.selection,2000)||!m||m.kind!=='two-body-osculating-symbols'||m.max_days_from_epoch!==180||m.max_eccentricity_exclusive!==.98||m.max_semimajor_axis_au!==300||m.ecliptic_obliquity_arcsec!==84381.448||m.population_wide_accuracy_qualified!==false||!text(m.disclosure,2000)||!Array.isArray(p.bodies)||!p.bodies.length||p.bodies.length>25856||p.body_count!==p.bodies.length||!Array.isArray(p.groups)||p.groups.length!==4||!q||!text(q.reference,2000)||!finite(q.max_comparison_error_km)||q.max_comparison_error_km<0||q.max_comparison_error_km>5e6||!finite(q.max_velocity_error_km_s)||q.max_velocity_error_km_s<0||!Array.isArray(q.comparisons)||q.comparisons.length<5||q.comparisons.length>160||!p.sources||typeof p.sources!=='object'||Array.isArray(p.sources))fail()
 for(const g of p.groups)if(!g||!text(g.id,100)||!kinds.includes(g.population)||![g.available,g.included,g.limit].every(n=>Number.isSafeInteger(n)&&n>0)||g.included>g.available||g.included>g.limit||g.limit>16384)fail()
 const sources=Object.values(p.sources)
 if(!sources.length||sources.length>164)fail()
 for(const s of sources)if(!s||!/^https:\/\/ssd(?:-api)?\.jpl\.nasa\.gov\//.test(s.url)||!/^[a-f0-9]{64}$/.test(s.sha256)||!Number.isSafeInteger(s.bytes)||s.bytes<=0||s.bytes>16*1024*1024||!finite(Date.parse(s.acquired_utc)))fail()
 const ids=new Set<string>()
 for(const body of p.bodies){checkBody(body);if(ids.has(body.source_id))fail();ids.add(body.source_id)}
 return p
}
export function populationEpochAvailable(body:PopulationBody,jdTdb:number){return finite(jdTdb)&&body.representation==='symbolic-approximate'&&body.coverage!==null&&jdTdb>=body.coverage.start_jd_tdb&&jdTdb<=body.coverage.end_jd_tdb}
/** Source osculating ellipse only; velocities are analytic AU/s, with no light time,
 * perturbations, hyperbolic extension, hidden epoch clamping or display dimensions. */
export function propagatePopulationBody(body:PopulationBody,jdTdb:number):{positionAu:[number,number,number];velocityAuS:[number,number,number]}{
 if(!populationEpochAvailable(body,jdTdb))throw Error('Population position unavailable at this source epoch.')
 const e=body.elements
 if(!(e.e>=0&&e.e<.98&&e.a_au!>0&&e.a_au!<=300)||Object.values(e).some(v=>!finite(v)))fail()
 const unwrapped=e.ma_rad!+e.n_rad_day!*(jdTdb-e.epoch_jd_tdb),mean=((unwrapped+Math.PI)%TAU+TAU)%TAU-Math.PI
 let lo=-Math.PI,hi=Math.PI,eccentric=mean
 for(let iteration=0;iteration<48;iteration++){
  const residual=eccentric-e.e*Math.sin(eccentric)-mean
  if(Math.abs(residual)<1e-14)break
  if(residual>0)hi=eccentric;else lo=eccentric
  const proposal=eccentric-residual/(1-e.e*Math.cos(eccentric))
  eccentric=lo<proposal&&proposal<hi?proposal:(lo+hi)/2
 }
 if(Math.abs(eccentric-e.e*Math.sin(eccentric)-mean)>1e-12)throw Error('Population orbital solve unavailable.')
 const a=e.a_au!,root=Math.sqrt(1-e.e*e.e),rate=e.n_rad_day!/(1-e.e*Math.cos(eccentric))/86400
 const cw=Math.cos(e.w_rad!),sw=Math.sin(e.w_rad!),ci=Math.cos(e.i_rad!),si=Math.sin(e.i_rad!),cn=Math.cos(e.om_rad!),sn=Math.sin(e.om_rad!)
 const rotate=(x:number,y:number):[number,number,number]=>{const px=x*cw-y*sw,py=x*sw+y*cw,ex=px*cn-py*ci*sn,ey=px*sn+py*ci*cn,ez=py*si;return [ex,ey*Math.cos(EPSILON)-ez*Math.sin(EPSILON),ey*Math.sin(EPSILON)+ez*Math.cos(EPSILON)]}
 return {positionAu:rotate(a*(Math.cos(eccentric)-e.e),a*root*Math.sin(eccentric)),velocityAuS:rotate(-a*Math.sin(eccentric)*rate,a*root*Math.cos(eccentric)*rate)}
}
export function evaluatePopulation(pack:PopulationPack,jdTdb:number,population?:PopulationKind):PopulationEvaluation{
 if(!finite(jdTdb))fail();checkPopulation(population)
 let count=0,requested=0,start=-Infinity,end=Infinity
 for(const b of pack.bodies){if(population&&b.population!==population)continue;requested++;if(populationEpochAvailable(b,jdTdb))count++}
 const indices=new Uint32Array(count),positionsHigh=new Float32Array(count*3),positionsLow=new Float32Array(count*3),velocities=new Float32Array(count*3)
 let vertex=0
 for(let sourceIndex=0;sourceIndex<pack.bodies.length;sourceIndex++){
  const b=pack.bodies[sourceIndex];if((population&&b.population!==population)||!populationEpochAvailable(b,jdTdb))continue
  const state=propagatePopulationBody(b,jdTdb);indices[vertex]=sourceIndex
  for(let axis=0;axis<3;axis++){const i=vertex*3+axis,position=state.positionAu[axis],high=Math.fround(position);positionsHigh[i]=high;positionsLow[i]=Math.fround(position-high);velocities[i]=state.velocityAuS[axis]}
  start=Math.max(start,b.coverage!.start_jd_tdb);end=Math.min(end,b.coverage!.end_jd_tdb);vertex++
 }
 return {jdTdb,population,availableCount:count,unavailableCount:requested-count,coverageStartJdTdb:count?start:null,coverageEndJdTdb:count?end:null,indices,positionsHigh,positionsLow,velocities}
}
export function searchPopulation(pack:PopulationPack,query:string,population?:PopulationKind):PopulationSearchRow[]{
 checkPopulation(population);if(typeof query!=='string'||query.length>120)fail()
 const q=query.trim().toLocaleLowerCase('en-US'),rows:PopulationSearchRow[]=[]
 for(let sourceIndex=0;sourceIndex<pack.bodies.length&&rows.length<40;sourceIndex++){
  const body=pack.bodies[sourceIndex]
  if((!population||body.population===population)&&(!q||[body.source_id,body.designation,body.name,body.iau_name??''].some(s=>s.toLocaleLowerCase('en-US').includes(q))))rows.push({sourceIndex,body})
 }
 return rows
}
export function summarizePopulation(p:PopulationPack):PopulationSummary{
 const counts:PopulationSummary['counts']={'asteroid-belt':{catalog:0,approximate:0},'trans-neptunian':{catalog:0,approximate:0},comets:{catalog:0,approximate:0}}
 for(const body of p.bodies){counts[body.population].catalog++;if(body.representation==='symbolic-approximate')counts[body.population].approximate++}
 return {release:p.release,packSha256:p.pack_sha256,acquiredUtc:p.acquired_utc,bodyCount:p.body_count,counts,groups:p.groups,model:p.model,selection:p.selection,sources:p.sources,qualification:{reference:p.qualification.reference,maxComparisonErrorKm:p.qualification.max_comparison_error_km,maxVelocityErrorKmS:p.qualification.max_velocity_error_km_s,sampleCount:p.qualification.comparisons.length}}
}
export async function loadSolarPopulations(signal:AbortSignal,fetcher:typeof fetch=fetch):Promise<PopulationPack>{
 signal.throwIfAborted();const response=await fetcher('/api/v1/solar-populations',{signal,credentials:'same-origin'})
 if(!response.ok||Number(response.headers.get('Content-Length'))>MAX_BYTES)throw Error('Local Solar population source unavailable.')
 const chunks:Uint8Array[]=[],reader=response.body?.getReader();let bytes=0
 if(!reader)throw Error('Population response stream unavailable.')
 try{for(;;){signal.throwIfAborted();const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>MAX_BYTES)throw Error('Population response exceeded its bounded source size.');chunks.push(chunk.value)}}
 catch(error){await reader.cancel().catch(()=>{});throw error}
 finally{reader.releaseLock()}
 const joined=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length}
 signal.throwIfAborted();return validateSolarPopulations(JSON.parse(new TextDecoder().decode(joined)))
}
/** One worker event loop serializes evaluation. Owner keeps one outstanding evaluate,
 * checks requestId, displays the returned epoch and terminates worker on disposal. */
export function createPopulationWorkerHandler(post:(message:PopulationReply,transfer?:Transferable[])=>void,fetcher:typeof fetch=fetch){
 let pack:PopulationPack|null=null,generation=0,controller:AbortController|null=null
 return async(request:PopulationRequest)=>{
  if(!request||!Number.isSafeInteger(request.requestId)||request.requestId<0)return
  let ownGeneration=generation
  try{
   if(request.type==='load'){
    ownGeneration=++generation;controller?.abort();controller=new AbortController();pack=null
    const loaded=await loadSolarPopulations(controller.signal,fetcher)
    if(ownGeneration!==generation)return
    pack=loaded;post({type:'loaded',requestId:request.requestId,summary:summarizePopulation(pack)});return
   }
   if(!pack)throw Error('Population source not loaded.')
   if(request.type==='search')post({type:'search',requestId:request.requestId,rows:searchPopulation(pack,request.query,request.population)})
   else if(request.type==='detail'){
    if(!Number.isSafeInteger(request.sourceIndex)||request.sourceIndex<0||request.sourceIndex>=pack.bodies.length)fail()
    post({type:'detail',requestId:request.requestId,sourceIndex:request.sourceIndex,body:pack.bodies[request.sourceIndex]})
   }else if(request.type==='evaluate'){
    const result=evaluatePopulation(pack,request.jdTdb,request.population)
    post({type:'evaluated',requestId:request.requestId,...result},[result.indices.buffer,result.positionsHigh.buffer,result.positionsLow.buffer,result.velocities.buffer])
   }else fail()
  }catch{if(ownGeneration===generation)post({type:'error',requestId:request.requestId,message:'Qualified Solar population data is unavailable for this request.'})}
 }
}

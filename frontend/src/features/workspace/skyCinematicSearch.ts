export type SkySearchRow={name:string;description:string;url:string}
export function parseSkySearch(payload:unknown):SkySearchRow[]{
 const rows=(payload as {data?:{results?:unknown}})?.data?.results
 if(!Array.isArray(rows))throw new Error('Object search returned an invalid response.')
 return rows.slice(0,30).flatMap(row=>{
  if(!row||typeof row!=='object')return[]
  const r=row as Record<string,unknown>
  if(!['catalog','source_id','model'].every(key=>typeof r[key]==='string'&&r[key]&&String(r[key]).length<=200)||typeof r.sky_engine_url!=='string'||!r.sky_engine_url.startsWith('/oras-sky-engine/'))return[]
  const url=new URL(r.sky_engine_url,'https://astronomy.invalid')
  if(!['catalog','source_id','model'].every(key=>url.searchParams.get(key)===r[key]))return[]
  return[{name:typeof r.display_name==='string'?r.display_name.slice(0,200):String(r.source_id),description:`${r.catalog} · ${r.model}`,url:url.pathname+url.search}]
 })
}

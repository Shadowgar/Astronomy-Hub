import React, {memo, useCallback, useId, useMemo, useState} from 'react'
import type {AngularMap, ObservationProduct, TimeSeries} from './beyondContracts'
import {mollweide} from './beyondMath'

type Selection={row:number;column:number}
const MAP={x:380,y:220,rx:330,ry:165}
const PLOT={left:55,right:715,top:45,bottom:320}
const palette=[[40,35,100],[35,130,140],[126,201,98],[253,231,37]]
const fmt=(value:number|null)=>value===null?'Unmeasured':Number(value.toPrecision(4)).toString()
const date=(value:string)=>value.slice(0,10)
const time=(value:string)=>value.slice(11,16)+' UTC'

function colour(value:number,low:number,high:number){
 const t=Math.min(1,Math.max(0,(value-low)/(high-low||1)))*(palette.length-1),a=Math.min(palette.length-2,Math.floor(t)),f=t-a
 return `rgb(${palette[a].map((v,i)=>Math.round(v+(palette[a+1][i]-v)*f)).join(',')})`
}
function mapPoint(longitude:number,latitude:number,cellLongitude=longitude):[number,number]{
 let [x,y]=mollweide(longitude,latitude)
 // 180° is the cut, shared by the last west-edge and first east-edge cell.
 // Preserve its appropriate side instead of joining a polygon across the sky.
 if(Math.abs(longitude-180)<1e-10)x=(cellLongitude<180?-1:1)*Math.abs(x)
 return[MAP.x+x*MAP.rx,MAP.y-y*MAP.ry]
}
function path(points:number[][],close=false){return points.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(3)).join(',')).join('')+(close?'Z':'')}

/** Each original bin is a constant-colour spherical cell, not an interpolated image.
 * Sample curved meridian edges at 1°; polar edges collapse to a point. */
export function angularCellPath(longitude:number,latitude:number){
 const west=longitude-3,east=longitude+3,south=latitude-3,north=latitude+3
 const points:number[][]=[mapPoint(west,south,longitude),mapPoint(east,south,longitude)]
 for(let i=1;i<=6;i++)points.push(mapPoint(east,south+i,longitude))
 points.push(mapPoint(west,north,longitude))
 for(let i=1;i<=6;i++)points.push(mapPoint(west,north-i,longitude))
 return path(points,true)
}

export function moveMapSelection(current:Selection,key:string):Selection{
 switch(key){
  case'ArrowLeft':return{...current,column:(current.column+1)%60}
  case'ArrowRight':return{...current,column:(current.column+59)%60}
  case'ArrowUp':return{...current,row:Math.min(29,current.row+1)}
  case'ArrowDown':return{...current,row:Math.max(0,current.row-1)}
  default:return current
 }
}

const MapCells=memo(function MapCells({data,low,high,maskId,onPick}:{data:AngularMap;low:number;high:number;maskId:string;onPick:(row:number,column:number)=>void}){
 return <g>{data.latitude_deg.flatMap((lat,row)=>data.longitude_deg.map((lon,column)=>{
  const value=data.flux[row][column],masked=data.mask[row][column]
  return <path key={`${row}-${column}`} data-observation-cell={`${row}-${column}`} data-masked={masked}
   d={angularCellPath(lon,lat)} fill={masked||value===null?`url(#${maskId})`:colour(value,low,high)}
   onPointerEnter={()=>onPick(row,column)} onClick={()=>onPick(row,column)}>
   <title>{`${lon}° E, ${lat}°: ${masked?'unmeasured':fmt(value)}`}</title>
  </path>
 }))}</g>
})

function AngularObservation({product}:{product:Extract<ObservationProduct,{kind:'angular-map'}>}){
 const {data,metadata}=product,[selected,setSelected]=useState<Selection>({row:15,column:44})
 const id=useId().replace(/:/g,''),maskId=id+'-missing',gradientId=id+'-flux'
 const range=useMemo(()=>{const values=data.flux.flat().filter((v):v is number=>v!==null);return values.length?[Math.min(...values),Math.max(...values)]:[0,1]},[data])
 const onPick=useCallback((row:number,column:number)=>setSelected(old=>old.row===row&&old.column===column?old:{row,column}),[])
 const lon=data.longitude_deg[selected.column],lat=data.latitude_deg[selected.row],value=data.flux[selected.row][selected.column],error=data.uncertainty[selected.row][selected.column]
 return <figure className="beyond-observation" data-testid="ibex-observation">
  <figcaption className="beyond-observation-caption"><strong>Energetic neutral atom sky</strong><span>IBEX-Hi · 2.73 keV · 2009–2022</span></figcaption>
  <svg className="beyond-observation-chart" viewBox="0 0 760 445" style={{width:'100%',height:'auto',display:'block'}} role="group" tabIndex={0}
   aria-label="IBEX directional flux map. Arrow keys select a six degree angular bin; longitude increases to the left."
   onKeyDown={event=>{if(event.key.startsWith('Arrow')){event.preventDefault();setSelected(old=>moveMapSelection(old,event.key))}}}>
   <title>IBEX-Hi, 2.73 keV ENA differential intensity in ECLIPJ2000</title>
   <desc>Mollweide equal-area projection, native six degree cells. North is up, ecliptic east is left. Colours encode particle flux, not visible light or distance. Hatched cells are unmeasured.</desc>
   <defs>
    <pattern id={maskId} patternUnits="userSpaceOnUse" width="6" height="6"><rect width="6" height="6" fill="var(--solar-bg, #070d18)"/><path d="M0,6L6,0" stroke="var(--solar-muted, #8292a8)" strokeWidth=".7"/></pattern>
    <linearGradient id={gradientId}>{palette.map((_,i)=><stop key={i} offset={`${i/(palette.length-1)*100}%`} stopColor={colour(i,0,palette.length-1)}/>)}</linearGradient>
   </defs>
   <ellipse cx={MAP.x} cy={MAP.y} rx={MAP.rx} ry={MAP.ry} fill={`url(#${maskId})`}/>
   <MapCells data={data} low={range[0]} high={range[1]} maskId={maskId} onPick={onPick}/>
   <g fill="none" stroke="white" strokeOpacity=".18" strokeWidth=".7" pointerEvents="none">
    {[-60,-30,0,30,60].map(b=><ellipse key={b} cx={MAP.x} cy={mapPoint(0,b)[1]} rx={Math.abs(mapPoint(180,b)[0]-MAP.x)} ry=".15"/>)}
    {[0,60,120,180,240,300].map(l=><path key={l} d={path(Array.from({length:61},(_,i)=>mapPoint(l,-90+i*3)))}/>)}
   </g>
   <path d={angularCellPath(lon,lat)} fill="none" stroke="white" strokeWidth="2" pointerEvents="none" vectorEffect="non-scaling-stroke"/>
   <g fill="var(--solar-text, #e5edf7)" fontSize="14" textAnchor="middle" pointerEvents="none">
    <text x="380" y="30">North ecliptic pole +90°</text><text x="380" y="406">South ecliptic pole −90°</text>
    {[120,60,0,300,240].map(l=><text key={l} x={mapPoint(l,0)[0]} y="240" paintOrder="stroke" stroke="#09101c" strokeWidth="2">{l}°</text>)}
   </g>
   <rect x="205" y="423" width="350" height="10" fill={`url(#${gradientId})`}/>
   <g fill="var(--solar-text, #e5edf7)" fontSize="14"><text x="195" y="434" textAnchor="end">{fmt(range[0])}</text><text x="565" y="434">{fmt(range[1])}</text></g>
  </svg>
  <p className="beyond-observation-caption">Mollweide · ECLIPJ2000 · east ← · linear flux in {metadata.units}. Hatched = unmeasured.</p>
  <div className="beyond-observation-controls">
   <label>Longitude {lon}° E<input aria-label="Ecliptic longitude bin" type="range" min="0" max="59" step="1" value={selected.column} onChange={event=>onPick(selected.row,Number(event.target.value))}/></label>
   <label>Latitude {lat}°<input aria-label="Ecliptic latitude bin" type="range" min="0" max="29" step="1" value={selected.row} onChange={event=>onPick(Number(event.target.value),selected.column)}/></label>
  </div>
  <div className="beyond-observation-readout" aria-live="polite" aria-atomic="true">
   <strong>{value===null?'Unmeasured bin':`${fmt(value)} ± ${fmt(error)}`}</strong><span>{value===null?'No substituted value.':`Statistical 1σ · ${metadata.units}`}</span>
   <span>6° × 6° bin centered at {lon}° E, {lat}°. Nominal source interval {date(metadata.observation_start)}–{date(metadata.observation_end)}; exposures differ by direction.</span>
  </div>
 </figure>
}

type SeriesSegment={indices:number[];line:string;band:string}
export function seriesGeometry(data:TimeSeries){
 const stamps=data.time_utc.map(Date.parse),start=stamps[0],end=stamps[stamps.length-1]+60000
 const valid=data.minimum.filter((v):v is number=>v!==null),highs=data.maximum.filter((v):v is number=>v!==null)
 const rawLow=valid.length?Math.min(...valid):0,rawHigh=highs.length?Math.max(...highs):1,pad=Math.max((rawHigh-rawLow)*.08,.1)
 const low=Math.max(0,rawLow-pad),high=rawHigh+pad
 const x=(i:number)=>PLOT.left+(stamps[i]-start)/(end-start)*(PLOT.right-PLOT.left)
 const y=(v:number)=>PLOT.bottom-(v-low)/(high-low)*(PLOT.bottom-PLOT.top)
 const points=data.value.map((v,i)=>v===null?null:[x(i),y(v)] as [number,number])
 const runs:number[][]=[];let current:number[]=[]
 for(let i=0;i<data.value.length;i++){
  if(points[i]===null||i>0&&stamps[i]-stamps[i-1]>60000){if(current.length)runs.push(current);current=[]}
  if(points[i]!==null)current.push(i)
 }
 if(current.length)runs.push(current)
 const segments:SeriesSegment[]=runs.map(indices=>({indices,line:path(indices.map(i=>points[i]!)),
  band:path([...indices.map(i=>[x(i),y(data.maximum[i]!)]),...indices.slice().reverse().map(i=>[x(i),y(data.minimum[i]!)])],true)}))
 return{points,segments,low,high,start,end,x,y}
}

function MagneticObservation({product}:{product:Extract<ObservationProduct,{kind:'time-series'}>}){
 const {data,metadata}=product,[selected,setSelected]=useState(0),geometry=useMemo(()=>seriesGeometry(data),[data])
 const {segments,points,low,high,start,end,x,y}=geometry
 const index=Math.min(selected,data.time_utc.length-1),value=data.value[index]
 const selectPointer=(event:React.PointerEvent<SVGSVGElement>)=>{
  const svg=event.currentTarget,matrix=svg.getScreenCTM()
  if(!matrix)return
  const pointer=svg.createSVGPoint();pointer.x=event.clientX;pointer.y=event.clientY
  const px=pointer.matrixTransform(matrix.inverse()).x
  const stamp=start+Math.min(1,Math.max(0,(px-PLOT.left)/(PLOT.right-PLOT.left)))*(end-start)
  let lo=0,hi=data.time_utc.length-1
  while(lo<hi){const mid=Math.floor((lo+hi)/2);if(Date.parse(data.time_utc[mid])<stamp)lo=mid+1;else hi=mid}
  if(lo>0&&stamp-Date.parse(data.time_utc[lo-1])<Date.parse(data.time_utc[lo])-stamp)lo--
  setSelected(lo)
 }
 return <figure className="beyond-observation" data-testid="imap-observation">
  <figcaption className="beyond-observation-caption"><strong>Magnetic field magnitude</strong><span>IMAP MAG · {date(metadata.observation_start)} · {metadata.units}</span></figcaption>
  <svg className="beyond-observation-chart" viewBox="0 0 760 375" style={{width:'100%',height:'auto',display:'block'}} role="group" tabIndex={0}
   aria-label="IMAP magnetic field magnitude. Left and right arrow keys select an observation minute."
   onPointerMove={selectPointer} onPointerDown={selectPointer}
   onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();setSelected(old=>Math.min(data.time_utc.length-1,Math.max(0,old+(event.key==='ArrowRight'?1:-1))))}}}>
   <title>IMAP MAG historical scalar magnitude, one-minute means in nanotesla</title>
   <desc>Shaded band is within-minute minimum to maximum, not measurement uncertainty. Missing or bad-quality intervals remain gaps.</desc>
   <g stroke="var(--solar-muted, #8292a8)" strokeOpacity=".2" fill="none">
    {Array.from({length:5},(_,i)=><path key={i} d={`M${PLOT.left},${y(low+(high-low)*i/4)}H${PLOT.right}`}/>)}
   </g>
   {segments.map((s,i)=><g key={i} data-series-segment={i}><path d={s.band} fill="#52c8bd" fillOpacity=".18"/>
    <path d={s.line} fill="none" stroke="#7bdfd0" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
    {s.indices.length===1&&<circle cx={points[s.indices[0]]![0]} cy={points[s.indices[0]]![1]} r="2" fill="#7bdfd0"/>}
   </g>)}
   <g fill="var(--solar-text, #e5edf7)" fontSize="14">
    {Array.from({length:5},(_,i)=><text key={i} x="45" y={y(low+(high-low)*i/4)+5} textAnchor="end">{fmt(low+(high-low)*i/4)}</text>)}
    {Array.from({length:5},(_,i)=>{const stamp=new Date(start+(end-start)*i/4).toISOString(),clock=stamp.slice(11,16);return <text key={i} x={PLOT.left+(PLOT.right-PLOT.left)*i/4} y="345" textAnchor="middle">{i===4&&clock==='00:00'&&date(stamp)!==date(data.time_utc[0])?'24:00':clock}</text>})}
    <text x="55" y="24">nT</text><text x="385" y="370" textAnchor="middle">UTC · {date(metadata.observation_start)}</text>
   </g>
   <path d={`M${x(index)},${PLOT.top}V${PLOT.bottom}`} stroke="white" strokeOpacity=".45" strokeDasharray="3 4" pointerEvents="none"/>
   {value!==null&&<circle cx={x(index)} cy={y(value)} r="4" fill="white" stroke="#163b46" pointerEvents="none"/>}
  </svg>
  <p className="beyond-observation-caption">One-minute means · band = within-minute min–max, not measurement uncertainty. Gaps remain unmeasured. Source vector GSE; magnitude is a scalar.</p>
  <div className="beyond-observation-controls"><label>{time(data.time_utc[index])}<input aria-label="Observation minute" type="range" min="0" max={data.time_utc.length-1} step="1" value={index} onChange={event=>setSelected(Number(event.target.value))}/></label></div>
  <div className="beyond-observation-readout" aria-live="polite" aria-atomic="true">
   <strong>{value===null?'Unmeasured minute':`${fmt(value)} nT`}</strong>
   <span>{value===null?'No substituted value.':`Range ${fmt(data.minimum[index])}–${fmt(data.maximum[index])} nT`}</span>
   <span>{data.count[index]} accepted · {data.rejected_count[index]} excluded · source quality bitmask 0x{data.quality_bitmask[index].toString(16).padStart(2,'0')}</span>
   <span>{data.time_utc[index]} · historical local measurement, no live telemetry.</span>
  </div>
 </figure>
}

export function ObservationView({product}:{product:ObservationProduct}){
 return product.kind==='angular-map'?<AngularObservation key={product.id} product={product}/>:<MagneticObservation key={product.id} product={product}/>
}

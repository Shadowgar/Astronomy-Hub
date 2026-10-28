import React,{useEffect,useRef,useState} from 'react'
import './cinematic.css'
import './glass.css'
export type CinematicMode='sky'|'earth'|'solar'
const labels:Record<CinematicMode,string>={sky:'Sky',earth:'Earth',solar:'Solar System'}
/** Presentation only: the caller owns acknowledged renderer/time/navigation intents. */
export function CinematicBrand({mode,onMode,disabled=false,headingRef,allowCurrentMode=false}:{mode:CinematicMode;onMode:(mode:CinematicMode)=>void;disabled?:boolean;headingRef?:React.RefObject<HTMLHeadingElement>;allowCurrentMode?:boolean}){
 const [opaque,setOpaque]=useState(()=>{try{return localStorage.getItem('oras.glass.opaque.v1')==='true'}catch{return false}})
 useEffect(()=>{const apply=()=>{let value=false;try{value=localStorage.getItem('oras.glass.opaque.v1')==='true'}catch{};setOpaque(value);document.documentElement.dataset.glass=value?'opaque':'standard'};apply();window.addEventListener('storage',apply);return()=>window.removeEventListener('storage',apply)},[])
 const toggleOpaque=()=>{const value=!opaque;setOpaque(value);document.documentElement.dataset.glass=value?'opaque':'standard';try{localStorage.setItem('oras.glass.opaque.v1',String(value))}catch{}}
 const [open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null)
 useEffect(()=>{if(!open)return;const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside)},[open])
 useEffect(()=>{setOpen(false)},[mode])
 return <div className="cin-brand" data-cinematic-open={open} ref={root} onKeyDown={e=>{if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();setOpen(false);trigger.current?.focus()}}}>
  {headingRef?<h1 className="ws-sr-only" ref={headingRef} tabIndex={-1}>{labels[mode]}</h1>:null}<span className="cin-mark" aria-hidden="true"/><div className="cin-identity"><span className="cin-wordmark">Astronomy Hub</span><button ref={trigger} className="cin-mode-trigger" aria-label="Choose exploration mode" aria-expanded={open} aria-controls="cin-mode-options" disabled={disabled} onClick={()=>setOpen(x=>!x)}><span>{labels[mode]}</span><span aria-hidden="true">⌄</span></button></div>
  {open?<nav id="cin-mode-options" className="cin-mode-options" aria-label="Exploration modes">{(['sky','earth','solar']as const).map(id=><button key={id} aria-current={id===mode&&!allowCurrentMode?'page':undefined} onClick={()=>{setOpen(false);trigger.current?.focus();if(id!==mode||allowCurrentMode)onMode(id)}}>{labels[id]}</button>)}<button className="glass-preference" aria-pressed={opaque} onClick={toggleOpaque}>Reduce transparency<span aria-hidden="true">{opaque?'On':'Off'}</span></button></nav>:null}
 </div>
}

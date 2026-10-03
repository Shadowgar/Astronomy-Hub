import React from 'react'
import {IconButton} from './primitives'
export type TargetAction={name:string;url:string;subtitle:string}
export default function TargetRow({target,onSelect,onFocus}:{target:TargetAction;onSelect:(url:string)=>void;onFocus:(url:string)=>void}){return <div className="ws-target"><button className="ws-target-name" onClick={()=>onSelect(target.url)}><strong>{target.name}</strong><span>{target.subtitle}</span></button><IconButton icon="arrow-up-right" label={`Focus ${target.name}`} onClick={()=>onFocus(target.url)}/></div>}

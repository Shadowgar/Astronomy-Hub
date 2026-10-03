import React from 'react'
import type {RuntimeMode} from '../../../../packages/runtime-protocol/index.mjs'
import {Icon,tabKeys} from './primitives'
export default function ModeSwitcher({mode,busy,onChange}:{mode:RuntimeMode;busy:boolean;onChange:(mode:RuntimeMode)=>void}){return <div className="ws-modes" role="tablist" aria-label="Renderer mode" aria-busy={busy} onKeyDown={tabKeys}>{(['sky','earth'] as const).map(value=><button key={value} type="button" role="tab" aria-selected={value===mode} tabIndex={value===mode?0:-1} onClick={()=>{if(value!==mode)onChange(value)}}><Icon name={value==='sky'?'moon':'globe'}/>{value==='sky'?'Sky':'Earth'}{busy&&value===mode?<span className="ws-progress-dot" aria-label="Opening view"/>:null}</button>)}</div>}

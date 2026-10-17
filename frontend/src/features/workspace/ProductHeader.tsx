import React from 'react'
import {Link} from 'react-router-dom'
import type {RuntimeMode} from '../../../../packages/runtime-protocol/index.mjs'
import ModeSwitcher from './ModeSwitcher'
import EarthExplore from './EarthExplore'
import type{EarthDestination}from'./earthSearch'
import type {ObserverIntent} from '../../../../packages/runtime-protocol/index.mjs'
import {IconButton} from './primitives'
export default function ProductHeader({mode,busy,pin,onMode,onContext,onPin,onImmersive,onMenu,onLocation,center}:{mode:RuntimeMode;busy:boolean;pin:boolean;onMode:(mode:RuntimeMode)=>void;onContext:(tab:'tonight'|'observe')=>void;onPin:()=>void;onImmersive:()=>void;onMenu:()=>void;onLocation:(value:EarthDestination)=>Promise<boolean>;center:()=>Promise<ObserverIntent|null>}){return <header className="ws-header ws-chrome"><Link className="ws-brand" to="/" aria-label="ORAS Astronomy Hub workspace"><strong>ORAS</strong><span>/</span><span>Astronomy Hub</span></Link>{mode==='earth'?<EarthExplore busy={busy} onSky={()=>onMode('sky')} onLocation={onLocation} center={center}/>:<ModeSwitcher mode={mode} busy={busy} onChange={onMode}/>}<div className="ws-header-tools"><button className="ws-context-access" onClick={()=>onContext('tonight')}>Tonight</button><button className="ws-context-access" onClick={()=>onContext('observe')}>Observe</button><span className="ws-desktop-utility"><IconButton icon="pin" label={pin?'Controls pinned':'Pin controls'} aria-pressed={pin} onClick={onPin}/><IconButton icon="maximize" label="Immersive" onClick={onImmersive}/></span><IconButton icon="ellipsis" label="Workspace menu" data-ws-trigger="menu" onClick={onMenu}/></div></header>}

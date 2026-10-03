import {useEffect,useState,useCallback,useRef} from 'react'
export type ChromeState='NORMAL'|'ACTIVE_EXPLORATION'|'AUTO_HIDDEN'|'PINNED'|'PANEL_OPEN'|'KEYBOARD_FOCUS'|'MOBILE_SHEET_OPEN'
export function chromeState({focused,sheet,panel,pin,immersive,exploring,hidden}:{focused:boolean;sheet:boolean;panel:boolean;pin:boolean;immersive:boolean;exploring:boolean;hidden:boolean}):ChromeState{if(focused)return 'KEYBOARD_FOCUS';if(sheet)return 'MOBILE_SHEET_OPEN';if(panel)return 'PANEL_OPEN';if(!immersive&&pin)return 'PINNED';if(exploring)return 'ACTIVE_EXPLORATION';return hidden||immersive?'AUTO_HIDDEN':'NORMAL'}
export function useImmersive({pin,panel,mobile,blocked=false}:{pin:boolean;panel:boolean;mobile:boolean;blocked?:boolean}){
 const [immersive,setImmersive]=useState(false),[hidden,setHidden]=useState(false),[focused,setFocused]=useState(false),[exploring,setExploring]=useState(false),[activity,setActivity]=useState(0);const edge=useRef<ReturnType<typeof setTimeout>>(),exploration=useRef<ReturnType<typeof setTimeout>>()
 const reveal=useCallback(()=>{setImmersive(false);setHidden(false);setExploring(false);setActivity(x=>x+1)},[])
 const state=chromeState({pin,panel,sheet:mobile&&panel,focused,immersive,hidden,exploring})
 useEffect(()=>{if(blocked||pin||panel||focused||immersive)return;const timer=setTimeout(()=>setHidden(true),4000);return ()=>clearTimeout(timer)},[blocked,pin,panel,focused,immersive,activity])
 useEffect(()=>()=>{clearTimeout(edge.current);clearTimeout(exploration.current)},[])
 const interact=useCallback((active:boolean,runtimeFocused:boolean)=>{setFocused(runtimeFocused);clearTimeout(exploration.current);if(active){setExploring(true);if(!pin&&!panel&&!runtimeFocused)exploration.current=setTimeout(()=>setHidden(true),300)}else{setExploring(false);setActivity(x=>x+1)}},[pin,panel])
 return {state,hidden:(hidden||immersive)&&!focused&&!panel&&!blocked,immersive,reveal,enter:()=>{setFocused(false);setImmersive(true);setHidden(true)},setFocused,interact,activity:()=>setActivity(x=>x+1),edgeReveal:()=>{if(!exploring){clearTimeout(edge.current);edge.current=setTimeout(reveal,120)}},cancelEdge:()=>clearTimeout(edge.current)}
}

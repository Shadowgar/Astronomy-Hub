import React,{type ButtonHTMLAttributes} from 'react'
import icons from './icons.json'
export type IconName=keyof typeof icons
// SVG comes exclusively from the committed, licensed Lucide subset, never runtime data.
export function Icon({name}:{name:IconName}){return <span className="ws-icon" aria-hidden="true" dangerouslySetInnerHTML={{__html:icons[name]}}/>}
export function IconButton({icon,label,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{icon:IconName;label:string}){return <button type="button" className="ws-icon-button" aria-label={label} title={label} {...props}><Icon name={icon}/></button>}
export function CloseButton({onClick}:{onClick:()=>void}){return <IconButton icon="x" label="Close panel" onClick={onClick}/>}
export function tabKeys(event:React.KeyboardEvent<HTMLElement>){const buttons=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]')];const index=buttons.indexOf(document.activeElement as HTMLButtonElement);const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:event.key==='ArrowRight'?(index+1)%buttons.length:event.key==='ArrowLeft'?(index+buttons.length-1)%buttons.length:-1;if(next>=0){event.preventDefault();buttons[next].focus()}}

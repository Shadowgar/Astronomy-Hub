import type {ReactNode} from 'react'
import {skyWorkspacePath} from './workspaceNavigation'

export default function SkyWorkspaceLink({href,children,...props}:{href:string;children:ReactNode;'aria-label'?:string;className?:string}){
 const path=skyWorkspacePath(href)
 return path?<a {...props} href={path}>{children}</a>:<span>Sky link unavailable</span>
}

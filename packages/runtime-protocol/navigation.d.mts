import type {NavigationState,NavigationView,NavigationIntent} from './index.mjs'
export const SKY_OUTWARD_FOV:Readonly<Record<number,number>>
export function validNavigationState(value:unknown):value is NavigationState
export function validNavigationView(value:unknown):value is NavigationView
export function validNavigationEvent(value:unknown):value is NavigationIntent

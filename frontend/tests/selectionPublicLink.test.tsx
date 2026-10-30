import React from 'react'
import {it,expect,vi,afterEach} from 'vitest'
import {SelectionActions} from '../src/features/workspace/SelectionDrawer'
import type {SelectionDTO} from '../../../packages/runtime-protocol/index.mjs'
afterEach(()=>vi.unstubAllGlobals())
it('Copy link keeps object identity and scene context inside Astronomy Hub',()=>{
 const writeText=vi.fn();vi.stubGlobal('navigator',{clipboard:{writeText}});vi.stubGlobal('location',{origin:'http://local'})
 const selection={id:'sat',name:'Satellite',kind:'satellite',available:true,focusable:true,trackable:false,link:'/oras-sky-engine/skysource/sat?catalog=Satellite+TLE+%28local%29&source_id=28096&model=tle_satellite&date=2026-06-04T02%3A58%3A00.000Z&lat=41&lng=-79&elev=432.816'} as SelectionDTO
 const root=SelectionActions({selection,tracking:false,onFocus(){},onTrack(){},onClear(){}});const copy=(React.Children.toArray(root.props.children) as any[]).find(x=>x.props?.className==='ws-copy-link');copy.props.onClick();const url=new URL(writeText.mock.calls[0][0]);expect(url.pathname).toBe('/sky-engine');expect(url.searchParams.get('source_id')).toBe('28096');expect(url.searchParams.get('date')).toBe('2026-06-04T02:58:00.000Z');expect(url.searchParams.get('elev')).toBe('432.816')
})

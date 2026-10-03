import {describe,it,expect} from 'vitest';import {readPreferences,nextSnap} from '../src/features/workspace/workspaceUiState';import {chromeState} from '../src/features/workspace/ImmersiveController';
describe('bounded workspace preferences and interaction',()=>{
 it('rejects malformed, oversized, unknown-layer session data and never restores transient state',()=>{
  for(const text of ['bad','x'.repeat(1025),JSON.stringify({version:1,pin:true,context:'observe',layers:['future']})])expect(readPreferences({getItem:()=>text})).toEqual({pin:false,context:'tonight',layers:['oras-site','satellites']});
  expect(readPreferences({getItem:()=>JSON.stringify({version:1,pin:true,context:'observe',layers:['oras-site'],immersive:true,tracking:true})})).toEqual({pin:true,context:'observe',layers:['oras-site']});
 });
 it('focus and open sheets dominate pin and exploration; explicit immersive remembers but overrides pin',()=>{
  const flags={focused:false,sheet:false,panel:false,pin:false,immersive:false,exploring:false,hidden:false};expect(chromeState(flags)).toBe('NORMAL');expect(chromeState({...flags,hidden:true})).toBe('AUTO_HIDDEN');expect(chromeState({...flags,pin:true,hidden:true})).toBe('PINNED');expect(chromeState({...flags,pin:true,immersive:true})).toBe('AUTO_HIDDEN');expect(chromeState({...flags,focused:true,immersive:true})).toBe('KEYBOARD_FOCUS');expect(chromeState({...flags,sheet:true,hidden:true})).toBe('MOBILE_SHEET_OPEN');expect(chromeState({...flags,panel:true,hidden:true})).toBe('PANEL_OPEN');
 });
 it('sheet gestures move one snap and remain bounded; brief taps do not resize',()=>{expect(nextSnap(360,-100,400)).toBe(640);expect(nextSnap(360,100,400)).toBe(96);expect(nextSnap(96,100,400)).toBe(96);expect(nextSnap(640,-100,400)).toBe(640);expect(nextSnap(360,3,100)).toBe(360)});
});

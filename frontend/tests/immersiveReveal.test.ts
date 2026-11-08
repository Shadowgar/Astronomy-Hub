import {it,expect,vi,afterEach} from 'vitest'
const store=vi.hoisted(()=>({values:[] as unknown[]}))
vi.mock('react',()=>({
 useState:(initial:unknown)=>{const index=store.values.push(initial)-1;return [initial,(value:unknown)=>{store.values[index]=typeof value==='function'?value(store.values[index]):value}]},
 useRef:(initial:unknown)=>({current:initial}),useCallback:(fn:unknown)=>fn,useEffect:(fn:()=>unknown)=>fn()
}))
import {useImmersive} from '../src/features/workspace/ImmersiveController'
afterEach(()=>{vi.useRealTimers();store.values=[]})
it('revealing controls cancels pending and delayed exploration hides so a touch user can open Explore',()=>{
 vi.useFakeTimers();const chrome=useImmersive({pin:false,panel:false,mobile:true});
 chrome.interact(true,false);vi.advanceTimersByTime(100);chrome.reveal();vi.advanceTimersByTime(300);expect(store.values[1]).toBe(false);
 // Renderer interaction delivery can trail the user’s reveal tap.
 chrome.interact(true,false);vi.advanceTimersByTime(300);expect(store.values[1]).toBe(false);
 vi.advanceTimersByTime(1600);chrome.interact(true,false);vi.advanceTimersByTime(300);expect(store.values[1]).toBe(true);
})
it('renderer blur cannot clear focus owned by a Hub control or resurrect a latent hide',()=>{
 vi.useFakeTimers();const chrome=useImmersive({pin:false,panel:false,mobile:true});
 chrome.interact(true,false);vi.advanceTimersByTime(300);expect(store.values[1]).toBe(true);
 chrome.interact(false,true); // Canvas focus temporarily exposes an internally hidden header.
 chrome.setFocused(true); // User taps/focuses the exposed Hub Explore control.
 chrome.interact(false,false); // Delayed native canvas blur must not hide that control.
 expect(store.values[2]).toBe(true);expect(store.values[1]).toBe(false);
 chrome.interact(true,false);vi.advanceTimersByTime(300);expect(store.values[1]).toBe(false);
 chrome.setFocused(false);chrome.interact(true,false);vi.advanceTimersByTime(300);expect(store.values[1]).toBe(true);
})

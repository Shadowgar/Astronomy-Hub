import {parseSceneDate} from '../runtime/productState'
import {beyondViews,type BeyondView} from './beyondContracts'
import {validBeyondCamera,type BeyondCamera} from './beyondMath'
export type BeyondVisit={schema:'oras.beyond-return.v1';epoch:string;view:BeyondView;camera:BeyondCamera}
export function beyondPath(epoch:string,view:BeyondView='outer'){return '/beyond?'+new URLSearchParams({date:epoch,view})}
export function validBeyondVisit(v:unknown):v is BeyondVisit{const s=v as BeyondVisit;return s?.schema==='oras.beyond-return.v1'&&!!parseSceneDate(s.epoch)&&beyondViews.includes(s.view)&&validBeyondCamera(s.camera)}
export function safeBeyondReturn(path:unknown,epoch:string):string|null{if(typeof path!=='string')return null;try{const u=new URL(path,'http://local');if(u.origin!=='http://local'||u.pathname!=='/beyond'||!parseSceneDate(epoch))return null;u.searchParams.set('date',epoch);return u.pathname+'?'+u.searchParams}catch{return null}}
/** Day-level measured events use a declared representative noon, never the
 * encounter UTC inherited from an unrelated spacecraft timeline. */
export function beyondEpoch(view:BeyondView,requested:string){return view==='voyager1'?'2012-08-25T12:00:00.000Z':view==='voyager2'?'2018-11-05T12:00:00.000Z':requested}

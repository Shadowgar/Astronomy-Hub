import { ORAS_SITE } from '../../config/orasSite'
import { shiftNightDate } from './model'

const localClock = new Intl.DateTimeFormat('en-US', {
 timeZone: ORAS_SITE.timezone, year:'numeric', month:'2-digit', day:'2-digit',
 hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23',
})

function localParts(now: Date) {
 const parts = Object.fromEntries(localClock.formatToParts(now).map(p => [p.type,p.value]))
 return {date:`${parts.year}-${parts.month}-${parts.day}`, hour:Number(parts.hour),
  wallTime:Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second))}
}

export function currentObservingNight(now = new Date()) {
 const local = localParts(now)
 return local.hour < 12 ? shiftNightDate(local.date,-1) : local.date
}

export function nextObservingNoon(now = new Date()) {
 const local = localParts(now)
 const date = local.hour < 12 ? local.date : shiftNightDate(local.date,1)
 const noonWallTime = Date.parse(`${date}T12:00:00Z`)
 let instant = noonWallTime
 // Resolve the target local noon using the offset on that date, including DST.
 for (let i=0;i<2;i++) instant += noonWallTime-localParts(new Date(instant)).wallTime
 return instant
}

export function subscribeObservingNight(onChange: () => void) {
 let timer: ReturnType<typeof setTimeout>
 const schedule = () => {
  clearTimeout(timer)
  timer = setTimeout(refresh, Math.max(1,nextObservingNoon()-Date.now()))
 }
 const refresh = () => { onChange(); schedule() }
 const visible = () => { if (document.visibilityState==='visible') refresh() }
 schedule()
 if (typeof window !== 'undefined') {
  window.addEventListener('focus',refresh)
  document.addEventListener('visibilitychange',visible)
 }
 return () => {
  clearTimeout(timer)
  if (typeof window !== 'undefined') {
   window.removeEventListener('focus',refresh)
   document.removeEventListener('visibilitychange',visible)
  }
 }
}

export const subscribeFixedNight = () => () => {}

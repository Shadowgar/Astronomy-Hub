export interface Identity { catalog: string; source_id: string; model: string }
export interface Target extends Identity {
 name: string; type: string; category: 'solar-system' | 'deep-sky' | 'stars'; ra: number; dec: number
 opportunity: { peak_time: string; peak_altitude_deg: number; peak_azimuth_deg: number; dark_duration_minutes: number; planning_altitude_duration_minutes: number; moon_separation_at_peak_deg?: number | null; moon_altitude_at_peak_deg?: number | null }
 ranking: { policy_version: string; rank_reason: string }; sky_engine_url: string
}
export interface ForecastHour { time: string; cloud_cover_pct?: number | null; temperature_c?: number | null; precipitation_probability_pct?: number | null; humidity_pct?: number | null; wind_kmh?: number | null; dew_point_c?: number | null; visibility_m?: number | null }
export interface TonightPayload {
 status: string
 data: {
  night: { night_date: string; timezone: string; status: string; interval_start: string; interval_end: string; dark_duration_minutes: number;
   astronomical_darkness: { start: string; end: string }[];
   twilight: Record<string, { dusk?: string | null; dawn?: string | null }>;
   moon?: { time: string; altitude_deg: number; illumination_fraction: number } | null }
  targets: Target[]; top_opportunities: Identity[]
  forecast: { status: string; provider: string; hours: ForecastHour[]; fetched_at?: string | null; coverage_start?: string | null; coverage_end?: string | null }
 }
 meta: { contract_version: 'tonight.v1'; observer: { label: string }; limitations: string[] }
}
export function identityKey(t: Identity) { return `${t.catalog}\0${t.source_id}\0${t.model}` }
export function nightPath(date?: string) { return `/tonight${date ? `?date=${encodeURIComponent(date)}` : ''}` }
export function shiftNightDate(date: string, days: number) {
 const d = new Date(`${date}T12:00:00Z`)
 d.setUTCDate(d.getUTCDate() + days)
 return d.toISOString().slice(0,10)
}
export function formatNightTime(value?: string | null) {
 if (!value) return 'Unavailable'
 return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short' }).format(new Date(value))
}
export function duration(minutes: number) { const m=Math.round(minutes); return `${Math.floor(m/60)}h ${m%60}m` }
export function forecastAtPeak(target: Target, hours: ForecastHour[]) {
 const peak=new Date(target.opportunity.peak_time).getTime()
 const near=[...hours].sort((a,b)=>Math.abs(new Date(a.time).getTime()-peak)-Math.abs(new Date(b.time).getTime()-peak))[0]
 return near && Math.abs(new Date(near.time).getTime()-peak)<=30*60_000 ? near : undefined
}
export function normalizeTonight(payload: unknown): TonightPayload {
 const p=payload as TonightPayload
 if (!p || p.meta?.contract_version!=='tonight.v1' || !p.data?.night || !Array.isArray(p.data?.targets) || !Array.isArray(p.data?.forecast?.hours)) throw new Error('Invalid night plan')
 return p
}

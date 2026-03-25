export interface DarknessWindow {
  start: string
  end: string
}

export interface Conditions {
  location_label: string
  cloud_cover_pct: number
  moon_phase: string
  darkness_window: DarknessWindow
  observing_score: string
  summary: string
  last_updated: string
}

import { ResponseEnvelope } from './responseEnvelope';

export interface ConditionItem {
  id?: string;
  summary?: string;
  location_label?: string;
  [k: string]: any;
}

export interface ConditionsData {
  items?: ConditionItem[];
  location_label?: string;
  [k: string]: any;
}

export type ConditionsResponse = ResponseEnvelope<ConditionsData>;

export default ConditionsResponse;
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

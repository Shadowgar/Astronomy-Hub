import { ResponseEnvelope } from '../types/responseEnvelope';

/**
 * Thin typed API fetch helper.
 * - Returns the raw ResponseEnvelope<T> parsed from JSON
 * - Does not replace existing JS clients; intended for incremental adoption
 */
export async function fetchApi<T = any>(path: string, init?: RequestInit): Promise<ResponseEnvelope<T>> {
  const res = await fetch(path, init);
  const json = await res.json();
  return json as ResponseEnvelope<T>;
}

export default fetchApi;

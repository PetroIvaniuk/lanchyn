/**
 * Fetch and parse a JSON file.
 *
 * @param url Absolute URL or path (e.g. `/lanchyn/data/names/names.json`).
 */
export async function loadJson<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

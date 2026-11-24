/** Page creation date. A constant: never changes. */
export const CREATED_DATE = "2026-11-24";

/** Date the input data last changed (injected at build time from git). */
export const UPDATED_DATE: string = __DATA_UPDATED__;

/** "2026-11-24" -> "24.11.2026" */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

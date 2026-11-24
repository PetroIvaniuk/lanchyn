export type Frequency = Record<string, number>;
export type FrequencyEntry = readonly [name: string, count: number];

export interface YearRange {
  start: number;
  end: number;
}

/** Parses labels like "1800–1824" (en dash, em dash or hyphen). */
export function parsePeriodLabel(label: string): YearRange | null {
  const match = /^\s*(\d{4})\s*[–—-]\s*(\d{4})\s*$/.exec(label);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  return start <= end ? { start, end } : null;
}

/**
 * Entries sorted by count (descending). The sort is stable, so names with
 * equal counts keep their original order from the dataset.
 */
export function sortByFrequency(freq: Frequency | null | undefined): FrequencyEntry[] {
  return Object.entries(freq ?? {}).sort((a, b) => b[1] - a[1]);
}

/** Splits already-sorted entries into the first `n` and the rest. */
export function splitTop<T>(sorted: readonly T[], n: number): { top: T[]; rest: T[] } {
  return { top: sorted.slice(0, n), rest: sorted.slice(n) };
}

/** Highest count across several frequency tables (0 when empty). */
export function maxCount(tables: ReadonlyArray<Frequency | null | undefined>): number {
  let max = 0;
  for (const table of tables) {
    for (const count of Object.values(table ?? {})) {
      if (count > max) max = count;
    }
  }
  return max;
}

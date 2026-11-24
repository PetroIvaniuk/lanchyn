/** Name -> number of occurrences. */
export type NameFrequency = Record<string, number>;

/**
 * One historical period of the names dataset (`names_periods` in data/names/names.json).
 *
 * `F` / `M` can be `null` in the source data when no names were recorded
 * for that sex in the period.
 */
export interface PeriodData {
  year_period_label: string;
  F: NameFrequency | null;
  M: NameFrequency | null;
}

/** Name frequencies over all years combined (`names_all[0]`). */
export interface AllNamesData {
  F: NameFrequency | null;
  M: NameFrequency | null;
}

/** Root of data/names/names.json. */
export interface NamesDataset {
  /** Number of people in the genealogical research. */
  num_persons: number;
  /** Number of families in the genealogical research. */
  num_families: number;
  /** Number of people used for the names statistics (exact birth year, born in Lanchyn). */
  num_names: number;
  /** Exactly one item: totals over all periods. */
  names_all: AllNamesData[];
  names_periods: PeriodData[];
}

export type Sex = "F" | "M";

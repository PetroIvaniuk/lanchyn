import type { NameFrequency, NamesDataset, PeriodData, Sex } from "@shared/types/names.ts";
import {
  parsePeriodLabel,
  sortByFrequency,
  splitTop,
  type FrequencyEntry,
} from "@shared/utils/statistics.ts";

/** Number of most frequent names shown as bars for each 25-year period. */
export const TOP_N = 5;

/** Number of most frequent names shown as bars for the all-years charts. */
export const TOP_N_ALL = 10;

/** The six historical periods shown on the page (inclusive years). */
export const PERIODS = [
  { start: 1800, end: 1824 },
  { start: 1825, end: 1849 },
  { start: 1850, end: 1874 },
  { start: 1875, end: 1899 },
  { start: 1900, end: 1924 },
  { start: 1925, end: 1949 },
] as const;

export interface PeriodView {
  label: string;
  /** Top N names, sorted by count (descending). */
  top: FrequencyEntry[];
  /** All remaining names, in the same sorted order. */
  rest: FrequencyEntry[];
  /** Total number of name occurrences (sum of all values in the dict). */
  total: number;
}

export interface SexView {
  sex: Sex;
  periods: PeriodView[];
}

export type NamesView = Record<Sex, SexView>;

/** Female + male charts for the all-years block. */
export interface AllView {
  label: string;
  F: PeriodView;
  M: PeriodView;
}

function formatLabel(start: number, end: number): string {
  return `${start}–${end}`;
}

/** Sorts a name dictionary and derives Top N, the rest and the total from it. */
function makePeriodView(label: string, freq: NameFrequency | null | undefined, topN: number): PeriodView {
  const sorted = sortByFrequency(freq);
  const { top, rest } = splitTop(sorted, topN);
  return { label, top, rest, total: sorted.reduce((sum, [, c]) => sum + c, 0) };
}

/** Derives Top N and Notes for each of the six periods (`names_periods`). */
export function buildView(data: readonly PeriodData[]): NamesView {
  const byRange = new Map<string, PeriodData>();
  for (const item of data) {
    const range = parsePeriodLabel(item.year_period_label);
    if (range) byRange.set(formatLabel(range.start, range.end), item);
  }

  const makeSex = (sex: Sex): SexView => ({
    sex,
    periods: PERIODS.map(({ start, end }) => {
      const label = formatLabel(start, end);
      return makePeriodView(label, byRange.get(label)?.[sex], TOP_N);
    }),
  });

  return { F: makeSex("F"), M: makeSex("M") };
}

/**
 * Author's estimate of children born in Greek Catholic families of Lanchyn
 * in 1900–1924 (about 4 thousand); used in the methodology text.
 */
export const ESTIMATED_BIRTHS_1900_1924 = 4000;

/** Numbers substituted into the methodology text. */
export interface MethodologyStats {
  /** From the data: families in the research. */
  numFamilies: number;
  /** From the data: people in the research. */
  numPersons: number;
  /** From the data: people used for the names statistics. */
  numNames: number;
  /** Counted: names (F + M) in the 1900–1924 period. */
  namesIn1900_1924: number;
  /** Counted: names in 1900–1924 as a percentage of the estimated births, rounded to 2 decimals. */
  coverage1900_1924: number;
}

function sumValues(freq: NameFrequency | null | undefined): number {
  return Object.values(freq ?? {}).reduce((sum, c) => sum + c, 0);
}

export function buildMethodologyStats(data: NamesDataset): MethodologyStats {
  const period = data.names_periods.find((p) => {
    const range = parsePeriodLabel(p.year_period_label);
    return range?.start === 1900 && range.end === 1924;
  });
  const namesIn1900_1924 = period ? sumValues(period.F) + sumValues(period.M) : 0;

  return {
    numFamilies: data.num_families,
    numPersons: data.num_persons,
    numNames: data.num_names,
    namesIn1900_1924,
    coverage1900_1924: Math.round((namesIn1900_1924 / ESTIMATED_BIRTHS_1900_1924) * 10000) / 100,
  };
}

/** Derives Top N (10) and Notes from `names_all`; the label spans all periods in the data. */
export function buildAllView(data: NamesDataset): AllView {
  const years = data.names_periods
    .map((p) => parsePeriodLabel(p.year_period_label))
    .filter((r) => r !== null);
  const label =
    years.length > 0
      ? formatLabel(Math.min(...years.map((r) => r.start)), Math.max(...years.map((r) => r.end)))
      : "Усі роки";

  const all = data.names_all[0];
  return {
    label,
    F: makePeriodView(label, all?.F, TOP_N_ALL),
    M: makePeriodView(label, all?.M, TOP_N_ALL),
  };
}

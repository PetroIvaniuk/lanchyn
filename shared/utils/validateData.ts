import type { NamesDataset } from "../types/names.ts";
import { parsePeriodLabel } from "./statistics.ts";

function validateFrequency(value: unknown, path: string, errors: string[]): void {
  if (value === null) return; // allowed: no records for this sex
  if (typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${path}: expected an object or null`);
    return;
  }
  for (const [name, count] of Object.entries(value)) {
    if (name.trim() === "") errors.push(`${path}: empty name`);
    if (!Number.isInteger(count) || (count as number) < 0) {
      errors.push(`${path}["${name}"]: expected a non-negative integer, got ${JSON.stringify(count)}`);
    }
  }
}

function validateSexes(item: unknown, path: string, errors: string[]): Record<string, unknown> | null {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    errors.push(`${path}: expected an object`);
    return null;
  }
  const record = item as Record<string, unknown>;
  for (const sex of ["F", "M"] as const) {
    if (!(sex in record)) errors.push(`${path}.${sex}: missing`);
    else validateFrequency(record[sex], `${path}.${sex}`, errors);
  }
  return record;
}

/** Returns a list of problems; an empty list means the data is valid. */
export function validateNamesData(data: unknown): string[] {
  const errors: string[] = [];
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return ["root: expected an object with keys names_all and names_periods"];
  }
  const root = data as Record<string, unknown>;

  for (const key of ["num_persons", "num_families", "num_names"]) {
    const value = root[key];
    if (!Number.isInteger(value) || (value as number) < 0) {
      errors.push(`${key}: expected a non-negative integer, got ${JSON.stringify(value)}`);
    }
  }

  // names_all: exactly one { F, M } object
  const all = root.names_all;
  if (!Array.isArray(all)) errors.push("names_all: expected an array");
  else if (all.length !== 1) errors.push(`names_all: expected exactly 1 item, got ${all.length}`);
  else validateSexes(all[0], "names_all[0]", errors);

  // names_periods: array of period objects
  const periods = root.names_periods;
  if (!Array.isArray(periods)) {
    errors.push("names_periods: expected an array");
  } else {
    const labels = new Set<string>();
    periods.forEach((item, i) => {
      const path = `names_periods[${i}]`;
      const period = validateSexes(item, path, errors);
      if (!period) return;
      const label = period.year_period_label;
      if (typeof label !== "string" || parsePeriodLabel(label) === null) {
        errors.push(`${path}.year_period_label: expected a label like "1800–1824", got ${JSON.stringify(label)}`);
      } else if (labels.has(label)) {
        errors.push(`${path}.year_period_label: duplicate period "${label}"`);
      } else {
        labels.add(label);
      }
    });
  }
  return errors;
}

/** Throws with a readable message when the names dataset is invalid. */
export function assertNamesData(data: unknown): asserts data is NamesDataset {
  const errors = validateNamesData(data);
  if (errors.length > 0) {
    throw new Error(`Invalid names data:\n- ${errors.slice(0, 10).join("\n- ")}`);
  }
}

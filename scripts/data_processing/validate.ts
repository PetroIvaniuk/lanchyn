/**
 * Validates the shared datasets in data/.
 * Run from the repository root:  node scripts/data_processing/validate.ts
 * (Node 22.18+ runs TypeScript natively.)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateNamesData } from "../../shared/utils/validateData.ts";

const dataDir = fileURLToPath(new URL("../../data/", import.meta.url));

const datasets: Array<{ file: string; validate: (data: unknown) => string[] }> = [
  { file: "names/names.json", validate: validateNamesData },
];

let failed = false;
for (const { file, validate } of datasets) {
  let errors: string[];
  try {
    errors = validate(JSON.parse(readFileSync(dataDir + file, "utf8")));
  } catch (e) {
    errors = [(e as Error).message];
  }
  if (errors.length > 0) {
    failed = true;
    console.error(`✗ data/${file}`);
    errors.forEach((e) => console.error(`    ${e}`));
  } else {
    console.log(`✓ data/${file}`);
  }
}
process.exit(failed ? 1 : 0);

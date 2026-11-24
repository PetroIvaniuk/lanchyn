/**
 * Builds every app in apps/ and assembles the GitHub Pages site into dist/:
 *
 *   dist/index.html        <- site/index.html + a card per apps/<app>/meta.json
 *   dist/<app>/...         <- apps/<app>/dist
 *   dist/data/...          <- data/
 *
 * Usage (from the repository root): node scripts/build_site.mjs
 * Pass --skip-install to skip `npm ci` (useful locally).
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = join(root, "dist");
const skipInstall = process.argv.includes("--skip-install");

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\nFailed: ${cmd} ${args.join(" ")} (in ${cwd})`);
    process.exit(result.status ?? 1);
  }
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const appsDir = join(root, "apps");
const apps = readdirSync(appsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(appsDir, d.name, "package.json")))
  .map((d) => d.name)
  .sort();

for (const app of apps) {
  const dir = join(appsDir, app);
  console.log(`\n=== Building ${app} ===`);
  if (!skipInstall) run("npm", ["ci"], dir);
  run("npm", ["run", "build"], dir);
  cpSync(join(dir, "dist"), join(out, app), { recursive: true });
}

cpSync(join(root, "site"), out, { recursive: true });

// Main page: one card per app, taken from apps/<app>/meta.json (title + subtitle).
const escapeHtml = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const cards = apps
  .map((app) => {
    const metaPath = join(appsDir, app, "meta.json");
    if (!existsSync(metaPath)) {
      console.error(`Missing ${metaPath} (needs "title" and "subtitle")`);
      process.exit(1);
    }
    const { title, subtitle } = JSON.parse(readFileSync(metaPath, "utf8"));
    if (!title || !subtitle) {
      console.error(`${metaPath} must contain "title" and "subtitle"`);
      process.exit(1);
    }
    return `        <li>\n          <a href="${app}/">${escapeHtml(title)}<small>${escapeHtml(subtitle)}</small></a>\n        </li>`;
  })
  .join("\n");

const placeholder = /[ \t]*<!-- APP_CARDS:.*?-->/;
const indexPath = join(out, "index.html");
const template = readFileSync(indexPath, "utf8");
if (!placeholder.test(template)) {
  console.error("site/index.html has no <!-- APP_CARDS: ... --> placeholder");
  process.exit(1);
}
writeFileSync(indexPath, template.replace(placeholder, () => cards));

// Skip hidden files (.DS_Store, .ipynb_checkpoints, ...) so they are never published.
cpSync(join(root, "data"), join(out, "data"), {
  recursive: true,
  filter: (src) => !basename(src).startsWith("."),
});
console.log(`\nSite assembled in ${out} (apps: ${apps.join(", ") || "none"})`);

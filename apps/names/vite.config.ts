import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Connect, type Plugin } from "vite";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const dataDir = resolve(repoRoot, "data");

/**
 * Date (YYYY-MM-DD) when the names dataset last changed.
 * - Uncommitted edits: the file's modification time.
 * - Otherwise: the date of the last git commit that touched the file
 *   (needs full git history, see `fetch-depth: 0` in the deploy workflow).
 * - No git available: the file's modification time.
 */
function dataUpdatedDate(): string {
  const file = resolve(dataDir, "names/names.json");
  const mtime = () => {
    const d = statSync(file).mtime;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const git = (...args: string[]) =>
    execFileSync("git", ["--no-optional-locks", ...args], { cwd: repoRoot, encoding: "utf8" }).trim();

  try {
    if (git("status", "--porcelain", "--", file) !== "") return mtime();
    const committed = git("log", "-1", "--format=%cs", "--", file);
    return /^\d{4}-\d{2}-\d{2}$/.test(committed) ? committed : mtime();
  } catch {
    return mtime();
  }
}

/** Public URL prefix of the shared datasets (same as on GitHub Pages). */
const DATA_URL_PREFIX = "/lanchyn/data/";

/**
 * Serves the central `data/` directory at /lanchyn/data/* during `dev` and
 * `preview`, mirroring the production layout. Nothing is copied into the app.
 */
function sharedData(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = (req.url ?? "").split("?")[0];
    if (!url.startsWith(DATA_URL_PREFIX)) return next();

    const file = normalize(resolve(dataDir, decodeURIComponent(url.slice(DATA_URL_PREFIX.length))));
    if (!file.startsWith(dataDir + sep) || !existsSync(file) || !statSync(file).isFile()) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    res.setHeader("Content-Type", extname(file) === ".json" ? "application/json; charset=utf-8" : "application/octet-stream");
    createReadStream(file).pipe(res);
  };

  return {
    name: "lanchyn-shared-data",
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

/**
 * Page title and description for index.html come from meta.json, the single
 * source of truth also used by App.tsx and the main-page card.
 */
function appMeta(): Plugin {
  const meta = JSON.parse(
    readFileSync(fileURLToPath(new URL("./meta.json", import.meta.url)), "utf8"),
  ) as { title: string; subtitle: string };
  const escape = (s: string) =>
    s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

  return {
    name: "lanchyn-app-meta",
    transformIndexHtml: {
      order: "pre",
      handler: (html) =>
        html.replaceAll("%APP_TITLE%", escape(meta.title)).replaceAll("%APP_DESCRIPTION%", escape(meta.subtitle)),
    },
  };
}

export default defineConfig({
  plugins: [react(), appMeta(), sharedData()],
  base: "/lanchyn/names/",
  define: { __DATA_UPDATED__: JSON.stringify(dataUpdatedDate()) },
  resolve: { alias: { "@shared": resolve(repoRoot, "shared") } },
  server: { fs: { allow: [repoRoot] } },
});

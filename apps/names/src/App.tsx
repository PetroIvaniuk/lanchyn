import { useEffect, useMemo, useState } from "react";
import type { NamesDataset } from "@shared/types/names.ts";
import { loadJson } from "@shared/utils/loadJson.ts";
import { assertNamesData } from "@shared/utils/validateData.ts";
import { AllYears } from "./components/AllYears.tsx";
import { Methodology } from "./components/Methodology.tsx";
import { PeriodRow } from "./components/PeriodRow.tsx";
import { CREATED_DATE, UPDATED_DATE, formatDate } from "./dates.ts";
import { PERIODS, buildAllView, buildMethodologyStats, buildView } from "./model.ts";
import meta from "../meta.json";

/**
 * Shared dataset, served from the central data/ directory at
 * /lanchyn/data/names/names.json (BASE_URL is /lanchyn/names/).
 */
const DATA_URL = `${import.meta.env.BASE_URL}../data/names/names.json`;

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: NamesDataset };

export default function App() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    loadJson<unknown>(DATA_URL, { signal: controller.signal })
      .then((data) => {
        assertNamesData(data);
        setState({ status: "ready", data });
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", message: e instanceof Error ? e.message : String(e) });
      });
    return () => controller.abort();
  }, []);

  const view = useMemo(
    () =>
      state.status === "ready"
        ? {
            periods: buildView(state.data.names_periods),
            all: buildAllView(state.data),
            stats: buildMethodologyStats(state.data),
          }
        : null,
    [state],
  );

  return (
    <div className="page">
      <header className="page-header">
        <h1>{meta.title}</h1>
        <p className="subtitle">{meta.subtitle}</p>
      </header>

      <main>
        {state.status === "loading" && <p className="status">Завантаження даних…</p>}
        {state.status === "error" && (
          <p className="status status-error" role="alert">
            Не вдалося завантажити дані. {state.message}
          </p>
        )}
        {view && <Methodology stats={view.stats} />}
        {view && (
          <div className="rows">
            <div className="column-heads" aria-hidden="true">
              <h2 className="head-F">Жінки</h2>
              <h2 className="head-M">Чоловіки</h2>
            </div>
            {PERIODS.map((p, i) => (
              <PeriodRow
                key={p.start}
                id={String(p.start)}
                title={view.periods.F.periods[i].label}
                female={view.periods.F.periods[i]}
                male={view.periods.M.periods[i]}
              />
            ))}
            <AllYears view={view.all} />
          </div>
        )}
      </main>

      <footer className="page-footer">
        <p className="page-dates">
          Створено: <time dateTime={CREATED_DATE}>{formatDate(CREATED_DATE)}</time>
          {" · "}
          Оновлено: <time dateTime={UPDATED_DATE}>{formatDate(UPDATED_DATE)}</time>
        </p>
        <p>© 2026 Petro Ivaniuk. Усі права захищено.</p>
      </footer>
    </div>
  );
}

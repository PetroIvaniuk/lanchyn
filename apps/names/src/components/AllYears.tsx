import type { AllView } from "../model.ts";
import { PeriodChart } from "./PeriodChart.tsx";

interface Props {
  view: AllView;
}

/** Collapsible block with the all-years (top 10) charts, styled like the methodology block. */
export function AllYears({ view }: Props) {
  return (
    <details className="collapsible all-years">
      <summary>Усі роки</summary>
      <div className="collapsible-body">
        <div className="period-pair">
          <PeriodChart sex="F" title="Жіночі імена" period={view.F} />
          <PeriodChart sex="M" title="Чоловічі імена" period={view.M} />
        </div>
      </div>
    </details>
  );
}

import type { PeriodView } from "../model.ts";
import { PeriodChart } from "./PeriodChart.tsx";

interface Props {
  /** Unique id suffix for the heading (used for aria-labelledby). */
  id: string;
  title: string;
  female: PeriodView;
  male: PeriodView;
}

/** One horizontal block: a single title and the female + male charts. */
export function PeriodRow({ id, title, female, male }: Props) {
  return (
    <section className="period-row" aria-labelledby={`period-${id}`}>
      <h3 id={`period-${id}`} className="period-title">
        {title}
      </h3>
      <div className="period-pair">
        <PeriodChart sex="F" title="Жіночі імена" period={female} />
        <PeriodChart sex="M" title="Чоловічі імена" period={male} />
      </div>
    </section>
  );
}

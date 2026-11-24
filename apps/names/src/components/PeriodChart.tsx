import type { Sex } from "@shared/types/names.ts";
import type { PeriodView } from "../model.ts";

interface Props {
  sex: Sex;
  /** Sex label; visible only on narrow screens where columns are stacked. */
  title: string;
  period: PeriodView;
}

export function PeriodChart({ sex, title, period }: Props) {
  const { top, rest, total } = period;
  // Each chart has its own scale: the biggest bar (first, as top is sorted) is 100%.
  const maxCount = top[0]?.[1] ?? 0;

  return (
    <article className={`period period-${sex}`}>
      <h4 className="period-sex">{title}</h4>

      {top.length === 0 ? (
        <p className="empty">Немає даних</p>
      ) : (
        <ul className="bars">
          {top.map(([name, count]) => (
            <li
              key={name}
              className="bar-row"
              tabIndex={0}
              data-tooltip={`${name}: ${count}`}
              aria-label={`${name}: ${count}`}
            >
              <span className="bar-name">{name}</span>
              <span className="bar-track" aria-hidden="true">
                <span
                  className="bar-fill"
                  style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                />
              </span>
              <span className="bar-count">{count}</span>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && (
        <div className="notes">
          {rest.length > 0 && (
          <p className="notes-total">
            <span className="notes-label">Усього записів: </span>
            {total}
          </p>
          )}
          {rest.length > 0 && (
            <p>
              <span className="notes-label">Інші імена: </span>
              {rest.map(([name]) => name).join(" · ")}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

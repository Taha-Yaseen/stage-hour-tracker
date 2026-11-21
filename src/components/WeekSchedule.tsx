import type { FormEvent } from "react";
import { formatDuration } from "../lib/hours";
import {
  WEEKDAYS,
  planSummary,
  scheduleProblem,
  weekdayMinutes,
  type FinishForecast,
} from "../lib/schedule";
import type { ScheduleBlock } from "../lib/types";

type WeekScheduleProps = {
  blocks: ScheduleBlock[];
  forecast: FinishForecast;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onChange: (blocks: ScheduleBlock[]) => void;
  onSubmit: () => void;
};

export function WeekSchedule({
  blocks,
  forecast,
  dirty,
  saving,
  saved,
  error,
  onChange,
  onSubmit,
}: WeekScheduleProps) {
  const problem = scheduleProblem(blocks);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function updateBlock(index: number, field: "start" | "end", value: string) {
    onChange(
      blocks.map((block, blockIndex) =>
        blockIndex === index ? { ...block, [field]: value } : block,
      ),
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit} aria-labelledby="week-heading">
      <h2 id="week-heading">Weekly schedule</h2>
      <p className="hint">Turn on each day you can be at the lab, and the times for that day.</p>

      <Plan forecast={forecast} />

      {WEEKDAYS.map(({ weekday, label }) => {
        const entries = blocks
          .map((block, index) => ({ block, index }))
          .filter(({ block }) => block.weekday === weekday);
        const minutes = weekdayMinutes(blocks, weekday);

        return (
          <div className="week-day" key={weekday}>
            <div className="week-day-top">
              <h3>{label}</h3>
              {entries.length === 0 ? (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => onChange([...blocks, { weekday, start: "", end: "" }])}
                >
                  Add {label}
                </button>
              ) : (
                <span className="week-hours">{minutes === null ? "Add times" : formatDuration(minutes)}</span>
              )}
            </div>

            {entries.map(({ block, index }, entryIndex) => (
              <div className="block-row" key={`${weekday}-${index}`}>
                <label htmlFor={`week-${weekday}-start-${entryIndex}`}>
                  Start
                  <span className="control">
                    <input
                      id={`week-${weekday}-start-${entryIndex}`}
                      type="time"
                      value={block.start}
                      onChange={(event) => updateBlock(index, "start", event.target.value)}
                      required
                    />
                  </span>
                </label>
                <span className="to" aria-hidden="true">
                  to
                </span>
                <label htmlFor={`week-${weekday}-end-${entryIndex}`}>
                  End
                  <span className="control">
                    <input
                      id={`week-${weekday}-end-${entryIndex}`}
                      type="time"
                      value={block.end}
                      onChange={(event) => updateBlock(index, "end", event.target.value)}
                      required
                    />
                  </span>
                </label>
                {entries.length > 1 ? (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => onChange(blocks.filter((_, blockIndex) => blockIndex !== index))}
                  >
                    Remove this time
                  </button>
                ) : null}
              </div>
            ))}

            {entries.length > 0 ? (
              <div className="week-day-actions">
                <button
                  className="text-button"
                  type="button"
                  onClick={() => onChange([...blocks, { weekday, start: "", end: "" }])}
                >
                  Add another time
                </button>
                <button
                  className="text-button danger"
                  type="button"
                  onClick={() => onChange(blocks.filter((block) => block.weekday !== weekday))}
                >
                  Remove {label}
                </button>
              </div>
            ) : null}
          </div>
        );
      })}

      {forecast.status === "planned" ? (
        <p className="preview">Each week: {formatDuration(forecast.weeklyMinutes)}</p>
      ) : null}
      {dirty && !problem ? (
        <p className="hint">Save this week so your phone and laptop stay on the same schedule.</p>
      ) : null}
      {saved && !dirty ? <p className="preview">Week saved.</p> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <button className="primary" type="submit" disabled={saving || problem !== null}>
          {saving ? "Saving…" : "Save this week"}
        </button>
      </div>
    </form>
  );
}

function Plan({ forecast }: { forecast: FinishForecast }) {
  if (forecast.status !== "planned") {
    return <p className="plan-note">{planSummary(forecast)}</p>;
  }

  const afterUnit = forecast.calendarDays === 1 ? "day" : "days";

  return (
    <div className="plan">
      <div className="plan-stat">
        <p className="done-label">Days you need</p>
        <p className="plan-total">{forecast.labDays}</p>
        <p className="plan-unit">{forecast.labDays === 1 ? "lab day" : "lab days"}</p>
      </div>
      <div className="plan-stat">
        <p className="done-label">Done after</p>
        {forecast.calendarDays === 0 ? (
          <p className="plan-total plan-total-word">Today</p>
        ) : (
          <>
            <p className="plan-total">{forecast.calendarDays}</p>
            <p className="plan-unit">{afterUnit}</p>
          </>
        )}
      </div>
      <p className="plan-note">{planSummary(forecast)}</p>
    </div>
  );
}

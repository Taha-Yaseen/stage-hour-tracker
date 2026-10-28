import { dayMinutes, formatClock, formatDay, formatDuration } from "../lib/hours";
import type { DayLog } from "../lib/types";

type DayListProps = {
  days: DayLog[];
  editingId: string | null;
  confirmDeleteId: string | null;
  deletingId: string | null;
  onEdit: (day: DayLog) => void;
  onAskDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
};

export function DayList({
  days,
  editingId,
  confirmDeleteId,
  deletingId,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: DayListProps) {
  return (
    <section className="card" aria-labelledby="days-heading">
      <h2 id="days-heading">Logged days</h2>
      {days.length === 0 ? (
        <p className="hint">No days yet. The first one starts the track.</p>
      ) : (
        <ul className="day-list">
          {days.map((day) => {
            const confirming = confirmDeleteId === day.id;
            return (
              <li key={day.id} className={editingId === day.id ? "day editing" : "day"}>
                <div className="day-top">
                  <div>
                    <p className="day-date">{formatDay(day.log_date)}</p>
                    <p className="day-hours">{formatDuration(dayMinutes(day))}</p>
                  </div>
                  <div className="day-actions">
                    <button className="text-button" type="button" onClick={() => onEdit(day)}>
                      Edit
                    </button>
                    {confirming ? (
                      <>
                        <button className="text-button" type="button" onClick={onCancelDelete}>
                          Keep
                        </button>
                        <button
                          className="text-button danger"
                          type="button"
                          disabled={deletingId === day.id}
                          onClick={() => onConfirmDelete(day.id)}
                        >
                          {deletingId === day.id ? "Deleting…" : "Delete day"}
                        </button>
                      </>
                    ) : (
                      <button
                        className="text-button danger"
                        type="button"
                        onClick={() => onAskDelete(day.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="day-blocks">
                  {day.sessions
                    .map((session) => `${formatClock(session.starts_at)} – ${formatClock(session.ends_at)}`)
                    .join(" · ")}
                </p>
                {day.note ? <p className="day-note">{day.note}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

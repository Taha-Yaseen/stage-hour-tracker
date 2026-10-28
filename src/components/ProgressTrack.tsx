import type { CSSProperties } from "react";
import { LabGirl } from "./LabGirl";
import {
  TARGET_HOURS,
  TARGET_MINUTES,
  encouragement,
  formatDuration,
  progressPercent,
} from "../lib/hours";

const MARKERS = [0, 50, 100, 150, 200];

type ProgressTrackProps = {
  minutes: number;
};

export function ProgressTrack({ minutes }: ProgressTrackProps) {
  const percent = progressPercent(minutes);
  const remaining = Math.max(0, TARGET_MINUTES - minutes);
  const finished = minutes >= TARGET_MINUTES;

  let status = `${formatDuration(remaining)} left of ${TARGET_HOURS} hours`;
  if (finished && minutes === TARGET_MINUTES) status = "Internship complete";
  if (minutes > TARGET_MINUTES) {
    status = `${formatDuration(minutes - TARGET_MINUTES)} past ${TARGET_HOURS} hours`;
  }

  return (
    <section className="card hero" aria-label="Hours progress">
      <p className="done-label">Hours done</p>
      <p className="done-total">{formatDuration(minutes)}</p>
      <p className="done-status">{status}</p>
      <div
        className={finished ? "stage is-complete" : "stage"}
        style={{ "--pct": percent } as CSSProperties}
      >
        <div className="walker">
          <LabGirl />
        </div>
        <div className="rail" aria-hidden="true">
          <div className="rail-fill" />
        </div>
        <span className="finish" aria-hidden="true">
          ★
        </span>
      </div>
      <div className="markers" aria-hidden="true">
        {MARKERS.map((hour) => (
          <span key={hour}>{hour}</span>
        ))}
      </div>
      <p className="encourage">{encouragement(minutes)}</p>
    </section>
  );
}

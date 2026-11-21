import { TARGET_MINUTES, formatDay, formatDuration, toMinutes } from "./hours";
import type { ScheduleBlock } from "./types";

export const WEEKDAYS = [
  { weekday: 1, label: "Monday" },
  { weekday: 2, label: "Tuesday" },
  { weekday: 3, label: "Wednesday" },
  { weekday: 4, label: "Thursday" },
  { weekday: 5, label: "Friday" },
  { weekday: 6, label: "Saturday" },
  { weekday: 7, label: "Sunday" },
] as const;

const MAX_CALENDAR_DAYS = 366 * 5;

export type FinishForecast =
  | { status: "done" }
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "short" }
  | {
      status: "planned";
      labDays: number;
      calendarDays: number;
      finishDate: string;
      usedOnLastDay: number;
      fullLastDay: number;
      weeklyMinutes: number;
    };

export function scheduleProblem(blocks: ScheduleBlock[]): string | null {
  const byDay = new Map<number, { start: number; end: number }[]>();

  for (const block of blocks) {
    if (block.weekday < 1 || block.weekday > 7) return "Choose a day of the week.";
    if (!block.start || !block.end) return "Each day you turn on needs a start and an end.";
    const start = toMinutes(block.start);
    const end = toMinutes(block.end);
    if (end <= start) return "The end time needs to be after the start time.";
    const list = byDay.get(block.weekday) ?? [];
    list.push({ start, end });
    byDay.set(block.weekday, list);
  }

  for (const list of byDay.values()) {
    list.sort((a, b) => a.start - b.start);
    for (let index = 1; index < list.length; index += 1) {
      if (list[index].start < list[index - 1].end) {
        return "These times overlap. A shift can't be in two places at once.";
      }
    }
  }

  return null;
}

export function weekdayMinutes(blocks: ScheduleBlock[], weekday: number): number | null {
  const dayBlocks = blocks.filter((block) => block.weekday === weekday);
  if (dayBlocks.length === 0) return 0;
  if (scheduleProblem(dayBlocks)) return null;
  return dayBlocks.reduce((sum, block) => sum + toMinutes(block.end) - toMinutes(block.start), 0);
}

export function finishForecast(
  loggedMinutes: number,
  schedule: ScheduleBlock[],
  today: string,
  loggedDates: ReadonlySet<string>,
): FinishForecast {
  if (loggedMinutes >= TARGET_MINUTES) return { status: "done" };
  if (scheduleProblem(schedule)) return { status: "invalid" };
  if (schedule.length === 0) return { status: "empty" };

  const minutesByWeekday = new Map<number, number>();
  let weeklyMinutes = 0;
  for (const day of WEEKDAYS) {
    const minutes = weekdayMinutes(schedule, day.weekday) ?? 0;
    if (minutes > 0) minutesByWeekday.set(day.weekday, minutes);
    weeklyMinutes += minutes;
  }
  if (weeklyMinutes <= 0) return { status: "empty" };

  let remaining = TARGET_MINUTES - Math.max(0, loggedMinutes);
  let cursor = parseISODate(today);
  let labDays = 0;
  let finishDate = today;
  let usedOnLastDay = 0;
  let fullLastDay = 0;

  for (let offset = 0; offset <= MAX_CALENDAR_DAYS; offset += 1) {
    const iso = formatISODate(cursor);
    const available = minutesByWeekday.get(isoWeekday(cursor)) ?? 0;
    if (available > 0 && !loggedDates.has(iso)) {
      const used = Math.min(remaining, available);
      remaining -= used;
      labDays += 1;
      finishDate = iso;
      usedOnLastDay = used;
      fullLastDay = available;
      if (remaining <= 0) {
        return {
          status: "planned",
          labDays,
          calendarDays: offset,
          finishDate,
          usedOnLastDay,
          fullLastDay,
          weeklyMinutes,
        };
      }
    }
    cursor = addDays(cursor, 1);
  }

  return { status: "short" };
}

export function planSummary(forecast: FinishForecast): string {
  if (forecast.status === "done") return "The 200 hours are done. No days left.";
  if (forecast.status === "empty") {
    return "Add the days you can attend. This shows how many lab days you need, and how many days from today until the internship is done.";
  }
  if (forecast.status === "invalid") return "Finish the times to see how many days are left.";
  if (forecast.status === "short") {
    return "These hours are too small to finish the internship in the next few years. Add more time.";
  }

  const lab =
    forecast.labDays === 1 ? "1 day in the lab" : `${forecast.labDays} days in the lab`;
  const partial =
    forecast.usedOnLastDay < forecast.fullLastDay
      ? ` The last day only needs ${formatDuration(forecast.usedOnLastDay)}.`
      : "";

  if (forecast.calendarDays === 0) {
    return `You need ${lab}, and you can finish today.${partial}`;
  }

  const after = forecast.calendarDays === 1 ? "1 day" : `${forecast.calendarDays} days`;
  return `You need ${lab}. That is ${after} from today, on ${formatDay(forecast.finishDate)}.${partial}`;
}

function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isoWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

import type { BlockDraft, DayDraft, DayLog } from "./types";

export const TARGET_HOURS = 200;
export const TARGET_MINUTES = TARGET_HOURS * 60;

export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function emptyDraft(): DayDraft {
  return {
    dayId: null,
    date: todayISO(),
    note: "",
    blocks: [{ start: "", end: "" }],
  };
}

export function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesBetween(start: string, end: string): number {
  return toMinutes(end) - toMinutes(start);
}

export function totalMinutes(blocks: BlockDraft[]): number {
  return blocks.reduce((sum, block) => sum + minutesBetween(block.start, block.end), 0);
}

export function dayMinutes(day: DayLog): number {
  return totalMinutes(
    day.sessions.map((session) => ({
      start: session.starts_at,
      end: session.ends_at,
    })),
  );
}

export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  if (safe === 0) return "0 hr";
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

export function formatClock(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDay(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function validateBlocks(blocks: BlockDraft[]): string | null {
  if (blocks.length === 0) return "Add at least one time.";

  const parsed: { start: number; end: number }[] = [];
  for (const block of blocks) {
    if (!block.start || !block.end) return "Each block needs a start and an end.";
    const start = toMinutes(block.start);
    const end = toMinutes(block.end);
    if (end <= start) return "The end time needs to be after the start time.";
    parsed.push({ start, end });
  }

  parsed.sort((a, b) => a.start - b.start);
  for (let index = 1; index < parsed.length; index += 1) {
    if (parsed[index].start < parsed[index - 1].end) {
      return "These times overlap. A shift can't be in two places at once.";
    }
  }

  return null;
}

export function encouragement(minutes: number): string {
  const hours = minutes / 60;
  if (hours <= 0) return "The lab coat is ready. Log your first day.";
  if (hours < 25) return "You're in the lab. Keep the hours coming.";
  if (hours < 50) return "A real start. The track is moving.";
  if (hours < 100) return "A quarter of the way. The rhythm is yours.";
  if (hours < 150) return "Halfway through Labib. That's a real stretch of work.";
  if (hours < 180) return "The finish line is in sight.";
  if (hours < 200) return "Almost there. A few more shifts.";
  return "200 hours. You finished the lab internship.";
}

export function progressPercent(minutes: number): number {
  return Math.min(100, (minutes / TARGET_MINUTES) * 100);
}

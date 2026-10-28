import { dayMinutes } from "./hours";
import type { DayLog } from "./types";

export type Achievement = {
  key: string;
  title: string;
  detail: string;
  locked: string;
};

type Stats = {
  dayCount: number;
  minutes: number;
  splitDay: boolean;
  hasNote: boolean;
};

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    key: "first-day",
    title: "First day",
    detail: "You logged your first lab day.",
    locked: "Log your first day.",
  },
  {
    key: "split-shift",
    title: "Split shift",
    detail: "Two blocks in one day, both counted.",
    locked: "Log two blocks on the same day.",
  },
  {
    key: "hours-10",
    title: "10 hours",
    detail: "The first ten hours are in.",
    locked: "Reach 10 hours.",
  },
  {
    key: "hours-25",
    title: "25 hours",
    detail: "Twenty-five hours of lab time.",
    locked: "Reach 25 hours.",
  },
  {
    key: "hours-50",
    title: "50 hours",
    detail: "A quarter of the internship is done.",
    locked: "Reach 50 hours.",
  },
  {
    key: "five-days",
    title: "Five days",
    detail: "Five different days in the lab.",
    locked: "Log five different days.",
  },
  {
    key: "first-note",
    title: "Note keeper",
    detail: "You left a note on a day.",
    locked: "Add a note to a day.",
  },
  {
    key: "hours-100",
    title: "Halfway",
    detail: "Halfway through Labib. That's a real stretch of work.",
    locked: "Reach 100 hours.",
  },
  {
    key: "hours-150",
    title: "150 hours",
    detail: "The finish line is getting close.",
    locked: "Reach 150 hours.",
  },
  {
    key: "hours-200",
    title: "200 hours",
    detail: "The internship hours are complete.",
    locked: "Finish all 200 hours.",
  },
];

function statsFor(days: DayLog[]): Stats {
  return {
    dayCount: days.length,
    minutes: days.reduce((sum, day) => sum + dayMinutes(day), 0),
    splitDay: days.some((day) => day.sessions.length >= 2),
    hasNote: days.some((day) => day.note.trim().length > 0),
  };
}

function isEarned(key: string, stats: Stats): boolean {
  switch (key) {
    case "first-day":
      return stats.dayCount >= 1;
    case "split-shift":
      return stats.splitDay;
    case "hours-10":
      return stats.minutes >= 10 * 60;
    case "hours-25":
      return stats.minutes >= 25 * 60;
    case "hours-50":
      return stats.minutes >= 50 * 60;
    case "five-days":
      return stats.dayCount >= 5;
    case "first-note":
      return stats.hasNote;
    case "hours-100":
      return stats.minutes >= 100 * 60;
    case "hours-150":
      return stats.minutes >= 150 * 60;
    case "hours-200":
      return stats.minutes >= 200 * 60;
    default:
      return false;
  }
}

export function earnedAchievements(days: DayLog[]): Achievement[] {
  const stats = statsFor(days);
  return ACHIEVEMENTS.filter((achievement) => isEarned(achievement.key, stats));
}

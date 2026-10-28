import { earnedAchievements, type Achievement } from "./achievements";
import { supabase } from "./supabase";
import type { BlockDraft, DayDraft, DayLog, SessionBlock } from "./types";

type SessionRow = {
  id: string;
  starts_at: string;
  ends_at: string;
};

type DayRow = {
  id: string;
  log_date: string;
  note: string;
  sessions: SessionRow[] | null;
};

function client() {
  if (!supabase) {
    throw new Error("The hours log isn't connected yet.");
  }
  return supabase;
}

function clock(value: string): string {
  return value.slice(0, 5);
}

function toDay(row: DayRow): DayLog {
  const sessions: SessionBlock[] = (row.sessions ?? [])
    .map((session) => ({
      id: session.id,
      starts_at: clock(session.starts_at),
      ends_at: clock(session.ends_at),
    }))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  return {
    id: row.id,
    log_date: row.log_date,
    note: row.note ?? "",
    sessions,
  };
}

export async function fetchDays(): Promise<DayLog[]> {
  const { data, error } = await client()
    .from("days")
    .select("id, log_date, note, sessions(id, starts_at, ends_at)")
    .order("log_date", { ascending: false });

  if (error) throw error;
  return (data as DayRow[]).map(toDay);
}

export async function saveDay(draft: DayDraft): Promise<void> {
  const blocks: BlockDraft[] = draft.blocks.map((block) => ({
    start: block.start,
    end: block.end,
  }));

  const { error } = await client().rpc("save_day", {
    target_id: draft.dayId,
    target_date: draft.date,
    target_note: draft.note.trim(),
    blocks,
  });

  if (error) throw error;
}

export async function deleteDay(dayId: string): Promise<void> {
  const { error } = await client().from("days").delete().eq("id", dayId);
  if (error) throw error;
}

export async function fetchAchievementKeys(): Promise<Set<string>> {
  const { data, error } = await client().from("achievements").select("achievement_key");
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.achievement_key as string));
}

export async function recordNewAchievements(days: DayLog[]): Promise<Achievement[]> {
  const earned = earnedAchievements(days);
  const existing = await fetchAchievementKeys();
  const fresh = earned.filter((achievement) => !existing.has(achievement.key));
  if (fresh.length === 0) return [];

  const { error } = await client()
    .from("achievements")
    .upsert(
      fresh.map((achievement) => ({ achievement_key: achievement.key })),
      { onConflict: "achievement_key", ignoreDuplicates: true },
    );

  if (error) throw error;
  return fresh;
}

function errorText(error: unknown): { code: string; message: string } {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message =
    typeof error === "object" && error && "message" in error ? String(error.message) : "";
  return { code, message };
}

export function saveErrorMessage(error: unknown): string {
  const { code, message } = errorText(error);
  if (code === "23505" || /duplicate key/i.test(message)) {
    return "That day is already logged. Edit it from the list.";
  }
  if (/overlap/i.test(message)) {
    return "These times overlap. A shift can't be in two places at once.";
  }
  if (message === "The hours log isn't connected yet.") return message;
  return "Couldn't save just now. Check the connection and try again.";
}

export function loadErrorMessage(error: unknown): string {
  const { message } = errorText(error);
  if (message === "The hours log isn't connected yet.") return message;
  return "Couldn't load the hours. Check the connection and try again.";
}

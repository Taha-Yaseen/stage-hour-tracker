import { useEffect, useMemo, useRef, useState } from "react";
import { Achievements } from "./components/Achievements";
import { DayList } from "./components/DayList";
import { LogForm } from "./components/LogForm";
import { ProgressTrack } from "./components/ProgressTrack";
import { earnedAchievements, type Achievement } from "./lib/achievements";
import {
  deleteDay,
  fetchDays,
  loadErrorMessage,
  recordNewAchievements,
  saveDay,
  saveErrorMessage,
} from "./lib/api";
import { dayMinutes, emptyDraft, validateBlocks } from "./lib/hours";
import { isConfigured } from "./lib/supabase";
import type { DayDraft, DayLog } from "./lib/types";

export function App() {
  const [days, setDays] = useState<DayLog[]>([]);
  const [draft, setDraft] = useState<DayDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Achievement[]>([]);
  const formRef = useRef<HTMLDivElement>(null);
  const celebrationRef = useRef<HTMLDivElement>(null);

  const minutes = useMemo(
    () => days.reduce((sum, day) => sum + dayMinutes(day), 0),
    [days],
  );
  const earnedKeys = useMemo(
    () => new Set(earnedAchievements(days).map((achievement) => achievement.key)),
    [days],
  );

  useEffect(() => {
    if (!isConfigured()) {
      setLoadError("The hours log isn't connected yet.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const nextDays = await fetchDays();
        if (cancelled) return;
        setDays(nextDays);
        const fresh = await recordNewAchievements(nextDays);
        if (cancelled) return;
        if (fresh.length > 0) setCelebration(fresh);
      } catch (error) {
        if (!cancelled) setLoadError(loadErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (celebration.length === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    celebrationRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, [celebration]);

  async function handleSave() {
    const blockError = validateBlocks(draft.blocks);
    if (!draft.date) {
      setFormError("Choose the day.");
      return;
    }
    if (blockError) {
      setFormError(blockError);
      return;
    }
    const clash = days.some((day) => day.log_date === draft.date && day.id !== draft.dayId);
    if (clash) {
      setFormError("That day is already logged. Edit it from the list.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await saveDay(draft);
      const nextDays = await fetchDays();
      setDays(nextDays);
      const fresh = await recordNewAchievements(nextDays);
      if (fresh.length > 0) setCelebration(fresh);
      setDraft(emptyDraft());
      setConfirmDeleteId(null);
    } catch (error) {
      setFormError(saveErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(day: DayLog) {
    setDraft({
      dayId: day.id,
      date: day.log_date,
      note: day.note,
      blocks: day.sessions.map((session) => ({
        start: session.starts_at,
        end: session.ends_at,
      })),
    });
    setFormError(null);
    setConfirmDeleteId(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    formRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  async function handleDelete(dayId: string) {
    setDeletingId(dayId);
    setLoadError(null);
    try {
      await deleteDay(dayId);
      const nextDays = await fetchDays();
      setDays(nextDays);
      if (draft.dayId === dayId) setDraft(emptyDraft());
      setConfirmDeleteId(null);
    } catch (error) {
      setLoadError(loadErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main>
      <header className="masthead">
        <p className="eyebrow">Labib Hospital · Lab</p>
        <h1>Stage Hour Tracker</h1>
      </header>

      {loadError ? (
        <p className="banner" role="alert">
          {loadError}
        </p>
      ) : null}

      {celebration.length > 0 ? (
        <div className="celebration" role="status" ref={celebrationRef}>
          <p className="celebration-kicker">You unlocked</p>
          <ul>
            {celebration.map((achievement) => (
              <li key={achievement.key}>
                <strong>{achievement.title}</strong>
                <p>{achievement.detail}</p>
              </li>
            ))}
          </ul>
          <button className="secondary" type="button" onClick={() => setCelebration([])}>
            Keep going
          </button>
        </div>
      ) : null}

      {loading ? <p className="hint page-hint">Loading your hours…</p> : <ProgressTrack minutes={minutes} />}

      <div ref={formRef}>
        <LogForm
          draft={draft}
          saving={saving}
          error={formError}
          onChange={setDraft}
          onSubmit={() => void handleSave()}
          onCancel={() => {
            setDraft(emptyDraft());
            setFormError(null);
          }}
        />
      </div>

      <Achievements earnedKeys={earnedKeys} />
      <DayList
        days={days}
        editingId={draft.dayId}
        confirmDeleteId={confirmDeleteId}
        deletingId={deletingId}
        onEdit={handleEdit}
        onAskDelete={setConfirmDeleteId}
        onCancelDelete={() => setConfirmDeleteId(null)}
        onConfirmDelete={(id) => void handleDelete(id)}
      />
    </main>
  );
}

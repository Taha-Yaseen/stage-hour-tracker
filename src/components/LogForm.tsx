import type { FormEvent } from "react";
import { formatDuration, totalMinutes, validateBlocks } from "../lib/hours";
import type { DayDraft } from "../lib/types";

type LogFormProps = {
  draft: DayDraft;
  saving: boolean;
  error: string | null;
  onChange: (draft: DayDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function LogForm({ draft, saving, error, onChange, onSubmit, onCancel }: LogFormProps) {
  const editing = draft.dayId !== null;
  const blockError = validateBlocks(draft.blocks);
  const preview = blockError ? null : formatDuration(totalMinutes(draft.blocks));

  function updateBlock(index: number, field: "start" | "end", value: string) {
    const blocks = draft.blocks.map((block, blockIndex) =>
      blockIndex === index ? { ...block, [field]: value } : block,
    );
    onChange({ ...draft, blocks });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="card" onSubmit={handleSubmit} aria-labelledby="log-heading">
      <h2 id="log-heading">{editing ? "Edit this day" : "Log a day"}</h2>
      <p className="hint">Came back after a break? Add another time on the same day.</p>

      <label className="field" htmlFor="log-date">
        Date
        <span className="control">
          <input
            id="log-date"
            type="date"
            value={draft.date}
            onChange={(event) => onChange({ ...draft, date: event.target.value })}
            required
          />
        </span>
      </label>

      <fieldset className="blocks">
        <legend>Time in the lab</legend>
        {draft.blocks.map((block, index) => (
          <div className="block-row" key={index}>
            <label htmlFor={`start-${index}`}>
              Start
              <span className="control">
                <input
                  id={`start-${index}`}
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
            <label htmlFor={`end-${index}`}>
              End
              <span className="control">
                <input
                  id={`end-${index}`}
                  type="time"
                  value={block.end}
                  onChange={(event) => updateBlock(index, "end", event.target.value)}
                  required
                />
              </span>
            </label>
            {draft.blocks.length > 1 ? (
              <button
                className="text-button"
                type="button"
                onClick={() =>
                  onChange({
                    ...draft,
                    blocks: draft.blocks.filter((_, blockIndex) => blockIndex !== index),
                  })
                }
              >
                Remove this time
              </button>
            ) : null}
          </div>
        ))}
        <button
          className="text-button add-time"
          type="button"
          onClick={() => onChange({ ...draft, blocks: [...draft.blocks, { start: "", end: "" }] })}
        >
          Add another time
        </button>
      </fieldset>

      <label className="field" htmlFor="log-note">
        Note
        <textarea
          id="log-note"
          rows={3}
          value={draft.note}
          placeholder="Anything you want to remember about this day"
          onChange={(event) => onChange({ ...draft, note: event.target.value })}
        />
      </label>

      {preview ? <p className="preview">This day: {preview}</p> : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <button className="primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : editing ? "Save changes" : "Save this day"}
        </button>
        {editing ? (
          <button className="secondary" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export type SessionBlock = {
  id: string;
  starts_at: string;
  ends_at: string;
};

export type DayLog = {
  id: string;
  log_date: string;
  note: string;
  sessions: SessionBlock[];
};

export type BlockDraft = {
  start: string;
  end: string;
};

export type DayDraft = {
  dayId: string | null;
  date: string;
  note: string;
  blocks: BlockDraft[];
};

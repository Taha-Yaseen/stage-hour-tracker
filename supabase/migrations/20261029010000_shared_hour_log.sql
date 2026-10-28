create table public.days (
  id uuid primary key default gen_random_uuid(),
  log_date date not null unique,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days (id) on delete cascade,
  starts_at time not null,
  ends_at time not null,
  constraint sessions_end_after_start check (ends_at > starts_at)
);

create index sessions_day_id_idx on public.sessions (day_id);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  achievement_key text not null unique,
  unlocked_at timestamptz not null default now()
);

alter table public.days enable row level security;
alter table public.sessions enable row level security;
alter table public.achievements enable row level security;

create policy days_select on public.days for select to anon using (true);
create policy days_insert on public.days for insert to anon with check (true);
create policy days_update on public.days for update to anon using (true) with check (true);
create policy days_delete on public.days for delete to anon using (true);

create policy sessions_select on public.sessions for select to anon using (true);
create policy sessions_insert on public.sessions for insert to anon with check (true);
create policy sessions_update on public.sessions for update to anon using (true) with check (true);
create policy sessions_delete on public.sessions for delete to anon using (true);

create policy achievements_select on public.achievements for select to anon using (true);
create policy achievements_insert on public.achievements for insert to anon with check (true);
create policy achievements_update on public.achievements for update to anon using (true) with check (true);

revoke all on table public.days from public, anon, authenticated;
revoke all on table public.sessions from public, anon, authenticated;
revoke all on table public.achievements from public, anon, authenticated;

grant select, insert, update, delete on table public.days to anon;
grant select, insert, update, delete on table public.sessions to anon;
grant select, insert, update on table public.achievements to anon;

create or replace function public.save_day(
  target_id uuid,
  target_date date,
  target_note text,
  blocks jsonb
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  saved_id uuid;
begin
  if blocks is null or jsonb_typeof(blocks) <> 'array' or jsonb_array_length(blocks) < 1 then
    raise exception 'at least one block';
  end if;

  if target_id is null then
    insert into public.days (log_date, note)
    values (target_date, coalesce(target_note, ''))
    returning id into saved_id;
  else
    update public.days
    set log_date = target_date,
        note = coalesce(target_note, '')
    where id = target_id
    returning id into saved_id;

    if saved_id is null then
      raise exception 'day not found';
    end if;

    delete from public.sessions where day_id = saved_id;
  end if;

  insert into public.sessions (day_id, starts_at, ends_at)
  select
    saved_id,
    (item->>'start')::time,
    (item->>'end')::time
  from jsonb_array_elements(blocks) as item;

  if exists (
    select 1
    from public.sessions as a
    join public.sessions as b
      on a.day_id = b.day_id
     and a.id <> b.id
     and a.starts_at < b.ends_at
     and b.starts_at < a.ends_at
    where a.day_id = saved_id
  ) then
    raise exception 'overlapping sessions';
  end if;

  return saved_id;
end;
$$;

revoke all on function public.save_day(uuid, date, text, jsonb) from public, anon, authenticated;
grant execute on function public.save_day(uuid, date, text, jsonb) to anon;

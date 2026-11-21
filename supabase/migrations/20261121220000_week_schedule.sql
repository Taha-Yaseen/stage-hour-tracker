create table public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 1 and 7),
  starts_at time not null,
  ends_at time not null,
  constraint schedule_blocks_end_after_start check (ends_at > starts_at)
);

create index schedule_blocks_weekday_idx on public.schedule_blocks (weekday, starts_at);

alter table public.schedule_blocks enable row level security;

create policy schedule_blocks_select on public.schedule_blocks for select to anon using (true);
create policy schedule_blocks_insert on public.schedule_blocks for insert to anon with check (true);
create policy schedule_blocks_update on public.schedule_blocks for update to anon using (true) with check (true);
create policy schedule_blocks_delete on public.schedule_blocks for delete to anon using (true);

revoke all on table public.schedule_blocks from public, anon, authenticated;
grant select, insert, update, delete on table public.schedule_blocks to anon;

create or replace function public.save_schedule(blocks jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if blocks is null or jsonb_typeof(blocks) <> 'array' then
    raise exception 'schedule blocks must be an array';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(blocks) as item
    where jsonb_typeof(item) <> 'object'
       or item->>'weekday' is null
       or item->>'start' is null
       or item->>'end' is null
  ) then
    raise exception 'each block needs a weekday, start, and end';
  end if;

  lock table public.schedule_blocks in exclusive mode;

  delete from public.schedule_blocks where id is not null;

  insert into public.schedule_blocks (weekday, starts_at, ends_at)
  select
    (item->>'weekday')::smallint,
    (item->>'start')::time,
    (item->>'end')::time
  from jsonb_array_elements(blocks) as item;

  if exists (
    select 1
    from public.schedule_blocks as a
    join public.schedule_blocks as b
      on a.weekday = b.weekday
     and a.id <> b.id
     and a.starts_at < b.ends_at
     and b.starts_at < a.ends_at
  ) then
    raise exception 'overlapping sessions';
  end if;
end;
$$;

revoke all on function public.save_schedule(jsonb) from public, anon, authenticated;
grant execute on function public.save_schedule(jsonb) to anon;

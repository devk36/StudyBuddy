-- =====================================================================
--  Study Paws — shared study rooms (Supabase)
--  Run this whole file once in: Supabase Dashboard → SQL Editor → New query
--  It is idempotent: safe to run again after updates.
--
--  Security model
--  • Everyone signs in anonymously (no email, no personal data).
--  • Rooms are private: you can only read a room after joining it with its
--    unguessable invite code (10 chars from a 31-char alphabet ≈ 8×10^14).
--  • Tables are read-only to clients; every write goes through the
--    SECURITY DEFINER functions below, which validate membership + input.
--  • Realtime channels are PRIVATE ("room:<uuid>"); only members may
--    send/receive broadcasts and presence (policies on realtime.messages).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- tables ----------------------------------------------------

create table if not exists public.rooms (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique check (code ~ '^[a-z0-9]{8,16}$'),
  name                text not null default 'Our Little Study Corner' check (char_length(name) between 1 and 60),
  timer               jsonb not null default '{}'::jsonb,
  goals               jsonb not null default '[]'::jsonb,
  daily_goal_minutes  int  not null default 120 check (daily_goal_minutes between 10 and 1440),
  version             int  not null default 0,
  created_by          uuid not null references auth.users(id) on delete cascade,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id       uuid not null references public.rooms(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 30),
  pet           text not null default 'cat' check (pet in ('cat','dog','bunny')),
  stats         jsonb not null default '{}'::jsonb,
  joined_at     timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists room_members_user_idx on public.room_members(user_id);
create index if not exists rooms_created_by_idx on public.rooms(created_by);

alter table public.rooms        enable row level security;
alter table public.room_members enable row level security;
alter table public.room_members replica identity full;

-- Clients may only SELECT; all writes go through the functions below.
revoke insert, update, delete, truncate on public.rooms, public.room_members from anon, authenticated;
grant select on public.rooms, public.room_members to authenticated;
revoke all on public.rooms, public.room_members from anon;

-- ---------- helpers ---------------------------------------------------

create or replace function public.is_room_member(rid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.room_members where room_id = rid and user_id = auth.uid());
$$;

create or replace function public.valid_timer(t jsonb)
returns boolean
language sql immutable
set search_path = public
as $$
  select jsonb_typeof(t) = 'object'
     and pg_column_size(t) < 2048
     and (t->>'mode')   in ('study','short','long')
     and (t->>'status') in ('idle','running','paused')
     and jsonb_typeof(t->'remainingMs') = 'number'
     and jsonb_typeof(t->'durationMs')  = 'number'
     and (t->>'durationMs')::numeric between 0 and 3 * 60 * 60 * 1000
     and (t->'d' is null or (
            jsonb_typeof(t->'d') = 'object'
        and coalesce((t->'d'->>'study')::numeric, 25) between 1 and 180
        and coalesce((t->'d'->>'short')::numeric, 5)  between 1 and 60
        and coalesce((t->'d'->>'long')::numeric, 15)  between 1 and 90
        and coalesce((t->'d'->>'longEvery')::numeric, 4) between 2 and 12));
$$;

create or replace function public.clean_name(n text)
returns text
language sql immutable
set search_path = public
as $$
  select left(nullif(btrim(regexp_replace(coalesce(n, ''), '[[:cntrl:]]', '', 'g')), ''), 30);
$$;

-- ---------- RPCs ------------------------------------------------------

-- Server clock, used by clients to correct device clock skew.
create or replace function public.server_now()
returns double precision
language sql stable
as $$ select extract(epoch from clock_timestamp()) * 1000; $$;

create or replace function public.create_room(p_name text, p_display_name text, p_pet text, p_timer jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  r public.rooms;
  c text;
  i int;
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if (select count(*) from public.rooms where created_by = auth.uid() and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'too many rooms created, try again later';
  end if;
  if not public.valid_timer(p_timer) then raise exception 'invalid timer'; end if;
  if p_pet not in ('cat','dog','bunny') then p_pet := 'cat'; end if;

  loop
    c := '';
    for i in 1..10 loop
      c := c || substr(alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % 31), 1);
    end loop;
    exit when not exists (select 1 from public.rooms where code = c);
  end loop;

  insert into public.rooms (code, name, timer, created_by)
  values (c, coalesce(left(nullif(btrim(p_name), ''), 60), 'Our Little Study Corner'), p_timer, auth.uid())
  returning * into r;

  insert into public.room_members (room_id, user_id, display_name, pet)
  values (r.id, auth.uid(), coalesce(public.clean_name(p_display_name), 'Study buddy'), p_pet);

  return to_jsonb(r);
end;
$$;

create or replace function public.join_room(p_code text, p_display_name text, p_pet text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.rooms;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into r from public.rooms where code = lower(btrim(p_code));
  if not found then raise exception 'room not found'; end if;
  if p_pet not in ('cat','dog','bunny') then p_pet := 'cat'; end if;

  if not exists (select 1 from public.room_members where room_id = r.id and user_id = auth.uid())
     and (select count(*) from public.room_members where room_id = r.id) >= 6 then
    raise exception 'room is full';
  end if;

  insert into public.room_members (room_id, user_id, display_name, pet)
  values (r.id, auth.uid(), coalesce(public.clean_name(p_display_name), 'Study buddy'), p_pet)
  on conflict (room_id, user_id)
  do update set display_name = excluded.display_name, pet = excluded.pet, last_seen = now();

  return to_jsonb(r);
end;
$$;

create or replace function public.leave_room(p_room uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  delete from public.room_members where room_id = p_room and user_id = auth.uid();
  delete from public.rooms r where r.id = p_room
    and not exists (select 1 from public.room_members m where m.room_id = r.id);
end;
$$;

-- Optimistic concurrency: only applies if p_expected matches the current version.
-- Returns the updated room, or NULL when someone else changed it first.
create or replace function public.update_room_timer(p_room uuid, p_expected int, p_timer jsonb)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.rooms;
begin
  if not public.is_room_member(p_room) then raise exception 'not a member of this room'; end if;
  if not public.valid_timer(p_timer) then raise exception 'invalid timer'; end if;
  update public.rooms
     set timer = p_timer, version = version + 1, updated_at = now()
   where id = p_room and version = p_expected
  returning * into r;
  if not found then return null; end if;
  return to_jsonb(r);
end;
$$;

create or replace function public.add_room_goal(p_room uuid, p_text text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.rooms;
  t text := left(btrim(regexp_replace(coalesce(p_text, ''), '[[:cntrl:]]', '', 'g')), 120);
  who text;
begin
  if not public.is_room_member(p_room) then raise exception 'not a member of this room'; end if;
  if t = '' then raise exception 'empty goal'; end if;
  select display_name into who from public.room_members where room_id = p_room and user_id = auth.uid();
  update public.rooms
     set goals = goals || jsonb_build_array(jsonb_build_object(
           'id', gen_random_uuid()::text, 'text', t, 'done', false, 'by', who)),
         version = version + 1, updated_at = now()
   where id = p_room and jsonb_array_length(goals) < 40
  returning * into r;
  if not found then raise exception 'too many goals'; end if;
  return to_jsonb(r);
end;
$$;

create or replace function public.toggle_room_goal(p_room uuid, p_goal text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.rooms;
begin
  if not public.is_room_member(p_room) then raise exception 'not a member of this room'; end if;
  update public.rooms
     set goals = coalesce((
           select jsonb_agg(case when g->>'id' = p_goal
                                 then jsonb_set(g, '{done}', to_jsonb(not coalesce((g->>'done')::boolean, false)))
                                 else g end order by ord)
             from jsonb_array_elements(goals) with ordinality as e(g, ord)), '[]'::jsonb),
         version = version + 1, updated_at = now()
   where id = p_room
  returning * into r;
  return to_jsonb(r);
end;
$$;

create or replace function public.remove_room_goal(p_room uuid, p_goal text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.rooms;
begin
  if not public.is_room_member(p_room) then raise exception 'not a member of this room'; end if;
  update public.rooms
     set goals = coalesce((
           select jsonb_agg(g order by ord)
             from jsonb_array_elements(goals) with ordinality as e(g, ord)
            where g->>'id' <> p_goal), '[]'::jsonb),
         version = version + 1, updated_at = now()
   where id = p_room
  returning * into r;
  return to_jsonb(r);
end;
$$;

create or replace function public.set_room_daily_goal(p_room uuid, p_minutes int)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.rooms;
begin
  if not public.is_room_member(p_room) then raise exception 'not a member of this room'; end if;
  update public.rooms
     set daily_goal_minutes = greatest(10, least(1440, p_minutes)),
         version = version + 1, updated_at = now()
   where id = p_room
  returning * into r;
  return to_jsonb(r);
end;
$$;

create or replace function public.update_my_member(p_room uuid, p_display_name text, p_pet text, p_stats jsonb)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if jsonb_typeof(p_stats) <> 'object' or pg_column_size(p_stats) > 1024 then raise exception 'invalid stats'; end if;
  update public.room_members
     set display_name = coalesce(public.clean_name(p_display_name), display_name),
         pet = case when p_pet in ('cat','dog','bunny') then p_pet else pet end,
         stats = p_stats,
         last_seen = now()
   where room_id = p_room and user_id = auth.uid();
end;
$$;

-- Lock down function execution to signed-in (incl. anonymous) users.
revoke execute on function
  public.create_room(text, text, text, jsonb),
  public.join_room(text, text, text),
  public.leave_room(uuid),
  public.update_room_timer(uuid, int, jsonb),
  public.add_room_goal(uuid, text),
  public.toggle_room_goal(uuid, text),
  public.remove_room_goal(uuid, text),
  public.set_room_daily_goal(uuid, int),
  public.update_my_member(uuid, text, text, jsonb),
  public.is_room_member(uuid),
  public.server_now()
from public, anon;

grant execute on function
  public.create_room(text, text, text, jsonb),
  public.join_room(text, text, text),
  public.leave_room(uuid),
  public.update_room_timer(uuid, int, jsonb),
  public.add_room_goal(uuid, text),
  public.toggle_room_goal(uuid, text),
  public.remove_room_goal(uuid, text),
  public.set_room_daily_goal(uuid, int),
  public.update_my_member(uuid, text, text, jsonb),
  public.is_room_member(uuid),
  public.server_now()
to authenticated;

-- ---------- row level security (read access) ---------------------------

drop policy if exists "members read their rooms" on public.rooms;
create policy "members read their rooms" on public.rooms
  for select to authenticated
  using (public.is_room_member(id));

drop policy if exists "members read roommates" on public.room_members;
create policy "members read roommates" on public.room_members
  for select to authenticated
  using (public.is_room_member(room_id));

-- ---------- realtime ---------------------------------------------------

-- Postgres change events for the two tables (filtered by the RLS above).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms') then
    alter publication supabase_realtime add table public.rooms;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_members') then
    alter publication supabase_realtime add table public.room_members;
  end if;
end $$;

-- Private channel authorization: topic "room:<room uuid>", members only.
drop policy if exists "study paws members receive" on realtime.messages;
create policy "study paws members receive" on realtime.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.room_members m
       where m.user_id = auth.uid()
         and realtime.topic() = 'room:' || m.room_id::text
    )
  );

drop policy if exists "study paws members send" on realtime.messages;
create policy "study paws members send" on realtime.messages
  for insert to authenticated
  with check (
    exists (
      select 1 from public.room_members m
       where m.user_id = auth.uid()
         and realtime.topic() = 'room:' || m.room_id::text
    )
  );

-- ---------- optional housekeeping ---------------------------------------
-- Delete rooms nobody has touched for 60 days. Enable the pg_cron extension
-- (Database → Extensions) and uncomment:
--
-- select cron.schedule('study-paws-cleanup', '0 4 * * *',
--   $$ delete from public.rooms where updated_at < now() - interval '60 days' $$);

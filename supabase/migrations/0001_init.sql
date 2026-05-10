-- =============================================================================
-- atavola — full schema (consolidated)
-- =============================================================================
-- Apply once on a fresh Supabase project. Idempotent — re-running is safe.
--
-- Includes everything that earlier 0001-0004 migrations did, plus:
--   • saved_meals.user_id is nullable + ON DELETE SET NULL — when an account
--     is deleted, their meals stay in the DB as an orphaned recipe corpus
--     (invisible to anyone, but preserved as long-term reference data).
--   • Sessions still cascade-delete with their host (volatile by nature).
--   • service_status table + record_service_outcome() RPC for the landing
--     page status indicators (last-known outcome per service).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- pg_cron is needed for the daily expired-session cleanup. On Supabase free
-- tier, enable under Database → Extensions if `create extension` raises.
do $$ begin
    create extension if not exists pg_cron;
exception when others then
    raise notice 'pg_cron not available — cleanup cron will be skipped: %', sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
    create type session_status as enum ('generating', 'voting');
exception when duplicate_object then null; end $$;

do $$ begin
    create type vote_value as enum ('yes', 'no');
exception when duplicate_object then null; end $$;

do $$ begin
    create type service_outcome as enum ('ok', 'rate_limited', 'error');
exception when duplicate_object then null; end $$;

do $$ begin
    create type event_type as enum ('visit', 'login', 'new_user', 'meal_generated', 'meal_saved');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- ---------------------------------------------------------------------------
-- Email lives on `auth.users` (always fresh, source of truth). We deliberately
-- do *not* mirror it here: getUserFromAccessToken reads from auth directly,
-- so a denormalised copy on profiles would only be a stale-data trap. Audit
-- 2026-05-07 finding L-DEEP-3.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

-- Drop the legacy email column on existing DBs. New deployments never had
-- it. Idempotent: drop-if-exists is a no-op when already dropped.
alter table public.profiles drop column if exists email;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id)
    values (new.id)
    on conflict (id) do nothing;

    -- Phase B: emit a 'new_user' tracking event + bump the lifetime counter
    -- so the weekly digest sees this signup. Tables defined further down.
    insert into public.events (type, user_id) values ('new_user', new.id);
    update public.aggregated_stats
    set total_count = total_count + 1, updated_at = now()
    where type = 'new_user';

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- saved_meals — "My Food", per-user persistent collection
-- ---------------------------------------------------------------------------
-- user_id is nullable: when an account is deleted, ON DELETE SET NULL
-- preserves the meal as an orphaned record. Lists filter by user_id, so
-- orphaned rows are invisible to users but available as a reference corpus.
-- ---------------------------------------------------------------------------
create table if not exists public.saved_meals (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete set null,
    title text not null,
    description text not null,
    image_url text,
    ingredients jsonb not null default '[]'::jsonb,
    instructions text[] not null default '{}',
    position integer not null default 0,
    created_at timestamptz not null default now(),
    unique (user_id, title)
);

create index if not exists saved_meals_user_position_idx
    on public.saved_meals (user_id, position);

-- ---------------------------------------------------------------------------
-- sessions — host's vote rooms. Cascade-deletes on host removal.
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
    id uuid primary key default uuid_generate_v4(),
    host_id uuid not null references public.profiles(id) on delete cascade,
    vibe text not null,
    headcount integer not null check (headcount between 2 and 20),
    dietary text[] not null default '{}',
    share_token text not null unique default encode(gen_random_bytes(16), 'hex'),
    status session_status not null default 'generating',
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists sessions_host_id_idx on public.sessions (host_id);
create index if not exists sessions_share_token_idx on public.sessions (share_token);

-- ---------------------------------------------------------------------------
-- session_meals — the cards shown for a session
-- ---------------------------------------------------------------------------
create table if not exists public.session_meals (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid not null references public.sessions(id) on delete cascade,
    source_saved_meal_id uuid references public.saved_meals(id) on delete set null,
    title text not null,
    description text not null,
    image_url text,
    ingredients jsonb not null default '[]'::jsonb,
    instructions text[] not null default '{}',
    position integer not null default 0,
    yes_count integer not null default 0,
    no_count integer not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists session_meals_session_idx
    on public.session_meals (session_id, position);

-- ---------------------------------------------------------------------------
-- guests — one row per swiper, anon or authed
-- ---------------------------------------------------------------------------
create table if not exists public.guests (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid not null references public.sessions(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete set null,
    guest_token text not null unique default encode(gen_random_bytes(16), 'hex'),
    created_at timestamptz not null default now()
);

create index if not exists guests_session_idx on public.guests (session_id);
create index if not exists guests_token_idx on public.guests (guest_token);

-- ---------------------------------------------------------------------------
-- votes — one row per (guest, meal); immutable
-- ---------------------------------------------------------------------------
create table if not exists public.votes (
    guest_id uuid not null references public.guests(id) on delete cascade,
    session_meal_id uuid not null references public.session_meals(id) on delete cascade,
    value vote_value not null,
    created_at timestamptz not null default now(),
    primary key (guest_id, session_meal_id)
);

create index if not exists votes_session_meal_idx on public.votes (session_meal_id);

-- ---------------------------------------------------------------------------
-- rate_log + check_rate(actor, scope, max, window) — endpoint throttling
-- ---------------------------------------------------------------------------
create table if not exists public.rate_log (
    actor text not null,
    scope text not null,
    ts timestamptz not null default now()
);

create index if not exists rate_log_lookup_idx
    on public.rate_log (actor, scope, ts desc);
create index if not exists rate_log_cleanup_idx
    on public.rate_log (ts);

alter table public.rate_log enable row level security;

create or replace function public.check_rate(
    p_actor text,
    p_scope text,
    p_max int,
    p_window_secs int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    v_count int;
begin
    -- Probabilistic cleanup: ~1% of calls bin rows older than 2h.
    if random() < 0.01 then
        delete from public.rate_log where ts < now() - interval '2 hours';
    end if;

    select count(*) into v_count
    from public.rate_log
    where actor = p_actor
      and scope = p_scope
      and ts > now() - (p_window_secs * interval '1 second');

    if v_count >= p_max then
        return false;
    end if;

    insert into public.rate_log (actor, scope) values (p_actor, p_scope);
    return true;
end;
$$;

revoke all on function public.check_rate(text, text, int, int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- service_status — last-observed outcome per probe-able service
-- ---------------------------------------------------------------------------
-- One row per service. Backend services upsert on every relevant call so the
-- landing page indicator reflects the most recent real user attempt.
-- ---------------------------------------------------------------------------
create table if not exists public.service_status (
    service text primary key,
    outcome service_outcome not null,
    message text,
    last_attempt_at timestamptz not null default now()
);

alter table public.service_status enable row level security;

drop policy if exists "service_status public read" on public.service_status;
create policy "service_status public read"
    on public.service_status for select using (true);

create or replace function public.record_service_outcome(
    p_service text,
    p_outcome service_outcome,
    p_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.service_status (service, outcome, message, last_attempt_at)
    values (p_service, p_outcome, p_message, now())
    on conflict (service) do update set
        outcome = excluded.outcome,
        message = excluded.message,
        last_attempt_at = excluded.last_attempt_at;
end;
$$;

revoke all on function public.record_service_outcome(text, service_outcome, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Phase B — anonymous events + aggregated counters + error log
-- ---------------------------------------------------------------------------
-- `events` is the high-cardinality log used to compute "this week" / "last
-- 30 days" counters. After every weekly digest send we cleanup_after_digest()
-- prunes events older than 30 days so the table stays bounded.
--
-- `aggregated_stats` is the lifetime counter ("total"). Survives cleanup so
-- the digest's "total" column doesn't reset every month.
--
-- `error_log` collects hard failures from the AI / imagegen rotators and
-- the API error scaffold. Fully cleared after each digest.
-- ---------------------------------------------------------------------------
create table if not exists public.events (
    id uuid primary key default uuid_generate_v4(),
    type event_type not null,
    fingerprint text,
    user_id uuid references public.profiles(id) on delete set null,
    metadata jsonb,
    ts timestamptz not null default now()
);

create index if not exists events_type_ts_idx on public.events (type, ts desc);

create table if not exists public.aggregated_stats (
    type event_type primary key,
    total_count bigint not null default 0,
    updated_at timestamptz not null default now()
);

-- Pre-populate so update-counter calls are simple and don't need upserts.
insert into public.aggregated_stats (type, total_count) values
    ('visit', 0),
    ('login', 0),
    ('new_user', 0),
    ('meal_generated', 0),
    ('meal_saved', 0)
on conflict (type) do nothing;

create table if not exists public.error_log (
    id uuid primary key default uuid_generate_v4(),
    source text not null,
    message text not null,
    ts timestamptz not null default now()
);

create index if not exists error_log_ts_idx on public.error_log (ts desc);

alter table public.events enable row level security;
alter table public.aggregated_stats enable row level security;
alter table public.error_log enable row level security;
-- No policies = service-role only. Frontend goes through SECURITY DEFINER
-- RPCs that don't require RLS access.

create or replace function public.record_event(
    p_type event_type,
    p_fingerprint text default null,
    p_user_id uuid default null,
    p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.events (type, fingerprint, user_id, metadata)
    values (p_type, p_fingerprint, p_user_id, p_metadata);
    update public.aggregated_stats
    set total_count = total_count + 1, updated_at = now()
    where type = p_type;
end;
$$;

revoke all on function public.record_event(event_type, text, uuid, jsonb) from public, anon, authenticated;

create or replace function public.record_error(
    p_source text,
    p_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Cap message length so a misbehaving error doesn't bloat the table.
    insert into public.error_log (source, message)
    values (p_source, left(p_message, 1000));
end;
$$;

revoke all on function public.record_error(text, text) from public, anon, authenticated;

create or replace function public.get_weekly_digest_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_result jsonb;
begin
    v_result := jsonb_build_object(
        'services', coalesce(
            (
                select jsonb_agg(jsonb_build_object(
                    'service', service,
                    'outcome', outcome,
                    'last_attempt_at', last_attempt_at
                ))
                from public.service_status
            ),
            '[]'::jsonb
        ),
        'errors_count', (select count(*) from public.error_log),
        'errors', coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'source', source,
                        'message', message,
                        'ts', ts
                    )
                    order by ts desc
                )
                from public.error_log
            ),
            '[]'::jsonb
        ),
        'stats', (
            select jsonb_object_agg(t.type::text, jsonb_build_object(
                'week', (
                    select count(*) from public.events e
                    where e.type = t.type and e.ts > now() - interval '7 days'
                ),
                'month', (
                    select count(*) from public.events e
                    where e.type = t.type and e.ts > now() - interval '30 days'
                ),
                'total', t.total_count
            ))
            from public.aggregated_stats t
        )
    );
    return v_result;
end;
$$;

revoke all on function public.get_weekly_digest_data() from public, anon, authenticated;

create or replace function public.cleanup_after_digest()
returns void
language sql
security definer
set search_path = public
as $$
    -- Keep last 30 days of events so next week's "30d" column is correct.
    delete from public.events where ts < now() - interval '30 days';
    -- Errors are operational; full clear once they've been reported.
    delete from public.error_log;
$$;

revoke all on function public.cleanup_after_digest() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- cast_vote(guest_token, meal_id, value) — atomic vote + counter increment
-- ---------------------------------------------------------------------------
create or replace function public.cast_vote(
    p_guest_token text,
    p_meal_id uuid,
    p_value vote_value
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_guest_id uuid;
    v_session_id uuid;
    v_meal_session_id uuid;
    v_status session_status;
    v_expires timestamptz;
begin
    select id, session_id into v_guest_id, v_session_id
    from public.guests
    where guest_token = p_guest_token;
    if v_guest_id is null then
        raise exception 'invalid_guest_token';
    end if;

    select status, expires_at into v_status, v_expires
    from public.sessions
    where id = v_session_id;
    if v_expires is null then
        raise exception 'session_not_found';
    end if;
    if v_expires < now() then
        raise exception 'session_expired';
    end if;
    if v_status <> 'voting' then
        raise exception 'session_not_open';
    end if;

    select session_id into v_meal_session_id
    from public.session_meals
    where id = p_meal_id;
    if v_meal_session_id is null or v_meal_session_id <> v_session_id then
        raise exception 'meal_not_in_session';
    end if;

    insert into public.votes (guest_id, session_meal_id, value)
    values (v_guest_id, p_meal_id, p_value)
    on conflict do nothing;

    if found then
        if p_value = 'yes' then
            update public.session_meals
            set yes_count = yes_count + 1
            where id = p_meal_id;
        else
            update public.session_meals
            set no_count = no_count + 1
            where id = p_meal_id;
        end if;
    end if;
end;
$$;

grant execute on function public.cast_vote(text, uuid, vote_value) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- ensure_guest(session_id, user_id) — mint a guest_token, refuse if closed
-- ---------------------------------------------------------------------------
create or replace function public.ensure_guest(
    p_session_id uuid,
    p_user_id uuid default null
)
returns table (id uuid, guest_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
    v_token text;
    v_status session_status;
    v_expires timestamptz;
begin
    select status, expires_at into v_status, v_expires
    from public.sessions
    where id = p_session_id;
    if v_expires is null then
        raise exception 'session_not_found';
    end if;
    if v_expires < now() then
        raise exception 'session_expired';
    end if;
    if v_status <> 'voting' then
        raise exception 'session_not_open';
    end if;

    insert into public.guests (session_id, user_id)
    values (p_session_id, p_user_id)
    returning guests.id, guests.guest_token into v_id, v_token;

    return query select v_id, v_token;
end;
$$;

grant execute on function public.ensure_guest(uuid, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- list_my_sessions(user_id) — host's sessions + distinct-voter count
-- ---------------------------------------------------------------------------
-- Defense-in-depth: when called with an authenticated JWT (auth.uid() set),
-- enforce that the caller's id matches the requested p_user_id. Service-role
-- callers (the only callers today, since the function is REVOKE'd from
-- anon/authenticated) have auth.uid() = null and pass through. If a future
-- wrapper accidentally exposed the function, the assertion fires before
-- any data is returned. Audit 2026-05-07 finding L-9.
create or replace function public.list_my_sessions(p_user_id uuid)
returns table (
    id uuid,
    vibe text,
    headcount integer,
    dietary text[],
    share_token text,
    status session_status,
    created_at timestamptz,
    expires_at timestamptz,
    voter_count integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is not null and auth.uid() <> p_user_id then
        raise exception 'forbidden' using errcode = '42501';
    end if;

    return query
    select
        s.id,
        s.vibe,
        s.headcount,
        s.dietary,
        s.share_token,
        s.status,
        s.created_at,
        s.expires_at,
        coalesce(
            (
                select count(distinct v.guest_id)::int
                from public.votes v
                join public.session_meals sm on sm.id = v.session_meal_id
                where sm.session_id = s.id
            ),
            0
        ) as voter_count
    from public.sessions s
    where s.host_id = p_user_id
    order by s.created_at desc;
end;
$$;

revoke all on function public.list_my_sessions(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.saved_meals    enable row level security;
alter table public.sessions       enable row level security;
alter table public.session_meals  enable row level security;
alter table public.guests         enable row level security;
alter table public.votes          enable row level security;

drop policy if exists "profiles self read"  on public.profiles;
drop policy if exists "profiles self write" on public.profiles;
create policy "profiles self read"  on public.profiles for select using (auth.uid() = id);
-- Both `using` and `with check` are required: `using` gates which row(s) the
-- update can touch; `with check` gates the resulting row. Without `with check`
-- a user could (in theory) pivot the row's id to another user's id during
-- the UPDATE — they'd lose access immediately, but the audit flagged the
-- missing defense-in-depth.
create policy "profiles self write" on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

drop policy if exists "saved_meals owner all" on public.saved_meals;
create policy "saved_meals owner all" on public.saved_meals
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sessions public read"     on public.sessions;
drop policy if exists "sessions host insert"     on public.sessions;
drop policy if exists "sessions host update"     on public.sessions;
drop policy if exists "sessions host delete"     on public.sessions;
create policy "sessions public read"  on public.sessions for select using (true);
create policy "sessions host insert"  on public.sessions for insert with check (auth.uid() = host_id);
create policy "sessions host update"  on public.sessions for update using (auth.uid() = host_id);
create policy "sessions host delete"  on public.sessions for delete using (auth.uid() = host_id);

drop policy if exists "session_meals public read" on public.session_meals;
create policy "session_meals public read" on public.session_meals for select using (true);

drop policy if exists "guests public read" on public.guests;
create policy "guests public read" on public.guests for select using (true);

drop policy if exists "votes public read" on public.votes;
create policy "votes public read" on public.votes for select using (true);

-- ---------------------------------------------------------------------------
-- Defense-in-depth length checks on user-supplied text fields
-- ---------------------------------------------------------------------------
-- The TypeScript validators (backend/src/utils/validation.util.ts) already
-- cap incoming strings, but a stolen service-role key or a future direct
-- write path would bypass them. These DB-level constraints ensure the table
-- itself can't grow rows that bloat the page cache. Idempotent guards via
-- not-exists DO blocks because Postgres has no `add constraint if not exists`.
-- ---------------------------------------------------------------------------
do $$ begin
    if not exists (
        select 1 from pg_constraint where conname = 'sessions_vibe_len'
    ) then
        alter table public.sessions add constraint sessions_vibe_len
            check (char_length(vibe) between 1 and 200);
    end if;
    if not exists (
        select 1 from pg_constraint where conname = 'session_meals_title_len'
    ) then
        alter table public.session_meals add constraint session_meals_title_len
            check (char_length(title) between 1 and 200);
    end if;
    if not exists (
        select 1 from pg_constraint where conname = 'session_meals_desc_len'
    ) then
        alter table public.session_meals add constraint session_meals_desc_len
            check (char_length(description) <= 4000);
    end if;
    if not exists (
        select 1 from pg_constraint where conname = 'saved_meals_title_len'
    ) then
        alter table public.saved_meals add constraint saved_meals_title_len
            check (char_length(title) between 1 and 200);
    end if;
    if not exists (
        select 1 from pg_constraint where conname = 'saved_meals_desc_len'
    ) then
        alter table public.saved_meals add constraint saved_meals_desc_len
            check (char_length(description) <= 4000);
    end if;
    -- profiles_email_len constraint was retired together with the email
    -- column it guarded (audit 2026-05-07 finding L-DEEP-3). Drop it
    -- defensively in case an older DB still has it.
    if exists (
        select 1 from pg_constraint where conname = 'profiles_email_len'
    ) then
        alter table public.profiles drop constraint profiles_email_len;
    end if;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime publication
-- ---------------------------------------------------------------------------
do $$ begin
    if not exists (
        select 1 from pg_publication where pubname = 'supabase_realtime'
    ) then
        create publication supabase_realtime;
    end if;
end $$;

alter publication supabase_realtime add table public.session_meals;
alter publication supabase_realtime add table public.votes;

-- ---------------------------------------------------------------------------
-- Storage — public-read meal-images bucket; only service role writes
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('meal-images', 'meal-images', true)
on conflict (id) do nothing;

drop policy if exists "meal-images public read" on storage.objects;
create policy "meal-images public read"
    on storage.objects for select
    using (bucket_id = 'meal-images');

-- ---------------------------------------------------------------------------
-- pg_cron — daily cleanup of expired sessions at 03:15 UTC
-- ---------------------------------------------------------------------------
do $$
declare
    v_jobid bigint;
begin
    select jobid into v_jobid from cron.job where jobname = 'atavola-cleanup-expired-sessions';
    if v_jobid is not null then
        perform cron.unschedule(v_jobid);
    end if;
    perform cron.schedule(
        'atavola-cleanup-expired-sessions',
        '15 3 * * *',
        $cleanup$delete from public.sessions where expires_at < now()$cleanup$
    );
exception when undefined_table or undefined_function or undefined_object then
    raise notice 'cron schema not present — pg_cron extension needs enabling first.';
end $$;

-- =============================================================================
-- Made with Bob
-- =============================================================================

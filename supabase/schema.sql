-- GanApp database (already applied to the Supabase project; kept here for reference / new projects).
-- Applied as migrations: ganapp_core_schema, ganapp_demo_seed, fix_demo_refresh_created_at.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Explorer' check (char_length(display_name) between 1 and 40),
  role text not null default 'explorer' check (role in ('explorer','promoter')),
  interests text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.pings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id) on delete set null default auth.uid(),
  creator_name text not null default 'Explorer',
  title text not null check (char_length(title) between 1 and 80),
  category text not null check (category in ('Food','Music','Art','Sports','Nightlife','Nature','Culture','Tech','Wellness')),
  description text not null default '' check (char_length(description) <= 500),
  place_name text not null default '' check (char_length(place_name) <= 120),
  address text not null default '' check (char_length(address) <= 160),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  kind text not null default 'event' check (kind in ('event','place')),
  starts_at timestamptz,
  ends_at timestamptz,
  ping_ends_at timestamptz not null,
  radius_m integer not null default 1000 check (radius_m in (500,1000,3000,5000)),
  is_promoted boolean not null default false,
  price_label text not null default 'Free entry' check (char_length(price_label) <= 40),
  photo_url text,
  views_count integer not null default 0,
  saved_count integer not null default 0,
  going_count integer not null default 0,
  directions_count integer not null default 0,
  is_demo boolean not null default false,
  demo_start_offset_min integer,
  demo_len_min integer,
  demo_ping_min integer,
  created_at timestamptz not null default now(),
  constraint ping_max_length check (ping_ends_at <= created_at + interval '8 days')
);
create index pings_active_idx on public.pings (ping_ends_at);
create index pings_creator_idx on public.pings (creator_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  ping_id uuid not null references public.pings(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null default auth.uid(),
  author_name text not null default 'Explorer',
  rating integer not null check (rating between 1 and 5),
  title text not null default '' check (char_length(title) <= 80),
  body text not null default '' check (char_length(body) <= 600),
  upvotes integer not null default 0,
  created_at timestamptz not null default now()
);
create index reviews_ping_idx on public.reviews (ping_id);

create table public.review_votes (
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create table public.saves (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  ping_id uuid not null references public.pings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, ping_id)
);
create table public.attendees (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  ping_id uuid not null references public.pings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, ping_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  ping_id uuid not null references public.pings(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null default auth.uid(),
  author_name text not null default 'Explorer',
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index messages_ping_idx on public.messages (ping_id, created_at);
create index saves_ping_idx on public.saves (ping_id);
create index attendees_ping_idx on public.attendees (ping_id);
create index review_votes_user_idx on public.review_votes (user_id);

-- Counters kept up to date by triggers
create or replace function public.bump_counts() returns trigger
language plpgsql security definer set search_path = '' as $$
declare d integer := case when tg_op = 'INSERT' then 1 else -1 end;
        pid uuid := coalesce(new.ping_id, old.ping_id);
begin
  if tg_table_name = 'saves' then
    update public.pings set saved_count = greatest(saved_count + d, 0) where id = pid;
  elsif tg_table_name = 'attendees' then
    update public.pings set going_count = greatest(going_count + d, 0) where id = pid;
  end if;
  return null;
end $$;
create trigger saves_count after insert or delete on public.saves for each row execute function public.bump_counts();
create trigger attendees_count after insert or delete on public.attendees for each row execute function public.bump_counts();

create or replace function public.bump_upvotes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.reviews set upvotes = greatest(upvotes + case when tg_op='INSERT' then 1 else -1 end, 0)
  where id = coalesce(new.review_id, old.review_id);
  return null;
end $$;
create trigger votes_count after insert or delete on public.review_votes for each row execute function public.bump_upvotes();

create or replace function public.bump_ping_stat(p_ping uuid, p_stat text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_stat = 'views' then
    update public.pings set views_count = views_count + 1 where id = p_ping;
  elsif p_stat = 'directions' then
    update public.pings set directions_count = directions_count + 1 where id = p_ping;
  end if;
end $$;

-- Keeps the sample Makati pings looking live for demos
create or replace function public.refresh_demo_pings() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.pings
     set created_at = now(),
         starts_at = date_trunc('hour', now()) + make_interval(mins => demo_start_offset_min),
         ends_at = date_trunc('hour', now()) + make_interval(mins => demo_start_offset_min + demo_len_min),
         ping_ends_at = now() + make_interval(mins => demo_ping_min)
   where is_demo and ping_ends_at < now() + interval '30 minutes';
end $$;

-- "Extend ping +6 hrs": only the creator, max 8 days total
create or replace function public.extend_ping(p_ping uuid, p_hours integer) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare new_end timestamptz;
begin
  if p_hours not between 1 and 24 then raise exception 'Extend by 1 to 24 hours'; end if;
  update public.pings
     set ping_ends_at = least(greatest(ping_ends_at, now()) + make_interval(hours => p_hours), created_at + interval '8 days')
   where id = p_ping and creator_id = auth.uid()
  returning ping_ends_at into new_end;
  if new_end is null then raise exception 'Only the creator can extend this ping'; end if;
  return new_end;
end $$;

revoke execute on function public.bump_counts() from public, anon, authenticated;
revoke execute on function public.bump_upvotes() from public, anon, authenticated;
revoke execute on function public.bump_ping_stat(uuid, text) from public, anon;
revoke execute on function public.refresh_demo_pings() from public, anon;
revoke execute on function public.extend_ping(uuid, integer) from public, anon;
grant execute on function public.bump_ping_stat(uuid, text) to authenticated;
grant execute on function public.refresh_demo_pings() to authenticated;
grant execute on function public.extend_ping(uuid, integer) to authenticated;

-- Row level security
alter table public.profiles enable row level security;
alter table public.pings enable row level security;
alter table public.reviews enable row level security;
alter table public.review_votes enable row level security;
alter table public.saves enable row level security;
alter table public.attendees enable row level security;
alter table public.messages enable row level security;

create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "pings readable" on public.pings for select to authenticated
  using (ping_ends_at > now() - interval '30 days' or creator_id = (select auth.uid()));
create policy "create own pings" on public.pings for insert to authenticated
  with check (creator_id = (select auth.uid()) and is_demo = false and ping_ends_at > now());
create policy "update own pings" on public.pings for update to authenticated
  using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));
create policy "delete own pings" on public.pings for delete to authenticated using (creator_id = (select auth.uid()));
revoke update on public.pings from authenticated, anon;
grant update (title, category, description, place_name, address, starts_at, ends_at, radius_m, is_promoted, price_label) on public.pings to authenticated;

create policy "reviews readable" on public.reviews for select to authenticated using (true);
create policy "write own reviews" on public.reviews for insert to authenticated
  with check (author_id = (select auth.uid()) and upvotes = 0);
create policy "delete own reviews" on public.reviews for delete to authenticated using (author_id = (select auth.uid()));

create policy "votes readable" on public.review_votes for select to authenticated using (true);
create policy "vote as self" on public.review_votes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "unvote as self" on public.review_votes for delete to authenticated using (user_id = (select auth.uid()));

create policy "own saves" on public.saves for select to authenticated using (user_id = (select auth.uid()));
create policy "save as self" on public.saves for insert to authenticated with check (user_id = (select auth.uid()));
create policy "unsave as self" on public.saves for delete to authenticated using (user_id = (select auth.uid()));

create policy "attendees readable" on public.attendees for select to authenticated using (true);
create policy "go as self" on public.attendees for insert to authenticated with check (user_id = (select auth.uid()));
create policy "ungo as self" on public.attendees for delete to authenticated using (user_id = (select auth.uid()));

create policy "messages readable" on public.messages for select to authenticated using (true);
create policy "post as self" on public.messages for insert to authenticated with check (author_id = (select auth.uid()));

-- Photo storage: live photos, uploaded into your own folder
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ping-photos', 'ping-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "upload own ping photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'ping-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "delete own ping photos" on storage.objects for delete to authenticated
  using (bucket_id = 'ping-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Sample data (Sunset Sessions, Gallery After Hours, The Mill, …) was inserted by the ganapp_demo_seed migration.

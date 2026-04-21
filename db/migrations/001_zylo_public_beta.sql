create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null check (char_length(display_name) between 2 and 80),
  home_city text not null default '' check (char_length(home_city) <= 80),
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.taste_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  priorities text[] not null default '{}',
  favorite_cuisines text[] not null default '{}',
  avoids text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('Instagram', 'TikTok', 'Beli')),
  status text not null check (status in ('coming-soon', 'planned', 'connected')),
  summary text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  country text not null check (char_length(country) between 2 and 100),
  vibe text not null default '' check (char_length(vibe) <= 200),
  cover_tone text not null default '',
  is_local boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name, country)
);

create table if not exists public.source_artifacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('url', 'text', 'image', 'manual')),
  label text not null check (char_length(label) between 2 and 160),
  raw_content text not null check (char_length(raw_content) <= 5000),
  status text not null check (status in ('queued', 'processing', 'complete', 'failed')),
  extracted_places integer not null default 0 check (extracted_places >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_artifact_id uuid not null unique references public.source_artifacts(id) on delete cascade,
  status text not null check (status in ('queued', 'processing', 'complete', 'failed')),
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_id uuid references public.destinations(id) on delete set null,
  source_artifact_id uuid references public.source_artifacts(id) on delete set null,
  google_place_id text,
  name text not null check (char_length(name) between 2 and 160),
  city text not null check (char_length(city) between 2 and 100),
  country text not null check (char_length(country) between 2 and 100),
  category text not null check (category in ('restaurants', 'cafes', 'bars', 'hotels', 'activities', 'scenic spots', 'photo spots')),
  address text not null default '' check (char_length(address) <= 220),
  description text not null default '' check (char_length(description) <= 600),
  latitude double precision,
  longitude double precision,
  times_seen integer not null default 1 check (times_seen >= 1),
  source_count integer not null default 1 check (source_count >= 0),
  is_visited boolean not null default false,
  is_in_trip boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name, city, country)
);

create unique index if not exists places_user_google_place_idx
  on public.places (user_id, google_place_id)
  where google_place_id is not null;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_id uuid references public.destinations(id) on delete set null,
  title text not null check (char_length(title) between 2 and 120),
  status text not null check (status in ('draft', 'ready')),
  vibe text not null default '' check (char_length(vibe) <= 200),
  travelers integer not null default 1 check (travelers between 1 and 12),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trip_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_day_id uuid not null references public.trip_days(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  stop_time text not null default '' check (char_length(stop_time) <= 20),
  note text not null default '' check (char_length(note) <= 220),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('auth', 'import', 'security', 'ai', 'api')),
  message text not null check (char_length(message) <= 240),
  severity text not null check (severity in ('info', 'warn', 'critical')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name, home_city)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'traveler'), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'home_city', '')
  )
  on conflict (user_id) do nothing;

  insert into public.taste_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'zylo_on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) then
    execute '
      create trigger zylo_on_auth_user_created
        after insert on auth.users
        for each row execute procedure public.handle_new_user()
    ';
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.taste_profiles enable row level security;
alter table public.platform_connections enable row level security;
alter table public.destinations enable row level security;
alter table public.source_artifacts enable row level security;
alter table public.import_jobs enable row level security;
alter table public.places enable row level security;
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_stops enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles own rows"
  on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "taste profiles own rows"
  on public.taste_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "platform connections own rows"
  on public.platform_connections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "destinations own rows"
  on public.destinations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "source artifacts own rows"
  on public.source_artifacts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "import jobs own rows"
  on public.import_jobs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "places own rows"
  on public.places
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "trips own rows"
  on public.trips
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "trip days own rows"
  on public.trip_days
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.trips
      where trips.id = trip_days.trip_id and trips.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.trips
      where trips.id = trip_days.trip_id and trips.user_id = auth.uid()
    )
  );

create policy "trip stops own rows"
  on public.trip_stops
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.trip_days
      where trip_days.id = trip_stops.trip_day_id and trip_days.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.trip_days
      where trip_days.id = trip_stops.trip_day_id and trip_days.user_id = auth.uid()
    )
  );

create policy "audit events are readable by owner"
  on public.audit_events
  for select
  using (auth.uid() = user_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger taste_profiles_set_updated_at
  before update on public.taste_profiles
  for each row execute procedure public.set_updated_at();

create trigger platform_connections_set_updated_at
  before update on public.platform_connections
  for each row execute procedure public.set_updated_at();

create trigger destinations_set_updated_at
  before update on public.destinations
  for each row execute procedure public.set_updated_at();

create trigger source_artifacts_set_updated_at
  before update on public.source_artifacts
  for each row execute procedure public.set_updated_at();

create trigger import_jobs_set_updated_at
  before update on public.import_jobs
  for each row execute procedure public.set_updated_at();

create trigger places_set_updated_at
  before update on public.places
  for each row execute procedure public.set_updated_at();

create trigger trips_set_updated_at
  before update on public.trips
  for each row execute procedure public.set_updated_at();

create trigger trip_days_set_updated_at
  before update on public.trip_days
  for each row execute procedure public.set_updated_at();

create trigger trip_stops_set_updated_at
  before update on public.trip_stops
  for each row execute procedure public.set_updated_at();

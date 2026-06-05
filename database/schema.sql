-- MayhemGG PostgreSQL schema design.
-- This file is intentionally not wired into the app yet.
-- It is structured for future Riot API/Data Dragon ingestion and patch-scoped statistics.

create extension if not exists pgcrypto;

create type game_mode as enum ('arena', 'aram_mayhem');
create type champion_role as enum ('marksman', 'mage', 'bruiser', 'tank', 'enchanter', 'assassin');
create type champion_difficulty as enum ('easy', 'medium', 'hard', 'expert');
create type tier_rank as enum ('S+', 'S', 'A', 'B', 'C');
create type build_kind as enum ('best', 'broken', 'standard', 'experimental');
create type item_category as enum ('starter', 'core', 'damage', 'defense', 'utility', 'boots');
create type patch_status as enum ('pending', 'active', 'archived');

create table patches (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  data_dragon_version text,
  status patch_status not null default 'pending',
  released_at timestamptz,
  ingested_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table champions (
  id uuid primary key default gen_random_uuid(),
  riot_champion_id text not null unique,
  riot_key integer unique,
  name text not null,
  slug text not null unique,
  title text,
  role champion_role not null,
  secondary_roles champion_role[] not null default '{}',
  difficulty champion_difficulty not null,
  icon_path text,
  splash_path text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  riot_item_id integer not null unique,
  name text not null,
  slug text not null unique,
  category item_category not null default 'core',
  icon_path text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table augments (
  id uuid primary key default gen_random_uuid(),
  riot_augment_id text unique,
  name text not null,
  slug text not null unique,
  description text not null,
  icon_path text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table builds (
  id uuid primary key default gen_random_uuid(),
  patch_id uuid not null references patches(id) on delete cascade,
  champion_id uuid not null references champions(id) on delete cascade,
  mode game_mode not null,
  kind build_kind not null,
  name text not null,
  explanation text not null,
  broken_score numeric(5, 2),
  win_rate numeric(5, 2),
  pick_rate numeric(5, 2),
  sample_size integer not null default 0,
  source text not null default 'mayhemgg',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint builds_rate_bounds check (
    (win_rate is null or (win_rate >= 0 and win_rate <= 100)) and
    (pick_rate is null or (pick_rate >= 0 and pick_rate <= 100)) and
    (broken_score is null or (broken_score >= 0 and broken_score <= 100))
  )
);

create unique index builds_unique_patch_champion_mode_kind_name
  on builds (patch_id, champion_id, mode, kind, lower(name));

create table build_items (
  build_id uuid not null references builds(id) on delete cascade,
  item_id uuid not null references items(id) on delete restrict,
  position smallint not null,
  is_core boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (build_id, position),
  constraint build_items_position_positive check (position > 0)
);

create index build_items_item_id_idx on build_items (item_id);

create table build_augments (
  build_id uuid not null references builds(id) on delete cascade,
  augment_id uuid not null references augments(id) on delete restrict,
  position smallint not null default 1,
  created_at timestamptz not null default now(),
  primary key (build_id, augment_id),
  constraint build_augments_position_positive check (position > 0)
);

create index build_augments_augment_id_idx on build_augments (augment_id);

create table arena_champion_statistics (
  id uuid primary key default gen_random_uuid(),
  patch_id uuid not null references patches(id) on delete cascade,
  champion_id uuid not null references champions(id) on delete cascade,
  tier tier_rank not null,
  win_rate numeric(5, 2) not null,
  pick_rate numeric(5, 2) not null,
  ban_rate numeric(5, 2),
  average_placement numeric(4, 2),
  games_played integer not null default 0,
  best_build_id uuid references builds(id) on delete set null,
  broken_build_id uuid references builds(id) on delete set null,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patch_id, champion_id),
  constraint arena_stats_rate_bounds check (
    win_rate >= 0 and win_rate <= 100 and
    pick_rate >= 0 and pick_rate <= 100 and
    (ban_rate is null or (ban_rate >= 0 and ban_rate <= 100))
  )
);

create table aram_mayhem_champion_statistics (
  id uuid primary key default gen_random_uuid(),
  patch_id uuid not null references patches(id) on delete cascade,
  champion_id uuid not null references champions(id) on delete cascade,
  tier tier_rank not null,
  win_rate numeric(5, 2) not null,
  pick_rate numeric(5, 2) not null,
  games_played integer not null default 0,
  best_build_id uuid references builds(id) on delete set null,
  broken_build_id uuid references builds(id) on delete set null,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patch_id, champion_id),
  constraint aram_mayhem_stats_rate_bounds check (
    win_rate >= 0 and win_rate <= 100 and
    pick_rate >= 0 and pick_rate <= 100
  )
);

create table augment_statistics (
  id uuid primary key default gen_random_uuid(),
  patch_id uuid not null references patches(id) on delete cascade,
  augment_id uuid not null references augments(id) on delete cascade,
  mode game_mode not null,
  average_win_rate numeric(5, 2) not null,
  pick_rate numeric(5, 2) not null,
  games_played integer not null default 0,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patch_id, augment_id, mode),
  constraint augment_stats_rate_bounds check (
    average_win_rate >= 0 and average_win_rate <= 100 and
    pick_rate >= 0 and pick_rate <= 100
  )
);

create table augment_best_champions (
  augment_statistic_id uuid not null references augment_statistics(id) on delete cascade,
  champion_id uuid not null references champions(id) on delete cascade,
  rank smallint not null,
  win_rate numeric(5, 2),
  pick_rate numeric(5, 2),
  primary key (augment_statistic_id, champion_id),
  constraint augment_best_champions_rank_positive check (rank > 0)
);

create table tier_lists (
  id uuid primary key default gen_random_uuid(),
  patch_id uuid not null references patches(id) on delete cascade,
  mode game_mode not null,
  name text not null,
  description text,
  source text not null default 'mayhemgg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patch_id, mode, name)
);

create table tier_list_entries (
  tier_list_id uuid not null references tier_lists(id) on delete cascade,
  champion_id uuid not null references champions(id) on delete cascade,
  tier tier_rank not null,
  rank smallint not null,
  win_rate numeric(5, 2),
  pick_rate numeric(5, 2),
  notes text,
  created_at timestamptz not null default now(),
  primary key (tier_list_id, champion_id),
  unique (tier_list_id, rank),
  constraint tier_list_entries_rank_positive check (rank > 0)
);

create table champion_guides (
  id uuid primary key default gen_random_uuid(),
  patch_id uuid not null references patches(id) on delete cascade,
  champion_id uuid not null references champions(id) on delete cascade,
  mode game_mode,
  playstyle text not null,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  tips text[] not null default '{}',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  patch_id uuid references patches(id) on delete set null,
  source text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_processed integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index champions_slug_idx on champions (slug);
create index builds_patch_mode_idx on builds (patch_id, mode);
create index builds_champion_patch_idx on builds (champion_id, patch_id);
create index arena_stats_patch_tier_idx on arena_champion_statistics (patch_id, tier);
create index aram_mayhem_stats_patch_tier_idx on aram_mayhem_champion_statistics (patch_id, tier);
create index tier_list_entries_tier_idx on tier_list_entries (tier_list_id, tier);

create unique index champion_guides_unique_global_mode
  on champion_guides (patch_id, champion_id)
  where mode is null;

create unique index champion_guides_unique_specific_mode
  on champion_guides (patch_id, champion_id, mode)
  where mode is not null;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger patches_set_updated_at
  before update on patches
  for each row execute function set_updated_at();

create trigger champions_set_updated_at
  before update on champions
  for each row execute function set_updated_at();

create trigger items_set_updated_at
  before update on items
  for each row execute function set_updated_at();

create trigger augments_set_updated_at
  before update on augments
  for each row execute function set_updated_at();

create trigger builds_set_updated_at
  before update on builds
  for each row execute function set_updated_at();

create trigger arena_stats_set_updated_at
  before update on arena_champion_statistics
  for each row execute function set_updated_at();

create trigger aram_mayhem_stats_set_updated_at
  before update on aram_mayhem_champion_statistics
  for each row execute function set_updated_at();

create trigger augment_stats_set_updated_at
  before update on augment_statistics
  for each row execute function set_updated_at();

create trigger tier_lists_set_updated_at
  before update on tier_lists
  for each row execute function set_updated_at();

create trigger champion_guides_set_updated_at
  before update on champion_guides
  for each row execute function set_updated_at();

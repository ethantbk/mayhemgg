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
create type ingestion_job_status as enum ('queued', 'running', 'succeeded', 'retryable_failed', 'rate_limited', 'permanently_failed');
create type chaos_build_category as enum ('community', 'experimental', 'upvoted', 'newest');
create type chaos_build_status as enum ('verified', 'testing', 'unstable', 'fresh', 'archived');
create type chaos_build_risk as enum ('low', 'medium', 'high', 'extreme');
create type chaos_rating_difficulty as enum ('easy', 'moderate', 'hard', 'expert');
create type chaos_comment_status as enum ('visible', 'hidden', 'flagged');

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
  broken_score numeric(5, 2),
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
    (ban_rate is null or (ban_rate >= 0 and ban_rate <= 100)) and
    (broken_score is null or (broken_score >= 0 and broken_score <= 100))
  )
);

create table aram_mayhem_champion_statistics (
  id uuid primary key default gen_random_uuid(),
  patch_id uuid not null references patches(id) on delete cascade,
  champion_id uuid not null references champions(id) on delete cascade,
  tier tier_rank not null,
  win_rate numeric(5, 2) not null,
  pick_rate numeric(5, 2) not null,
  broken_score numeric(5, 2),
  games_played integer not null default 0,
  best_build_id uuid references builds(id) on delete set null,
  broken_build_id uuid references builds(id) on delete set null,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patch_id, champion_id),
  constraint aram_mayhem_stats_rate_bounds check (
    win_rate >= 0 and win_rate <= 100 and
    pick_rate >= 0 and pick_rate <= 100 and
    (broken_score is null or (broken_score >= 0 and broken_score <= 100))
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

create table chaos_creators (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  display_name text not null,
  handle text not null unique,
  slug text not null unique,
  specialty text not null,
  featured_champion_id uuid references champions(id) on delete set null,
  avatar_path text,
  builds_published integer not null default 0,
  total_votes integer not null default 0,
  reputation_score numeric(6, 2) not null default 0,
  spotlight text not null,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chaos_creators_counts_nonnegative check (
    builds_published >= 0 and
    total_votes >= 0 and
    reputation_score >= 0
  )
);

create table chaos_builds (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  patch_id uuid references patches(id) on delete set null,
  creator_id uuid not null references chaos_creators(id) on delete restrict,
  champion_id uuid not null references champions(id) on delete cascade,
  mode game_mode not null,
  title text not null,
  category chaos_build_category not null default 'community',
  status chaos_build_status not null default 'fresh',
  risk chaos_build_risk not null default 'medium',
  description text not null,
  core_item_path jsonb not null default '[]'::jsonb,
  recommended_augments text[] not null default '{}',
  tags text[] not null default '{}',
  matchup_notes text[] not null default '{}',
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  votes integer not null default 0,
  saved_count integer not null default 0,
  comments_count integer not null default 0,
  win_rate numeric(5, 2),
  games_played integer not null default 0,
  source text not null default 'community',
  is_featured boolean not null default false,
  published_at timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chaos_builds_counts_nonnegative check (
    comments_count >= 0 and
    saved_count >= 0 and
    games_played >= 0
  ),
  constraint chaos_builds_rate_bounds check (
    win_rate is null or (win_rate >= 0 and win_rate <= 100)
  )
);

create table chaos_build_ratings (
  id uuid primary key default gen_random_uuid(),
  chaos_build_id uuid not null references chaos_builds(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  rating_score numeric(3, 1) not null,
  is_upvote boolean not null default true,
  difficulty_vote chaos_rating_difficulty,
  voter_fingerprint text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chaos_build_ratings_score_bounds check (rating_score >= 0 and rating_score <= 10),
  constraint chaos_build_ratings_unique_build_auth_user unique (chaos_build_id, auth_user_id)
);

create table chaos_build_comments (
  id uuid primary key default gen_random_uuid(),
  chaos_build_id uuid not null references chaos_builds(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  creator_id uuid references chaos_creators(id) on delete set null,
  parent_comment_id uuid references chaos_build_comments(id) on delete cascade,
  author_name text not null,
  author_badge text,
  body text not null,
  status chaos_comment_status not null default 'visible',
  metadata jsonb not null default '{}'::jsonb,
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table chaos_build_bookmarks (
  id uuid primary key default gen_random_uuid(),
  chaos_build_id uuid not null references chaos_builds(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (chaos_build_id, auth_user_id)
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

create table riot_matches (
  id uuid primary key default gen_random_uuid(),
  riot_match_id text not null unique,
  patch_id uuid references patches(id) on delete set null,
  regional_routing text not null,
  platform_id text not null,
  queue_id integer not null,
  mode game_mode,
  game_version text not null,
  game_started_at timestamptz not null,
  game_ended_at timestamptz,
  game_duration_seconds integer not null,
  participant_puuid_hashes text[] not null default '{}',
  raw_data jsonb not null default '{}'::jsonb,
  ingested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table riot_match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references riot_matches(id) on delete cascade,
  riot_match_id text not null,
  puuid_hash text not null,
  participant_id integer not null,
  team_id integer not null,
  riot_champion_id integer not null,
  champion_name text not null,
  won boolean not null,
  placement integer,
  item_ids integer[] not null default '{}',
  augment_ids integer[] not null default '{}',
  kills integer not null default 0,
  deaths integer not null default 0,
  assists integer not null default 0,
  champion_level integer not null default 0,
  gold_earned integer not null default 0,
  total_damage_dealt_to_champions integer not null default 0,
  total_damage_taken integer not null default 0,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (riot_match_id, participant_id)
);

create table ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  job_id text not null unique,
  job_type text not null,
  source text not null default 'riot',
  status ingestion_job_status not null default 'queued',
  patch_id uuid references patches(id) on delete set null,
  riot_match_id text,
  queue_id integer,
  attempt_count integer not null default 0,
  locked_at timestamptz,
  next_attempt_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index champions_slug_idx on champions (slug);
create index builds_patch_mode_idx on builds (patch_id, mode);
create index builds_champion_patch_idx on builds (champion_id, patch_id);
create index arena_stats_patch_tier_idx on arena_champion_statistics (patch_id, tier);
create index aram_mayhem_stats_patch_tier_idx on aram_mayhem_champion_statistics (patch_id, tier);
create index tier_list_entries_tier_idx on tier_list_entries (tier_list_id, tier);
create index riot_matches_patch_mode_idx on riot_matches (patch_id, mode);
create index riot_matches_queue_started_idx on riot_matches (queue_id, game_started_at);
create index riot_match_participants_champion_idx on riot_match_participants (riot_champion_id);
create index riot_match_participants_match_id_idx on riot_match_participants (match_id);
create index ingestion_jobs_status_next_attempt_idx on ingestion_jobs (status, next_attempt_at);
create index chaos_creators_featured_champion_idx on chaos_creators (featured_champion_id);
create index chaos_creators_auth_user_id_idx on chaos_creators (auth_user_id)
  where auth_user_id is not null;
create index chaos_builds_patch_mode_idx on chaos_builds (patch_id, mode);
create index chaos_builds_champion_mode_idx on chaos_builds (champion_id, mode);
create index chaos_builds_creator_published_idx on chaos_builds (creator_id, published_at desc);
create index chaos_builds_category_votes_idx on chaos_builds (category, votes desc);
create index chaos_builds_tags_idx on chaos_builds using gin (tags);
create index chaos_builds_saved_count_idx on chaos_builds (saved_count desc);
create index chaos_build_ratings_build_idx on chaos_build_ratings (chaos_build_id);
create unique index chaos_build_ratings_unique_fingerprint
  on chaos_build_ratings (chaos_build_id, voter_fingerprint)
  where voter_fingerprint is not null;
create index chaos_build_comments_build_posted_idx on chaos_build_comments (chaos_build_id, posted_at desc)
  where status = 'visible';
create index chaos_build_comments_auth_user_id_idx on chaos_build_comments (auth_user_id)
  where auth_user_id is not null;
create index chaos_build_bookmarks_user_created_idx on chaos_build_bookmarks (auth_user_id, created_at desc);
create index chaos_build_bookmarks_build_idx on chaos_build_bookmarks (chaos_build_id);

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

create trigger chaos_creators_set_updated_at
  before update on chaos_creators
  for each row execute function set_updated_at();

create trigger chaos_builds_set_updated_at
  before update on chaos_builds
  for each row execute function set_updated_at();

create trigger chaos_build_ratings_set_updated_at
  before update on chaos_build_ratings
  for each row execute function set_updated_at();

create trigger chaos_build_comments_set_updated_at
  before update on chaos_build_comments
  for each row execute function set_updated_at();

create trigger riot_matches_set_updated_at
  before update on riot_matches
  for each row execute function set_updated_at();

create trigger riot_match_participants_set_updated_at
  before update on riot_match_participants
  for each row execute function set_updated_at();

create trigger ingestion_jobs_set_updated_at
  before update on ingestion_jobs
  for each row execute function set_updated_at();

create or replace function persist_riot_match(
  p_match jsonb,
  p_participants jsonb
)
returns uuid as $$
declare
  v_match_id uuid;
begin
  insert into riot_matches (
    riot_match_id,
    patch_id,
    regional_routing,
    platform_id,
    queue_id,
    mode,
    game_version,
    game_started_at,
    game_ended_at,
    game_duration_seconds,
    participant_puuid_hashes,
    raw_data,
    ingested_at
  )
  values (
    p_match ->> 'riotMatchId',
    nullif(p_match ->> 'patchId', '')::uuid,
    p_match ->> 'regionalRouting',
    p_match ->> 'platformId',
    (p_match ->> 'queueId')::integer,
    nullif(p_match ->> 'mode', '')::game_mode,
    p_match ->> 'gameVersion',
    (p_match ->> 'gameStartedAt')::timestamptz,
    nullif(p_match ->> 'gameEndedAt', '')::timestamptz,
    (p_match ->> 'gameDurationSeconds')::integer,
    coalesce(array(select jsonb_array_elements_text(p_match -> 'participantPuuidHashes')), '{}'),
    coalesce(p_match -> 'rawData', '{}'::jsonb),
    now()
  )
  on conflict (riot_match_id) do update set
    patch_id = excluded.patch_id,
    regional_routing = excluded.regional_routing,
    platform_id = excluded.platform_id,
    queue_id = excluded.queue_id,
    mode = excluded.mode,
    game_version = excluded.game_version,
    game_started_at = excluded.game_started_at,
    game_ended_at = excluded.game_ended_at,
    game_duration_seconds = excluded.game_duration_seconds,
    participant_puuid_hashes = excluded.participant_puuid_hashes,
    raw_data = excluded.raw_data,
    ingested_at = now()
  returning id into v_match_id;

  insert into riot_match_participants (
    match_id,
    riot_match_id,
    puuid_hash,
    participant_id,
    team_id,
    riot_champion_id,
    champion_name,
    won,
    placement,
    item_ids,
    augment_ids,
    kills,
    deaths,
    assists,
    champion_level,
    gold_earned,
    total_damage_dealt_to_champions,
    total_damage_taken,
    raw_data
  )
  select
    v_match_id,
    participant ->> 'riotMatchId',
    participant ->> 'puuidHash',
    (participant ->> 'participantId')::integer,
    (participant ->> 'teamId')::integer,
    (participant ->> 'riotChampionId')::integer,
    participant ->> 'championName',
    (participant ->> 'won')::boolean,
    nullif(participant ->> 'placement', '')::integer,
    coalesce(array(select jsonb_array_elements_text(participant -> 'itemIds'))::integer[], '{}'),
    coalesce(array(select jsonb_array_elements_text(participant -> 'augmentIds'))::integer[], '{}'),
    (participant ->> 'kills')::integer,
    (participant ->> 'deaths')::integer,
    (participant ->> 'assists')::integer,
    (participant ->> 'championLevel')::integer,
    (participant ->> 'goldEarned')::integer,
    (participant ->> 'totalDamageDealtToChampions')::integer,
    (participant ->> 'totalDamageTaken')::integer,
    coalesce(participant -> 'rawData', '{}'::jsonb)
  from jsonb_array_elements(p_participants) as participant
  on conflict (riot_match_id, participant_id) do update set
    match_id = excluded.match_id,
    puuid_hash = excluded.puuid_hash,
    team_id = excluded.team_id,
    riot_champion_id = excluded.riot_champion_id,
    champion_name = excluded.champion_name,
    won = excluded.won,
    placement = excluded.placement,
    item_ids = excluded.item_ids,
    augment_ids = excluded.augment_ids,
    kills = excluded.kills,
    deaths = excluded.deaths,
    assists = excluded.assists,
    champion_level = excluded.champion_level,
    gold_earned = excluded.gold_earned,
    total_damage_dealt_to_champions = excluded.total_damage_dealt_to_champions,
    total_damage_taken = excluded.total_damage_taken,
    raw_data = excluded.raw_data;

  return v_match_id;
end;
$$ language plpgsql;

# Riot API Integration Architecture

This document designs the future Riot API and match ingestion architecture for MayhemGG. It does not implement API calls, credentials, queues, workers, or database runtime code.

## Goals

- Ingest Riot/Data Dragon patch metadata, champions, items, augments, and match data.
- Aggregate Arena and ARAM Mayhem champion statistics by patch.
- Calculate build win rates, pick rates, broken scores, and item/augment synergies.
- Calculate augment win rates and best champion pairings.
- Track patch lifecycle cleanly so old data remains queryable.
- Respect Riot API rate limits through centralized scheduling and retry control.
- Keep the frontend reading from stable repository APIs rather than Riot directly.

## Proposed Module Boundaries

```txt
src/server/riot/
  config.ts              Runtime env validation and Riot platform routing
  rateLimiter.ts         Token buckets, retry-after handling, backoff policy
  riotClient.ts          Thin fetch wrapper, no business logic
  dataDragonClient.ts    Patch/champion/item/static asset metadata fetchers
  matchClient.ts         Match ID and match detail fetchers
  normalizers.ts         Riot payload -> internal ingestion records

src/server/ingestion/
  patchIngestion.ts      Detect and create patch records
  staticDataIngestion.ts Upsert champions/items/augments
  matchIngestion.ts      Discover, queue, fetch, and store match payloads
  aggregationJobs.ts     Rebuild stats/builds/tier lists from raw match facts
  ingestionRuns.ts       Start/finish/fail run tracking

src/server/repositories/
  championsRepository.ts
  buildsRepository.ts
  augmentsRepository.ts
  statsRepository.ts
  patchesRepository.ts
```

The existing UI should continue to read through a data/repository layer. When PostgreSQL is wired in, `src/lib/data.ts` can be replaced or adapted to call repository functions without changing page components.

## Data Flow

```txt
Patch detection
  -> Static Data Dragon ingest
  -> Match discovery
  -> Match fetch and normalization
  -> Raw fact persistence
  -> Aggregation jobs
  -> Builds, stats, augments, tier lists
  -> Frontend repository reads
```

## Patch Tracking

Patch data maps to `patches`.

Lifecycle:

1. `pending`: Patch is discovered from Data Dragon or Riot metadata but ingestion is incomplete.
2. `active`: Static data and enough match samples are ingested for public display.
3. `archived`: Patch is superseded but remains queryable.

Patch ingestion should:

- Upsert `patches.version`.
- Store `data_dragon_version`.
- Mark the new patch `pending`.
- Ingest static champion/item/augment metadata.
- Start match ingestion for the patch.
- Mark the patch `active` only after minimum sample thresholds are met.
- Archive older patch records only after the new patch is active.

Use `ingestion_runs` for every major patch/static/match/aggregation job.

## Static Data Ingestion

Static data maps to:

- `champions`
- `items`
- `augments`

Data Dragon and Riot payloads should be preserved in `raw_data jsonb` for debugging, future fields, and backfills.

Upsert keys:

- Champions: `riot_champion_id`, `riot_key`, `slug`
- Items: `riot_item_id`
- Augments: `riot_augment_id` when available, otherwise normalized slug

Static ingestion should be idempotent. Running it twice for the same patch must not duplicate records.

## Match Ingestion Pipeline

The schema currently stores aggregated outputs but not raw match facts. Before implementation, add raw match tables or object storage references.

Recommended future raw tables:

```txt
riot_matches
  id
  riot_match_id
  patch_id
  mode
  game_version
  game_started_at
  raw_data
  ingested_at

riot_match_participants
  id
  riot_match_id
  champion_id
  placement / won
  team_id
  items[]
  augments[]
  raw_data
```

Pipeline stages:

1. Discover candidate players or match IDs.
2. Queue match IDs for the active patch and target modes.
3. Fetch match details through the rate-limited Riot client.
4. Reject unsupported modes and wrong patch versions.
5. Normalize participants into internal records.
6. Persist raw match and participant facts.
7. Mark match IDs as processed so ingestion is idempotent.

Mode detection should be centralized. Do not scatter queue ID or game mode constants across jobs.

## Champion Statistics Aggregation

Outputs map to:

- `arena_champion_statistics`
- `aram_mayhem_champion_statistics`

For each patch, mode, and champion:

```txt
games_played = count(participant rows for champion)
wins = count(participant rows where won = true)
win_rate = wins / games_played * 100
pick_rate = games_played / total_mode_participant_slots * 100
ban_rate = bans / total_mode_games * 100, where mode exposes bans
average_placement = avg(placement), where mode exposes placement
```

Tier assignment should be calculated after stats:

```txt
score =
  weighted win rate
  + pick rate confidence adjustment
  + ban rate pressure adjustment
  + sample size confidence
  + broken build contribution
```

Then map score bands to `S+`, `S`, `A`, `B`, `C`.

Use minimum sample thresholds before surfacing stats. Low-sample champions should either inherit prior patch confidence or be marked as provisional in future UI fields.

## Build Win Rate Calculations

Outputs map to:

- `builds`
- `build_items`
- `build_augments`

Build identity should be normalized before aggregation:

```txt
build_key = champion_id + mode + normalized core items + normalized augment group
```

Recommended approach:

1. Extract ordered final items from each participant.
2. Remove invalid/empty item slots.
3. Normalize item order into:
   - `item_order`: likely purchase or priority order when available.
   - `full_build`: final item set.
4. Group builds by champion, patch, mode, and core item set.
5. Calculate:
   - `sample_size`
   - `win_rate`
   - `pick_rate`
   - `broken_score`

Suggested broken score:

```txt
broken_score =
  normalized win rate over mode average
  + pick rate/popularity pressure
  + augment synergy lift
  + item synergy lift
  + sample size confidence
```

Store top outputs as:

- `kind = 'best'` for reliable high-win builds.
- `kind = 'broken'` for oppressive high-score builds.
- `kind = 'standard'` for common safe builds.
- `kind = 'experimental'` for promising but low-sample builds.

## Augment Win Rate Calculations

Outputs map to:

- `augment_statistics`
- `augment_best_champions`
- `build_augments`

For each patch, mode, and augment:

```txt
games_played = count(participant rows with augment)
wins = count(participant rows with augment and won = true)
average_win_rate = wins / games_played * 100
pick_rate = games_played / total_mode_participant_slots * 100
```

Best champions:

```txt
for each augment:
  group participants by champion
  require minimum sample size
  rank by win rate, then games played
```

Synergy lift:

```txt
augment_champion_lift =
  win_rate(champion + augment)
  - baseline_win_rate(champion in mode)
```

Use synergy lift for build recommendations and future guide copy.

## Tier List Generation

Outputs map to:

- `tier_lists`
- `tier_list_entries`

Generation flow:

1. Aggregate champion stats for patch and mode.
2. Calculate confidence-adjusted score.
3. Assign tier.
4. Rank champions within tier by score.
5. Persist one tier list per patch and mode.

Tier lists should be generated from statistics, not hand-authored, but `notes` can support editorial overlays later.

## Rate Limit Handling

Rate limiting should be centralized in `src/server/riot/rateLimiter.ts`.

Principles:

- No Riot API call should bypass the shared Riot client.
- Treat rate limits as runtime configuration, not hardcoded business logic.
- Respect response headers and retry-after signals.
- Use per-route and global token buckets.
- Use exponential backoff with jitter for retryable failures.
- Never retry non-retryable 4xx responses except explicit rate-limit responses.
- Persist job state so workers can resume after process restarts.

Queue behavior:

```txt
queued -> running -> succeeded
queued -> running -> rate_limited -> queued
queued -> running -> retryable_failed -> queued
queued -> running -> permanently_failed
```

Recommended guardrails:

- Maximum retry count per match ID.
- Dead-letter queue for repeated failures.
- Pause ingestion when rate-limit pressure is sustained.
- Separate high-priority static data jobs from bulk match jobs.
- Track request counts and failures in ingestion metadata.

## Aggregation Job Strategy

Aggregation should be repeatable and patch-scoped.

For a patch:

1. Load normalized participant facts.
2. Recalculate champion stats.
3. Recalculate augment stats.
4. Recalculate build groups.
5. Select best and broken builds.
6. Generate tier lists.
7. Update `patches.ingested_at`.
8. Mark patch `active` if sample thresholds pass.

Jobs should be idempotent. A failed aggregation can be rerun from raw match facts.

## Frontend Read Model

The app should eventually query read-optimized repository functions:

```ts
getCurrentPatch()
getChampionsForMode(mode)
getChampionGuide(slug, mode, patchVersion?)
getTierList(mode, patchVersion?)
getBrokenBuilds(mode?, patchVersion?)
getAugments(mode, patchVersion?)
```

These map cleanly to existing pages and components.

## Deployment and Worker Model

Vercel is good for the Next.js web app, but bulk ingestion should not run inside request/response page routes.

Recommended options:

- Scheduled Vercel Cron route that enqueues jobs only.
- External worker service for match fetching and aggregation.
- Managed queue such as Upstash, Inngest, Trigger.dev, or a dedicated worker process.
- PostgreSQL as source of truth for patch state, ingestion runs, and aggregate outputs.

Keep ingestion code server-only and never expose Riot API keys to client components.

## Implementation Phases

### Phase 1: Static Data Foundation

- Add env validation.
- Add Riot/Data Dragon client shell.
- Add repository interfaces.
- Ingest patches, champions, items, augments.

### Phase 2: Match Collection

- Add raw match tables.
- Add queue and ingestion run tracking.
- Discover and fetch target mode matches.
- Normalize participant facts.

### Phase 3: Aggregation

- Build champion stats jobs.
- Build augment stats jobs.
- Build build-grouping and win-rate jobs.
- Generate tier lists.

### Phase 4: App Integration

- Replace mock-data reads with repository reads.
- Add patch selector.
- Add provisional/low-sample UI states.
- Add monitoring for ingestion freshness.

## Open Design Questions

- Which Riot-supported queue IDs or mode identifiers will represent ARAM Mayhem and Arena at ingestion time?
- What sample size is required before a champion/build/augment is public?
- Should low-sample builds be hidden, labeled provisional, or blended with prior-patch data?
- Will match discovery start from seeded players, challenger/high-MMR populations, or a Riot-supported match source?
- Should raw match payloads live in PostgreSQL `jsonb`, object storage, or both?

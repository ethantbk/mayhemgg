# MayhemGG Data Ingestion Implementation Roadmap

This roadmap turns the existing PostgreSQL schema and Riot API architecture design into an actionable build plan for the real MayhemGG data pipeline. It is intentionally implementation-only guidance: no Riot API calls, database runtime code, workers, or credentials are added here.

## Current Architecture Review

### PostgreSQL Schema Readiness

The schema in `database/schema.sql` already provides a strong read model for the public product:

- `patches` supports patch lifecycle tracking with `pending`, `active`, and `archived`.
- `champions`, `items`, and `augments` support Data Dragon/static metadata with `raw_data jsonb` for future backfills.
- `arena_champion_statistics` and `aram_mayhem_champion_statistics` support patch-scoped champion stats.
- `builds`, `build_items`, and `build_augments` support best, broken, standard, and experimental build outputs.
- `augment_statistics` and `augment_best_champions` support augment rankings and champion pairings.
- `tier_lists` and `tier_list_entries` support generated tier lists.
- `ingestion_runs` provides a basic audit trail for long-running ingestion and aggregation jobs.

Before real match ingestion, add raw fact and job-state tables. The current schema stores final aggregates, but it does not yet store raw Riot match payloads or normalized participant facts. Without those facts, aggregation jobs cannot be re-run safely after a scoring change, patch correction, or failed deploy.

Recommended schema additions before Phase 2:

```txt
riot_matches
  id
  riot_match_id unique
  patch_id
  mode
  platform_routing
  regional_routing
  queue_id
  game_version
  game_started_at
  game_duration_seconds
  raw_data
  ingested_at
  created_at

riot_match_participants
  id
  riot_match_id
  champion_id
  puuid_hash
  team_id
  placement
  won
  item_ids
  augment_ids
  level
  kills
  deaths
  assists
  damage_dealt
  damage_taken
  raw_data
  created_at

match_ingestion_queue
  id
  riot_match_id
  patch_id
  mode
  status
  priority
  attempt_count
  next_attempt_at
  last_error
  metadata
  created_at
  updated_at

riot_api_requests
  id
  route_key
  status_code
  retry_after_seconds
  request_started_at
  request_finished_at
  metadata
```

Do not store player-identifying fields unless they are necessary. Prefer hashed or anonymized PUUID references for deduplication and discovery.

### Riot Architecture Readiness

The design in `docs/riot-api-integration-architecture.md` provides the right boundaries:

- `src/server/riot` should own env validation, Riot clients, Data Dragon clients, route constants, normalization, and rate limiting.
- `src/server/ingestion` should own patch, static data, match, and aggregation workflows.
- `src/server/repositories` should own database reads/writes so frontend routes never depend on Riot payload shapes.
- Bulk ingestion should not run inside regular Next.js request/response rendering.
- Vercel should host the web app and lightweight cron enqueue routes, while a separate worker should process high-volume match jobs.

The key implementation principle is idempotency. Every job should be safe to retry, and every aggregate should be rebuildable from raw match facts.

## Target Data Flow

```txt
Scheduled patch check
  -> Data Dragon version detection
  -> Patch record upsert
  -> Static champion/item/augment ingest
  -> Match ID discovery
  -> Match fetch queue
  -> Riot match detail fetch
  -> Mode and patch validation
  -> Raw match persistence
  -> Participant fact persistence
  -> Champion stats aggregation
  -> Build aggregation
  -> Augment aggregation
  -> Tier score generation
  -> Broken score generation
  -> Patch activation
  -> Frontend repository reads
```

## Phase 1: Riot API Connection

### Objective

Create the server-only Riot/Data Dragon foundation used by every later ingestion phase.

### Deliverables

- Runtime environment validation for Riot, database, queue, and ingestion settings.
- Server-only Riot API client wrapper.
- Server-only Data Dragon client wrapper.
- Centralized platform, regional routing, queue ID, and mode constants.
- Centralized rate limit layer with retry metadata.
- Repository interfaces for patches, champions, items, augments, ingestion runs, and API request logging.

### Implementation Steps

1. Add env validation in `src/server/riot/config.ts`.
2. Define Riot platform routing values, regional routing values, target queue IDs, and MayhemGG mode mapping.
3. Build `riotClient.ts` as the only allowed path for Riot API fetches.
4. Build `dataDragonClient.ts` for versions, champions, items, and static metadata.
5. Add `rateLimiter.ts` with global and per-route token buckets.
6. Persist rate-limit events and failed requests to `riot_api_requests`.
7. Add `ingestionRuns` helpers for `started`, `succeeded`, `failed`, and `partial` states.
8. Add a smoke-test command or admin-only route that validates credentials without starting bulk ingestion.

### Acceptance Criteria

- Riot API key never appears in client bundles or public env variables.
- All Riot requests pass through the shared client.
- Rate-limit responses are captured and retried according to policy.
- Static Data Dragon requests can fetch the current version list.
- Ingestion run records are created for test jobs.

### Difficulty

Medium. The code is straightforward, but rate-limit behavior needs careful testing before high-volume ingestion.

### Deployment Timing

Before deployment of real data features. The public mock-data site can deploy without this phase.

## Phase 2: Match Ingestion

### Objective

Discover, queue, fetch, validate, normalize, and persist Riot match facts for Arena and ARAM Mayhem.

### Deliverables

- Raw match tables and participant fact tables.
- Match ingestion queue.
- Match ID discovery strategy.
- Idempotent match fetch worker.
- Mode and patch validation.
- Dead-letter handling for permanently failed match IDs.

### Implementation Steps

1. Add the raw match, participant, queue, and API request tables described above.
2. Define the match discovery source:
   - seeded high-activity players,
   - known match IDs,
   - Riot-supported match history traversal,
   - or a hybrid discovery source.
3. Create a `discover-match-ids` job that queues candidate match IDs for a patch and mode.
4. Create a `fetch-match` worker that claims queued IDs with row-level locking or queue leasing.
5. Fetch match details through `riotClient.ts`.
6. Reject unsupported queue IDs, unsupported modes, remakes if needed, and mismatched patch versions.
7. Persist raw match payloads in `riot_matches`.
8. Normalize participants into `riot_match_participants`.
9. Mark queue rows as `succeeded`, `retryable_failed`, `rate_limited`, or `permanently_failed`.
10. Track processed counts and errors in `ingestion_runs.metadata`.

### Acceptance Criteria

- Reprocessing the same Riot match ID does not duplicate facts.
- A failed worker can restart without losing job state.
- Each accepted match is tied to exactly one patch and one MayhemGG mode.
- Unsupported modes are recorded or skipped cleanly.
- Queue depth, success rate, and failure rate are observable.

### Difficulty

High. This is the first phase that depends on external API limits, Riot payload edge cases, and durable job state.

### Deployment Timing

Before any production stats are shown. This can run privately while the public site still uses mock data.

## Phase 3: Champion Statistics Aggregation

### Objective

Calculate patch-scoped champion win rate, pick rate, games played, ban rate where available, average placement where available, and provisional tier inputs.

### Deliverables

- `aggregate-champion-statistics` job.
- Mode-specific aggregation logic for Arena and ARAM Mayhem.
- Minimum sample thresholds.
- Confidence adjustment helpers.
- Writes to `arena_champion_statistics` and `aram_mayhem_champion_statistics`.

### Implementation Steps

1. Load all normalized participant facts for one patch and mode.
2. Calculate total mode games and total participant slots.
3. Group participant rows by champion.
4. Calculate:
   - `games_played`,
   - `wins`,
   - `win_rate`,
   - `pick_rate`,
   - `ban_rate` when available,
   - `average_placement` when available.
5. Apply sample-size confidence labels in `raw_data`.
6. Upsert mode-specific champion statistics.
7. Keep prior active patch stats available until the new patch meets publication thresholds.

### Acceptance Criteria

- Aggregation is deterministic from raw participant facts.
- Rerunning the job replaces aggregate outputs for the same patch and mode.
- Low-sample champions are not presented as fully reliable.
- Existing UI can consume the resulting stats through repository methods.

### Difficulty

Medium. The main risk is formula quality and sample-size handling, not raw implementation complexity.

### Deployment Timing

Before replacing mock champion stats in production.

## Phase 4: Build Aggregation

### Objective

Generate reliable best, standard, experimental, and candidate broken builds from participant item and augment facts.

### Deliverables

- `aggregate-builds` job.
- Build identity normalizer.
- Item order and final build extraction.
- Build grouping and pick-rate calculation.
- Writes to `builds`, `build_items`, and `build_augments`.

### Implementation Steps

1. Extract participant final items and selected augments from raw participant facts.
2. Remove invalid, empty, duplicate, or mode-incompatible item IDs.
3. Normalize item sets into stable build keys:
   - `patch_id`,
   - `champion_id`,
   - `mode`,
   - core item IDs,
   - optional augment group.
4. Group participants by build key.
5. Calculate sample size, wins, win rate, and pick rate.
6. Classify builds:
   - `best` for reliable high-win builds,
   - `standard` for common stable builds,
   - `experimental` for promising low-sample builds,
   - `broken` only after Phase 7 scoring.
7. Upsert build records and ordered build item rows.
8. Link top build IDs back to champion statistics.

### Acceptance Criteria

- Build grouping is stable across job reruns.
- Build records include enough sample size context to avoid misleading recommendations.
- Item order displays consistently on champion pages and broken build pages.
- Builds can be recalculated when item normalization changes.

### Difficulty

High. Item order and build identity are product-defining choices and will need iteration.

### Deployment Timing

Before production build recommendations replace mock data.

## Phase 5: Augment Aggregation

### Objective

Calculate augment win rate, pick rate, best champions, and synergy lift for each patch and mode.

### Deliverables

- `aggregate-augments` job.
- Augment ID normalization.
- Champion plus augment pairing stats.
- Writes to `augment_statistics`, `augment_best_champions`, and build augment links.

### Implementation Steps

1. Load participant facts with normalized augment IDs.
2. Group rows by patch, mode, and augment.
3. Calculate games played, wins, average win rate, and pick rate.
4. For each augment, group by champion and calculate champion-specific win rate.
5. Calculate synergy lift:
   - champion plus augment win rate,
   - minus champion baseline win rate for the same patch and mode.
6. Rank best champions by confidence-adjusted lift, then win rate, then sample size.
7. Upsert augment statistics and best champion rows.
8. Persist supporting calculations in `raw_data` for future scoring/debugging.

### Acceptance Criteria

- Augment stats are patch-scoped and mode-specific.
- Best champion lists exclude tiny-sample outliers.
- Augment data can power homepage trending sections, augment pages, and champion detail sections.

### Difficulty

Medium. The hardest part is avoiding overvaluing low-pick augments.

### Deployment Timing

Before production augment pages replace mock data.

## Phase 6: Tier Score Generation

### Objective

Convert champion statistics into ranked tier lists for Arena and ARAM Mayhem.

### Deliverables

- `generate-tier-scores` job.
- Transparent scoring formula.
- Score bands for `S+`, `S`, `A`, `B`, and `C`.
- Writes to `tier_lists` and `tier_list_entries`.

### Implementation Steps

1. Load champion stats for one patch and mode.
2. Calculate mode baseline win rate and pick rate.
3. Score each champion using:
   - win rate over baseline,
   - pick rate confidence,
   - ban pressure for Arena when available,
   - average placement for Arena when available,
   - sample-size confidence,
   - broken build contribution after Phase 7 is available.
4. Map numerical scores to tier bands.
5. Rank champions inside each tier.
6. Upsert one generated tier list per patch and mode.
7. Write score components to `tier_list_entries.notes` or `raw_data` once added.

### Acceptance Criteria

- Tier lists are deterministic and reproducible.
- Rankings do not swing wildly on low samples.
- Tier assignments match public-facing champion statistics.
- The tier list page can be powered entirely by generated DB rows.

### Difficulty

Medium. Scoring will need tuning after real data arrives.

### Deployment Timing

Before production tier lists replace mock data.

## Phase 7: Broken Score Generation

### Objective

Identify the most oppressive champion/build/augment/item combinations without reducing the metric to raw win rate.

### Deliverables

- `generate-broken-scores` job.
- Broken score formula.
- Outlier and confidence controls.
- `kind = 'broken'` build selection.
- Broken score writes to `builds.broken_score`.

### Implementation Steps

1. Load build aggregates, champion stats, augment stats, and item/augment synergy calculations for one patch and mode.
2. Calculate score components:
   - build win rate over champion baseline,
   - champion win rate over mode baseline,
   - pick rate/popularity pressure,
   - augment synergy lift,
   - item synergy lift,
   - ban pressure where available,
   - sample-size confidence.
3. Penalize tiny samples, stale data, and duplicate near-identical builds.
4. Normalize final score to `0-100`.
5. Select top broken build per champion plus global ranked broken builds.
6. Persist `broken_score` and update `kind = 'broken'` where appropriate.
7. Link `broken_build_id` from champion statistics.

### Acceptance Criteria

- Broken builds are not simply the highest raw win-rate builds.
- Low-sample builds cannot dominate the rankings.
- The broken builds page sorts by persisted broken score.
- Score components are inspectable for debugging and editorial review.

### Difficulty

High. This is a core product differentiator and should be tuned with real samples.

### Deployment Timing

Can launch after basic stats, but should be ready before marketing the site as a broken-build database.

## Phase 8: Automated Patch Updates

### Objective

Keep MayhemGG current as Riot patches change without manual intervention.

### Deliverables

- Scheduled patch detection job.
- Static data refresh job.
- Patch activation and archive policy.
- Backfill/recompute workflow.
- Alerting for stale ingestion.

### Implementation Steps

1. Run `detect-current-patch` on a schedule.
2. Compare Data Dragon latest version against the active `patches.version`.
3. Upsert new patch as `pending`.
4. Run static data ingestion for the pending patch.
5. Start match discovery and ingestion for target modes.
6. Run aggregation jobs repeatedly as samples grow.
7. Activate the patch only after minimum thresholds pass:
   - minimum total games per mode,
   - minimum champion coverage,
   - successful champion/build/augment/tier/broken aggregations.
8. Archive older patches after the new patch is active.
9. Alert if no new matches are ingested within the freshness window.
10. Keep old patch data queryable for future patch selectors.

### Acceptance Criteria

- A new patch can move from `pending` to `active` without manual database edits.
- Public pages continue showing the previous active patch until the new patch is reliable.
- Failed patch ingestion can resume from recorded job state.
- Operators receive alerts for stale data, failed jobs, and sustained rate-limit pressure.

### Difficulty

Medium-high. Most complexity comes from orchestration and safe activation thresholds.

### Deployment Timing

Required before public claims of live or current stats.

## Required Environment Variables

### Public Web App

```txt
NEXT_PUBLIC_SITE_URL=https://mayhemgg.com
NEXT_PUBLIC_DDRAGON_VERSION=16.11.1
```

`NEXT_PUBLIC_DDRAGON_VERSION` can remain optional if the app reads the current active patch from the database later.

### Database

```txt
DATABASE_URL=postgres://...
DIRECT_DATABASE_URL=postgres://...
```

Use `DATABASE_URL` for runtime pooled connections. Use `DIRECT_DATABASE_URL` only for migrations if the provider requires a non-pooled connection.

### Riot and Data Dragon

```txt
RIOT_API_KEY=...
RIOT_API_BASE_URL=https://{platform}.api.riotgames.com
RIOT_REGIONAL_ROUTINGS=americas,europe,asia,sea
RIOT_PLATFORM_ROUTINGS=na1,br1,la1,la2,euw1,eun1,kr,jp1,oc1,tr1,ru
RIOT_DEFAULT_REGIONAL_ROUTING=americas
DATA_DRAGON_BASE_URL=https://ddragon.leagueoflegends.com
```

Keep all Riot variables server-only. Never prefix Riot secrets with `NEXT_PUBLIC_`.

### Ingestion Controls

```txt
INGESTION_ENABLED=false
INGESTION_WORKER_CONCURRENCY=4
INGESTION_MATCH_BATCH_SIZE=100
INGESTION_MAX_RETRIES=5
INGESTION_RETRY_BASE_DELAY_SECONDS=30
INGESTION_MIN_MODE_GAMES=5000
INGESTION_MIN_CHAMPION_GAMES=100
INGESTION_MIN_BUILD_GAMES=50
INGESTION_MIN_AUGMENT_GAMES=100
INGESTION_PATCH_ACTIVATION_MIN_COVERAGE=0.9
INGESTION_CRON_SECRET=...
```

Start conservative in production and raise concurrency only after rate-limit telemetry is stable.

### Queue and Worker Runtime

Choose one queue provider and configure only that provider.

```txt
QUEUE_PROVIDER=upstash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Alternative providers such as Inngest, Trigger.dev, or a dedicated worker queue can replace these values.

### Observability

```txt
SENTRY_DSN=...
LOG_LEVEL=info
INGESTION_ALERT_WEBHOOK_URL=...
```

## Required Background Jobs

| Job | Purpose | Trigger | Runtime |
| --- | --- | --- | --- |
| `detect-current-patch` | Discover new Riot/Data Dragon patch versions | Vercel Cron every 6-12 hours | Short web cron route |
| `ingest-static-data` | Upsert patches, champions, items, and augments | After patch detection | Worker or short job |
| `discover-match-ids` | Find candidate match IDs for target modes | Scheduled while patch is pending/active | Worker |
| `fetch-match` | Fetch and persist match facts | Queue-driven | Worker |
| `retry-rate-limited-matches` | Requeue jobs delayed by rate limits | Queue schedule | Worker |
| `aggregate-champion-statistics` | Rebuild champion stat tables | Scheduled and after match batches | Worker |
| `aggregate-builds` | Rebuild build tables | After champion stats or match batch threshold | Worker |
| `aggregate-augments` | Rebuild augment statistics | After champion stats or match batch threshold | Worker |
| `generate-tier-scores` | Rebuild tier lists | After champion stats | Worker |
| `generate-broken-scores` | Rebuild broken build rankings | After builds and augments | Worker |
| `activate-patch` | Promote pending patch after thresholds pass | After successful aggregations | Worker |
| `archive-old-patches` | Move superseded patches to archived | After activation | Worker |
| `audit-ingestion-health` | Detect stale data, dead queues, failures | Every 15-60 minutes | Worker or cron |
| `reprocess-dead-letter` | Retry manually approved permanent failures | Manual/admin trigger | Worker |

## Deployment Requirements

### Vercel Web App

- Deploy the Next.js App Router site to Vercel.
- Configure `NEXT_PUBLIC_SITE_URL` for production metadata, sitemap, and robots.
- Configure Data Dragon image remote patterns in `next.config.ts`.
- Add Vercel Cron only for enqueueing short jobs, not for bulk ingestion.
- Keep all ingestion routes protected with `INGESTION_CRON_SECRET`.

### PostgreSQL

- Use managed PostgreSQL with connection pooling.
- Run migrations before deploying workers that depend on new tables.
- Enable backups and point-in-time recovery before production ingestion.
- Add indexes for match queue status, match patch/mode, participant champion, participant augment, and participant item arrays.
- Keep raw match retention policy explicit. If storage grows too quickly, move full payloads to object storage and keep normalized facts in PostgreSQL.

### Worker Platform

- Use an external worker for long-running ingestion and aggregation.
- Worker must support:
  - durable queues,
  - concurrency limits,
  - delayed retries,
  - dead-letter queues,
  - graceful shutdown,
  - deploy rollbacks.
- Good options: Fly.io worker, Railway worker, Render worker, Trigger.dev, Inngest, or a small container service attached to the same PostgreSQL database.

### Secrets and Access

- Store Riot API key only in server/worker secrets.
- Use separate production and preview credentials.
- Disable ingestion in preview deployments unless explicitly testing.
- Restrict admin/cron endpoints with a shared secret or provider-native auth.

### Observability

- Track queue depth, processed matches, failed matches, Riot status codes, retry-after volume, aggregation duration, and active patch freshness.
- Alert when:
  - active patch data is stale,
  - queue depth grows continuously,
  - dead-letter count spikes,
  - Riot rate-limit pressure remains high,
  - aggregation jobs fail,
  - patch activation thresholds are not met after a configured window.

## Recommended Implementation Order

1. Add missing raw match and queue tables.
2. Add env validation and server-only Riot/Data Dragon clients.
3. Add repository layer for patches, static data, ingestion runs, and raw facts.
4. Implement Data Dragon patch/static ingestion.
5. Implement queue-backed match ID discovery.
6. Implement match fetching and participant normalization.
7. Run private ingestion for one mode and one region at low concurrency.
8. Implement champion statistics aggregation.
9. Implement augment aggregation.
10. Implement build aggregation.
11. Implement tier score generation.
12. Implement broken score generation.
13. Add patch activation thresholds.
14. Replace mock reads with repository reads behind a feature flag.
15. Run side-by-side validation against mock pages.
16. Enable production reads for one route at a time.
17. Enable automated patch updates.
18. Tune scoring formulas after real traffic and real match samples.

## Production Readiness Checklist

- [ ] Raw match and participant facts are stored idempotently.
- [ ] Every job writes an `ingestion_runs` record.
- [ ] Riot API calls are centralized and rate-limited.
- [ ] Failed jobs retry with backoff and eventually dead-letter.
- [ ] Aggregations are patch-scoped and repeatable.
- [ ] Patch activation requires sample thresholds.
- [ ] Previous active patch remains public until new patch is reliable.
- [ ] Public pages read from repository methods, not Riot payloads.
- [ ] Riot secrets are server-only.
- [ ] Workers run outside normal Vercel page rendering.
- [ ] Queue, database, worker, and cron health are observable.
- [ ] Rollback plan preserves the last active patch.

## Launch Strategy

Start with private ingestion for a single region and mode at low concurrency. Validate raw fact quality, champion stat outputs, build grouping, and augment rankings against manual spot checks. After the pipeline is stable, expand regions and modes, then enable repository-backed pages behind a feature flag.

The safest public rollout is route-by-route:

1. Augments page.
2. Tier list page.
3. Champions page.
4. Champion detail pages.
5. Broken builds page.
6. Homepage featured modules.

This keeps the highest-visibility, highest-complexity surfaces until the scoring formulas have real production samples behind them.

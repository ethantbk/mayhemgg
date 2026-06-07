# Live Riot Data Production Readiness Checklist

This checklist audits the completed MayhemGG Riot data phases and lists the remaining work required before enabling live Riot-backed data in production.

## Current State Summary

MayhemGG has a full server-side foundation for Riot API connectivity, match ingestion, Supabase persistence, aggregation, broken-score generation, repository-backed reads, scheduled refreshes, and a hidden admin status dashboard.

The public pages still have mock-data fallback, which is good for launch safety. The major remaining risk is not the UI. It is database readiness: the current SQL file is a schema design artifact and must be applied, aligned with the TypeScript/Supabase query layer, seeded, and verified before live data should be enabled.

## Phase Audit

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 1: Riot API connection | Implemented | Server-only Riot client, config validation, retry/rate-limit handling, Data Dragon helpers, and `/api/riot/verify` exist. |
| Phase 2: Match ingestion foundation | Implemented | Match ID discovery, match detail fetch, participant normalization, and server-only ingestion models exist. |
| Phase 3: Database persistence foundation | Implemented in code | Match persistence repository and `persist_riot_match` RPC are present, but the SQL migration must be applied to Supabase before use. |
| Phase 4: Champion aggregation | Implemented | Aggregates from persisted matches by patch and mode. Supports partial champion re-aggregation. |
| Phase 5: Build aggregation | Implemented | Generates item builds from persisted participants and links best builds to champion stats. Supports partial champion re-aggregation. |
| Phase 6: Augment aggregation | Implemented | Generates global augment and champion-pair statistics. Partial champion-only augment refresh is intentionally not supported because rows are global per augment/mode. |
| Phase 7: Broken score engine | Implemented | Scores champions per mode and persists generated tiers, broken score, and broken build IDs. Supports partial champion re-aggregation. |
| Phase 8: Real data read layer | Implemented | Pages read through repositories with mock fallback. Real reads depend on Supabase schema/data readiness. |
| Phase 9: Aggregation pipeline runner | Implemented | Central orchestration service runs ingestion, champion aggregation, build aggregation, augment aggregation, and broken-score generation with job/run tracking. |
| Phase 10: Scheduled refresh | Implemented | Cron-compatible daily refresh endpoint, manual refresh endpoint, status endpoint, health endpoint, and `/admin/status` dashboard exist. |

## Critical Blockers Before Live Enablement

1. Apply and validate real Supabase migrations.
   - Why it matters: the app cannot persist or read Riot data until all tables, indexes, triggers, enums, and the `persist_riot_match` RPC exist.
   - Where: `database/schema.sql`
   - Launch timing: before deployment with live data.

2. Resolve schema naming alignment.
   - Why it matters: `database/schema.sql` defines snake_case columns such as `patch_id`, `champion_id`, and `updated_at`, while the TypeScript models and Supabase query code use camelCase fields such as `patchId`, `championId`, and `updatedAt`.
   - Risk: Supabase does not automatically translate column names. Queries like `.eq("patchId", patchId)` will fail against the current snake_case SQL schema unless the database uses quoted camelCase columns, views, generated API aliases, or the code/types are updated to snake_case.
   - Where: `database/schema.sql`, `src/types/database.ts`, `src/lib/supabase/database.types.ts`, `src/server/**`
   - Launch timing: before live data.

3. Seed reference data.
   - Required rows: active patch, champions, items, augments.
   - Why it matters: aggregators map Riot match participants to known champion/item/augment rows. Empty reference tables produce empty or incomplete stats.
   - Current state: Data Dragon helper code exists, but no production seed job for champions/items/augments has been implemented.
   - Launch timing: before the first real aggregation run.

4. Configure Supabase access strategy.
   - Why it matters: write paths use the service-role client, but published read repositories use the server anon client.
   - Required choice: either add RLS policies that allow anon/server reads for published tables, or switch server-side published reads to service-role access.
   - Where: `src/server/repositories/publishedDataset.ts`, Supabase RLS policies.
   - Launch timing: before routing public pages to live data.

5. Verify API route runtime limits.
   - Why it matters: `/api/cron/daily-refresh` and `/api/refresh/run` execute the pipeline in a Next.js route. Large ingestion batches may exceed Vercel function duration limits.
   - Current mitigation: routes set `maxDuration = 300`, but platform limits still depend on Vercel plan and configuration.
   - Launch timing: before enabling broad match ingestion.

## Missing Database Migrations

Create versioned migrations from `database/schema.sql` before production. At minimum:

1. Base schema migration:
   - Extensions
   - Enums
   - Tables
   - Indexes
   - Unique constraints
   - Triggers

2. RPC migration:
   - `persist_riot_match(p_match jsonb, p_participants jsonb)`

3. RLS migration:
   - Decide table-by-table policies.
   - Service role can write ingestion tables.
   - Public/anon reads need either policies or server-side service-role reads.

4. Seed migrations or seed scripts:
   - `patches`
   - `champions`
   - `items`
   - `augments`

5. Naming alignment migration:
   - Choose either snake_case database columns with code updated to snake_case, or quoted camelCase database columns that match the existing TypeScript and query layer.
   - Do not launch until this is resolved and tested with real Supabase queries.

## Required Environment Variables

Production Vercel variables:

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_PATCH_VERSION=
NEXT_PUBLIC_DDRAGON_VERSION=
NEXT_PUBLIC_PATCH_STATUS_LABEL=
NEXT_PUBLIC_PATCH_DATA_SOURCE_LABEL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

RIOT_API_KEY=
RIOT_DEFAULT_PLATFORM_ROUTING=na1
RIOT_DEFAULT_REGIONAL_ROUTING=americas
RIOT_API_BASE_URL_TEMPLATE=https://{routing}.api.riotgames.com
RIOT_API_TIMEOUT_MS=10000
RIOT_API_MAX_RETRIES=2
RIOT_API_RATE_LIMIT_BUFFER_MS=250
RIOT_ARENA_QUEUE_ID=1750
RIOT_ARENA_QUEUE_IDS=1750,1700,1710
RIOT_ARAM_MAYHEM_QUEUE_ID=2400
RIOT_ARAM_MAYHEM_QUEUE_IDS=2400
RIOT_VERIFY_SECRET=

INGESTION_CRON_SECRET=
RIOT_REFRESH_PUUIDS=
RIOT_REFRESH_MATCH_COUNT=20
RIOT_REFRESH_LOOKBACK_HOURS=24
DATA_DRAGON_BASE_URL=https://ddragon.leagueoflegends.com
```

Notes:

- `RIOT_REFRESH_PUUIDS` is required for daily discovery-based ingestion. Without it, the daily refresh can run but will discover zero new matches.
- `INGESTION_CRON_SECRET` protects cron/manual/status refresh endpoints.
- `RIOT_VERIFY_SECRET` protects Riot connectivity checks.
- `NEXT_PUBLIC_PATCH_*` only affects frontend display labels; the live pipeline uses the `patches` table.

## Supabase Setup Checklist

1. Create the Supabase project.
2. Apply versioned schema migrations.
3. Resolve snake_case versus camelCase naming before applying final migrations.
4. Enable `pgcrypto`.
5. Confirm all enums exist.
6. Confirm all tables exist.
7. Confirm `persist_riot_match` exists and returns a match UUID.
8. Confirm indexes exist for:
   - `riot_matches (patch_id, mode)`
   - `riot_match_participants (match_id)`
   - `riot_match_participants (riot_champion_id)`
   - `ingestion_jobs (status, next_attempt_at)`
9. Seed an active patch row.
10. Seed champions with Riot champion IDs and numeric Riot keys.
11. Seed items with Riot item IDs.
12. Seed augments with Riot augment IDs.
13. Configure RLS policies or service-role-only reads.
14. Run a test insert through `persist_riot_match`.
15. Run a test aggregation against a small known dataset.

## Vercel Setup Checklist

1. Add all production environment variables.
2. Confirm `vercel.json` is deployed.
3. Confirm cron path:
   - `/api/cron/daily-refresh`
4. Confirm cron schedule:
   - `0 8 * * *`
5. Confirm the Vercel plan supports the required cron frequency and function duration.
6. Confirm the project uses the Node.js runtime for refresh and Riot routes.
7. Confirm secrets are not exposed to client bundles.
8. Confirm `/admin/status` is not linked from public navigation.
9. Confirm `/admin/status` is noindexed.
10. Confirm function logs are available for ingestion debugging.

## Cron Verification

Before enabling cron for real traffic:

1. Set `INGESTION_CRON_SECRET`.
2. Set `RIOT_REFRESH_PUUIDS` to a small comma-separated list of trusted seed PUUIDs.
3. Keep `RIOT_REFRESH_MATCH_COUNT` low for the first run, such as `5`.
4. Manually call:

```bash
curl -H "Authorization: Bearer $INGESTION_CRON_SECRET" \
  https://your-domain.com/api/cron/daily-refresh
```

5. Check `/api/refresh/status`.
6. Check `/admin/status`.
7. Confirm `ingestion_jobs` includes the parent daily job and child jobs.
8. Confirm `ingestion_runs` includes the parent pipeline run and phase runs.
9. Confirm persisted matches were written to `riot_matches`.
10. Confirm participants were written to `riot_match_participants`.
11. Confirm champion stats, builds, augment stats, and broken scores were updated.

## Ingestion Pipeline Readiness

Ready:

- Riot client and rate-limit handling exist.
- Match discovery and match detail fetching exist.
- Normalization exists.
- Idempotent match persistence exists through RPC.
- Pipeline orchestration exists.
- Job/run tracking exists.
- Concurrent duplicate pipeline lock exists.
- Daily/manual/champion refresh entrypoints exist.

Needs verification or follow-up:

- Real database migrations must be applied.
- Schema naming must be aligned.
- Reference data must be seeded.
- Vercel runtime duration must be tested with realistic batch sizes.
- Riot queue IDs must be verified for the target modes.
- Seed PUUID strategy must be defined.
- Retry/backoff is tracked in job status, but there is no separate worker that automatically retries failed jobs yet.
- Large-scale ingestion should eventually move from route execution to a queue/worker model.

## Admin Dashboard Readiness

Ready:

- Route exists at `/admin/status`.
- It is dynamic and server-rendered.
- It reads refresh health and status endpoints.
- It shows current patch, last refresh time, job status, failures, matches processed, data source, cron status, Riot config state, and pipeline state.
- It is not linked from public pages.
- Metadata is set to noindex.

Known limitations:

- Authentication is intentionally not implemented yet.
- Dashboard data depends on refresh endpoints and Supabase availability.
- If refresh endpoints are protected and no internal secret is configured, the dashboard may show endpoint errors.

## Step-by-Step Launch Checklist

### 1. Freeze Schema Direction

- Decide whether production Supabase columns will be snake_case or camelCase.
- Update either migrations or application code/types so they match exactly.
- Regenerate Supabase TypeScript types from the deployed schema.

### 2. Create Production Migrations

- Convert `database/schema.sql` into ordered migration files.
- Include tables, enums, indexes, triggers, and RPC functions.
- Add RLS policies or document service-role-only access.

### 3. Provision Supabase

- Create production project.
- Apply migrations.
- Add required extensions.
- Verify RPC execution.
- Verify table indexes.
- Verify RLS behavior.

### 4. Seed Reference Data

- Insert active patch.
- Seed champions from Data Dragon.
- Seed items from Data Dragon.
- Seed augments from the chosen Riot/Arena augment source.
- Verify champion Riot keys, item Riot IDs, and augment Riot IDs.

### 5. Configure Vercel Environment

- Add Supabase public URL and anon key.
- Add Supabase service role key.
- Add Riot API key.
- Add Riot routing defaults.
- Add refresh and verification secrets.
- Add refresh PUUIDs.
- Set production site URL.

### 6. Deploy Without Cron Enabled for Broad Runs

- Deploy the app.
- Confirm public pages still render with fallback behavior.
- Confirm `/api/riot/verify` works.
- Confirm `/api/refresh/health` works.
- Confirm `/api/refresh/status` works.
- Confirm `/admin/status` renders.

### 7. Run a Small Manual Ingestion

- Use `POST /api/refresh/run` with explicit `matchIds`.
- Process one or two known matches first.
- Verify match and participant rows.
- Verify all aggregation phase jobs complete.
- Verify generated stats appear in database tables.

### 8. Run a Small Daily-Style Refresh

- Set `RIOT_REFRESH_MATCH_COUNT=5`.
- Set a small `RIOT_REFRESH_PUUIDS` list.
- Call `/api/cron/daily-refresh` manually.
- Confirm job/run status in `/admin/status`.
- Confirm live repository reads return database data.

### 9. Validate Public Data

- Check homepage top champions.
- Check champion detail pages.
- Check tier list.
- Check broken builds.
- Check augments.
- Confirm mock fallback still works if a table is incomplete.

### 10. Enable Scheduled Refresh

- Confirm Vercel cron is active.
- Confirm cron requests include the expected authorization behavior.
- Keep refresh batch sizes conservative at first.
- Monitor `/admin/status` daily.
- Watch Vercel logs and Supabase logs for rate limits, timeouts, and failed jobs.

### 11. Post-Launch Hardening

- Add authentication to `/admin/status`.
- Add retry worker for failed/rate-limited jobs.
- Add alerting for failed refreshes.
- Add patch auto-detection and patch rollover.
- Move large ingestion workloads to a queue or background worker.
- Add integration tests against a staging Supabase project.
- Add migration drift checks in CI.

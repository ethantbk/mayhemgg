# MayhemGG

MayhemGG is a production-style Next.js app for League of Legends ARAM Mayhem and Arena statistics, builds, tier lists, augments, and champion guides.

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Component-based architecture
- Mock data from `src/data/mockData.ts`

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Riot Assets

Champion icons, splash art, and item icons are generated through `src/lib/riotAssets.ts` using Riot Data Dragon. Patch display and Data Dragon versioning are centralized in `src/lib/patchConfig.ts`.

Optional patch environment variables:

```bash
NEXT_PUBLIC_PATCH_VERSION=16.11.1
NEXT_PUBLIC_DDRAGON_VERSION=16.11.1
NEXT_PUBLIC_PATCH_STATUS_LABEL="Current Mock Meta"
NEXT_PUBLIC_PATCH_DATA_SOURCE_LABEL="Data Dragon-ready dataset"
```

Augment icons are resolved through `src/lib/augmentAssets.ts` from `/public/images/augments`. Add files with names such as `jeweled-gauntlet.png` or `bread-and-butter.png`; missing icons fall back to the MayhemGG-styled augment mark.

## Supabase Foundation

Supabase is installed and prepared for incremental database reads, but the app still uses mock data. The typed client foundation lives in `src/lib/supabase`.

Required variables when you start using Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Use `src/lib/supabase/client.ts` from client components and `src/lib/supabase/server.ts` from server code. Shared result/error helpers live in `src/lib/supabase/errors.ts`.

Server-side repository functions live in `src/server/repositories`. They expose typed champion, build, augment, and tier-list reads with mock-data fallback, so real Supabase queries can be introduced route by route without changing the UI components.

## Riot API Foundation

The first Riot integration layer lives in `src/server/riot`. It includes typed config, a server-only Riot client, Data Dragon helpers, typed API responses, retry handling, and basic `Retry-After` rate-limit handling.

Required variables for Riot connectivity checks:

```bash
RIOT_API_KEY=
RIOT_DEFAULT_PLATFORM_ROUTING=na1
RIOT_DEFAULT_REGIONAL_ROUTING=americas
RIOT_VERIFY_SECRET=
```

Optional tuning variables:

```bash
RIOT_API_BASE_URL_TEMPLATE=https://{routing}.api.riotgames.com
RIOT_API_TIMEOUT_MS=10000
RIOT_API_MAX_RETRIES=2
RIOT_API_RATE_LIMIT_BUFFER_MS=250
RIOT_ARENA_QUEUE_ID=1750
RIOT_ARENA_QUEUE_IDS=1750,1700,1710
RIOT_ARAM_MAYHEM_QUEUE_ID=2400
RIOT_ARAM_MAYHEM_QUEUE_IDS=2400
DATA_DRAGON_BASE_URL=https://ddragon.leagueoflegends.com
```

Connectivity can be verified with `GET /api/riot/verify`. In production, send `x-riot-verify-secret` with `RIOT_VERIFY_SECRET` or `INGESTION_CRON_SECRET`. This endpoint only checks Riot/Data Dragon connectivity; it does not ingest data or replace mock data.

## Scheduled Data Refresh

Phase 10 scheduled refresh support lives in `src/server/refresh` and `src/app/api/refresh`. Vercel cron is configured in `vercel.json` to call `GET /api/cron/daily-refresh` once per day. In production, send `Authorization: Bearer <INGESTION_CRON_SECRET>` or `x-ingestion-cron-secret`.

Refresh variables:

```bash
INGESTION_CRON_SECRET=
RIOT_REFRESH_PUUIDS=
RIOT_REFRESH_MATCH_COUNT=20
RIOT_REFRESH_LOOKBACK_HOURS=24
```

Useful endpoints:

- `GET /api/cron/daily-refresh` runs the daily patch-scoped refresh.
- `POST /api/refresh/run` runs manual refreshes. Use `{ "kind": "champion", "championId": "..." }` for single-champion re-aggregation.
- `GET /api/refresh/health` reports refresh health.
- `GET /api/refresh/status` reports recent ingestion jobs and runs.

Phase 2 match ingestion foundations live in `src/server/ingestion`. They can discover match IDs by PUUID and queue, fetch Match-V5 details, normalize match and participant payloads, and emit structured logs. They do not write to PostgreSQL/Supabase yet.

Phase 3 persistence foundations live in `src/server/ingestion/persistence`. They use the Supabase service-role client to write normalized matches, match participants, ingestion runs, and ingestion job status. Match and participant writes use the `persist_riot_match` PostgreSQL function for transactional, idempotent persistence.

Phase 4 champion aggregation foundations live in `src/server/aggregation`. They read persisted Riot matches and participants by patch/mode, calculate champion win rate, pick rate, Arena ban rate, games played, tier score inputs, and write results into the existing champion statistics tables.

Phase 5 build aggregation also lives in `src/server/aggregation`. It groups persisted participant item sets by champion, patch, and mode, calculates build win rate, pick rate, average placement, and most common item order, then writes generated builds into `builds` and `build_items`.

Phase 6 augment aggregation also lives in `src/server/aggregation`. It groups persisted participant augment picks by patch and mode, calculates augment win rate, pick rate, average placement, champion-pair win rate, and champion-pair pick rate, then writes generated outputs into `augment_statistics` and `augment_best_champions`.

Phase 7 broken score generation also lives in `src/server/aggregation`. It combines champion stats, generated builds, augment performance, placement data, ban pressure, and sample confidence to generate champion broken scores and automatic tiers, then writes them back into the champion statistics tables.

## Project Structure

```txt
src/
  app/          App Router pages and metadata
  components/   Reusable UI and interactive page components
  data/         Mock champion, build, and augment data
  hooks/        Client-side reusable hooks
  lib/          Data access helpers and utilities
  types/        Shared TypeScript models
```

## Future Integration Notes

The UI reads through `src/lib/data.ts`, so Riot API ingestion, PostgreSQL queries, automated rankings, saved builds, and account-based features can be added without rewriting the route components.

The PostgreSQL schema design lives in `database/schema.sql`, with matching TypeScript row types in `src/types/database.ts`. These files are design artifacts only; no database runtime is wired into the app yet.

The Riot API ingestion design lives in `docs/riot-api-integration-architecture.md`. It describes the future data pipeline, aggregation jobs, patch tracking, and rate-limit strategy without implementing API calls.

The step-by-step real pipeline roadmap lives in `docs/data-ingestion-implementation-roadmap.md`. It breaks the work into Riot connection, match ingestion, aggregation, scoring, patch automation, environment variables, background jobs, and deployment requirements.

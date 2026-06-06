# Beginner-Friendly Live Data Setup Guide

This guide explains how to connect MayhemGG to Supabase, Riot APIs, Vercel cron, and the live data refresh endpoints.

The app still keeps mock data as a fallback. That is intentional. Live data starts replacing mocks only after Supabase is configured, the schema exists, an active patch exists, Riot data has been ingested, and aggregation rows are present.

## Before You Start

You need:

- A Supabase account.
- A Vercel project connected to this repo.
- A Riot Developer account and Riot API key.
- The deployed site URL, such as `https://your-project.vercel.app`.
- A local Node setup that can run `npm install` and `npm run dev`.

Important: the existing production checklist notes a database naming-alignment item. The current SQL file uses snake_case database columns, while the TypeScript query layer expects camelCase row fields. Before relying on live production reads, make sure the applied Supabase schema and the app's query layer agree on naming. If live data does not replace mocks after a successful refresh, check this first.

## 1. Create The Supabase Project

1. Go to Supabase and create a new project.
2. Choose an organization.
3. Give the project a name, such as `mayhemgg`.
4. Choose a strong database password and save it somewhere safe.
5. Choose the region closest to your expected users or Vercel region.
6. Wait for the project to finish provisioning.

After it is ready, open the project dashboard.

You will need these values later:

- Project URL: Supabase Dashboard -> Project Settings -> API -> Project URL.
- Anon public key: Supabase Dashboard -> Project Settings -> API -> Project API keys -> anon public.
- Service role key: Supabase Dashboard -> Project Settings -> API -> Project API keys -> service_role.

Do not expose the service role key in browser code. In this app it belongs only in server-side environment variables.

## 2. Apply `database/schema.sql`

In Supabase:

1. Open SQL Editor.
2. Create a new query.
3. Open [database/schema.sql](../database/schema.sql).
4. Paste the whole file into the SQL Editor.
5. Run it.

The schema creates the core MayhemGG tables, including:

- `patches`
- `champions`
- `items`
- `augments`
- `builds`
- `arena_champion_statistics`
- `aram_mayhem_champion_statistics`
- `augment_statistics`
- `tier_lists`
- `riot_matches`
- `riot_match_participants`
- `ingestion_jobs`
- `ingestion_runs`
- `persist_riot_match(...)`

After running the schema, confirm these exist in Supabase Table Editor or SQL Editor.

You also need an active patch row before refresh health can be healthy. Example:

```sql
insert into patches (
  version,
  data_dragon_version,
  status,
  released_at,
  notes
) values (
  '16.11.1',
  '16.11.1',
  'active',
  now(),
  'Initial MayhemGG live data patch.'
);
```

For real aggregation output, you also need static reference rows for champions, items, and augments with Riot IDs. The pipeline stores and aggregates match data, but the read layer maps results through those reference tables.

## 3. Add Environment Variables In Vercel

In Vercel:

1. Open your MayhemGG project.
2. Go to Settings -> Environment Variables.
3. Add the variables below.
4. Apply them to Production. Add Preview and Development too if you deploy those environments.

Recommended production values:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_PATCH_VERSION=16.11.1
NEXT_PUBLIC_DDRAGON_VERSION=16.11.1
NEXT_PUBLIC_PATCH_STATUS_LABEL=Live Patch
NEXT_PUBLIC_PATCH_DATA_SOURCE_LABEL=Riot API + Supabase

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

RIOT_API_KEY=your-riot-api-key
RIOT_DEFAULT_PLATFORM_ROUTING=na1
RIOT_DEFAULT_REGIONAL_ROUTING=americas
RIOT_API_BASE_URL_TEMPLATE=https://{routing}.api.riotgames.com
RIOT_API_TIMEOUT_MS=10000
RIOT_API_MAX_RETRIES=2
RIOT_API_RATE_LIMIT_BUFFER_MS=250
RIOT_ARENA_QUEUE_ID=1700
RIOT_ARAM_MAYHEM_QUEUE_ID=450
DATA_DRAGON_BASE_URL=https://ddragon.leagueoflegends.com

RIOT_VERIFY_SECRET=make-a-long-random-secret
INGESTION_CRON_SECRET=make-a-different-long-random-secret
RIOT_REFRESH_PUUIDS=comma,separated,seed,puuids
RIOT_REFRESH_MATCH_COUNT=5
RIOT_REFRESH_LOOKBACK_HOURS=24
```

Notes:

- Keep `RIOT_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RIOT_VERIFY_SECRET`, and `INGESTION_CRON_SECRET` private.
- Never prefix Riot secrets or service role keys with `NEXT_PUBLIC_`.
- Start with `RIOT_REFRESH_MATCH_COUNT=5`. Increase it only after small refreshes work.
- `RIOT_REFRESH_PUUIDS` is required for daily discovery refreshes. Without it, the daily refresh may run but discover zero matches.

Redeploy after adding or changing Vercel environment variables.

## 4. Add Environment Variables Locally

Create a local `.env.local` file in the project root. Do not commit it.

Use the same values as Vercel, but set the site URL to local development:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PATCH_VERSION=16.11.1
NEXT_PUBLIC_DDRAGON_VERSION=16.11.1
NEXT_PUBLIC_PATCH_STATUS_LABEL=Live Patch
NEXT_PUBLIC_PATCH_DATA_SOURCE_LABEL=Riot API + Supabase

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

RIOT_API_KEY=your-riot-api-key
RIOT_DEFAULT_PLATFORM_ROUTING=na1
RIOT_DEFAULT_REGIONAL_ROUTING=americas
RIOT_API_BASE_URL_TEMPLATE=https://{routing}.api.riotgames.com
RIOT_API_TIMEOUT_MS=10000
RIOT_API_MAX_RETRIES=2
RIOT_API_RATE_LIMIT_BUFFER_MS=250
RIOT_ARENA_QUEUE_ID=1700
RIOT_ARAM_MAYHEM_QUEUE_ID=450
DATA_DRAGON_BASE_URL=https://ddragon.leagueoflegends.com

RIOT_VERIFY_SECRET=make-a-long-random-secret
INGESTION_CRON_SECRET=make-a-different-long-random-secret
RIOT_REFRESH_PUUIDS=comma,separated,seed,puuids
RIOT_REFRESH_MATCH_COUNT=5
RIOT_REFRESH_LOOKBACK_HOURS=24
```

Then run:

```bash
npm install
npm run dev
```

Local URLs use `http://localhost:3000`.

## 5. Get And Add The Riot API Key

1. Sign in to the Riot Developer Portal.
2. Create or copy your development API key.
3. Add it as `RIOT_API_KEY` in Vercel.
4. Add it as `RIOT_API_KEY` in `.env.local`.

Riot development keys expire. If `/api/riot/verify` starts failing after it worked before, generate a fresh key and update both Vercel and local env vars.

For production traffic, apply for a production Riot API key before relying on automated refreshes.

## 6. Configure Cron Secrets

This project has a Vercel cron entry in [vercel.json](../vercel.json):

```json
{
  "path": "/api/cron/daily-refresh",
  "schedule": "0 8 * * *"
}
```

The refresh routes are protected by `INGESTION_CRON_SECRET`. Set this in Vercel and locally.

Accepted auth methods for refresh endpoints:

```bash
Authorization: Bearer your-ingestion-cron-secret
```

or:

```bash
x-ingestion-cron-secret: your-ingestion-cron-secret
```

or:

```bash
?secret=your-ingestion-cron-secret
```

Prefer the bearer header for manual testing.

## 7. Test `/api/riot/verify`

This route verifies Riot API connectivity. It uses `RIOT_VERIFY_SECRET`, or falls back to `INGESTION_CRON_SECRET`.

Local test:

```bash
curl -H "x-riot-verify-secret: your-riot-verify-secret" \
  http://localhost:3000/api/riot/verify
```

Production test:

```bash
curl -H "x-riot-verify-secret: your-riot-verify-secret" \
  https://your-domain.com/api/riot/verify
```

Success means the response has `ok: true`.

Common failures:

- `401`: the secret header is missing or wrong.
- `503`: Riot env vars are missing.
- `429`: Riot rate limit reached.
- `502`: Riot API rejected the request or the key is invalid.

## 8. Test `/api/refresh/health`

This route checks whether Supabase, Riot, an active patch, and pipeline status are ready.

Local test:

```bash
curl -H "Authorization: Bearer your-ingestion-cron-secret" \
  http://localhost:3000/api/refresh/health
```

Production test:

```bash
curl -H "Authorization: Bearer your-ingestion-cron-secret" \
  https://your-domain.com/api/refresh/health
```

A healthy response has:

```json
{
  "ok": true,
  "checks": {
    "supabaseConfigured": true,
    "riotConfigured": true,
    "activePatchAvailable": true,
    "pipelineRunning": false
  }
}
```

If `activePatchAvailable` is false, add an active row to `patches`.

If `supabaseConfigured` is false, check:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 9. Run The First Manual Refresh

Start small. The first run should prove the pipeline works, not ingest the whole world.

Option A: run manual aggregation from already persisted matches:

```bash
curl -X POST \
  -H "Authorization: Bearer your-ingestion-cron-secret" \
  -H "Content-Type: application/json" \
  -d "{\"kind\":\"manual\",\"modes\":[\"arena\",\"aram_mayhem\"],\"patchVersion\":\"16.11.1\"}" \
  https://your-domain.com/api/refresh/run
```

Option B: run a daily-style refresh that discovers matches from `RIOT_REFRESH_PUUIDS`:

```bash
curl -X POST \
  -H "Authorization: Bearer your-ingestion-cron-secret" \
  -H "Content-Type: application/json" \
  -d "{\"kind\":\"daily\",\"modes\":[\"arena\",\"aram_mayhem\"],\"patchVersion\":\"16.11.1\"}" \
  https://your-domain.com/api/refresh/run
```

Option C: call the cron route manually:

```bash
curl -H "Authorization: Bearer your-ingestion-cron-secret" \
  "https://your-domain.com/api/cron/daily-refresh?patchVersion=16.11.1&modes=arena,aram_mayhem"
```

What success looks like:

- The response has `ok: true`.
- Supabase `ingestion_runs` gets new rows.
- Supabase `ingestion_jobs` gets new rows.
- For daily refreshes, `riot_matches` and `riot_match_participants` get rows.
- Aggregation tables begin filling for the active patch.

Check status:

```bash
curl -H "Authorization: Bearer your-ingestion-cron-secret" \
  "https://your-domain.com/api/refresh/status?limit=25"
```

You can also visit:

```text
https://your-domain.com/admin/status
```

That page is intentionally hidden from public navigation, but it is not authentication-protected yet.

## 10. Confirm Live Data Is Replacing Mock Fallbacks

The public pages use repository-backed reads first and mock data only when database reads are missing or incomplete.

Check Supabase first:

1. `patches` has one `active` patch.
2. `champions` has champion rows with Riot IDs.
3. `items` has item rows with Riot item IDs.
4. `augments` has augment rows.
5. `riot_matches` has persisted match rows.
6. `riot_match_participants` has participant rows.
7. `arena_champion_statistics` has rows for the active patch.
8. `aram_mayhem_champion_statistics` has rows for the active patch.
9. `builds`, `build_items`, and `build_augments` have rows for the active patch.
10. `augment_statistics` has rows for the active patch.
11. `tier_lists` and `tier_list_entries` have rows for the active patch.

Then check the app:

1. Open `/admin/status`.
2. Confirm Riot config is shown as configured.
3. Confirm Supabase health is configured.
4. Confirm total matches processed is greater than zero.
5. Open `/champions`.
6. Open `/tier-list`.
7. Open `/broken-builds`.
8. Open `/augments`.

Signs the app is still using mock fallbacks:

- Stats exactly match the original mock dataset.
- `/api/refresh/health` says Supabase is not configured.
- `/api/refresh/health` says no active patch is available.
- Supabase aggregation tables are empty.
- Database rows exist but the app still maps zero usable champions, builds, or stats.

If database rows exist but the app still uses mocks, check the schema naming-alignment warning at the top of this guide. The app's TypeScript repository layer must receive the field names it expects.

## Quick Troubleshooting

`/api/riot/verify` returns 401:

- Check `x-riot-verify-secret`.
- Confirm `RIOT_VERIFY_SECRET` is the same value in the environment you are testing.

`/api/riot/verify` returns 503:

- Add `RIOT_API_KEY`.
- Confirm the deployment was restarted or redeployed after adding env vars.

`/api/refresh/health` returns 401:

- Use `Authorization: Bearer your-ingestion-cron-secret`.
- Confirm `INGESTION_CRON_SECRET` is set.

`/api/refresh/health` says `activePatchAvailable: false`:

- Insert an active row into `patches`.

Manual refresh returns `No active patch is available for refresh`:

- Insert an active patch or pass a valid `patchVersion`.

Daily refresh succeeds but ingests zero matches:

- Add real seed PUUIDs to `RIOT_REFRESH_PUUIDS`.
- Keep `RIOT_REFRESH_MATCH_COUNT` low while testing.
- Confirm the seed accounts have recent matches in the target queue IDs.

Pages still show mock data:

- Confirm aggregation tables have rows for the active patch.
- Confirm champions/items/augments reference tables are seeded.
- Confirm schema field names match what the repository layer reads.

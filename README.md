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

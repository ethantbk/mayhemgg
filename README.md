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

Champion icons, splash art, and item icons are generated through `src/lib/riotAssets.ts` using Riot Data Dragon. The default Data Dragon version is `16.11.1`; set `NEXT_PUBLIC_DDRAGON_VERSION` if you want to pin a different patch.

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

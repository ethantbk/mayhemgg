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

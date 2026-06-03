"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Search, Sparkles, Trophy } from "lucide-react";
import type { Champion } from "@/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ChampionAvatar } from "@/components/ChampionAvatar";

export function HeroBanner({ champions }: { champions: Champion[] }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);

  const matches = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    if (!normalized) return champions.slice(0, 5);
    return champions
      .filter((champion) => champion.name.toLowerCase().includes(normalized) || champion.role.toLowerCase().includes(normalized))
      .slice(0, 5);
  }, [champions, debouncedQuery]);

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(66,214,255,0.18),transparent_32%),linear-gradient(45deg,rgba(255,107,61,0.12),transparent_36%),radial-gradient(circle_at_50%_18%,rgba(184,255,75,0.1),transparent_34%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-abyss to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-volt/30 bg-volt/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-volt">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Patch-ready mock meta
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
            MayhemGG
          </h1>
          <p className="mt-5 max-w-2xl text-xl font-semibold leading-8 text-slate-200 sm:text-2xl">
            The ultimate ARAM Mayhem and Arena build database.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-400">
            Find best builds, broken augment stacks, champion rankings, item synergies, and fast guides for the most chaotic League of Legends modes.
          </p>

          <div className="mt-8 max-w-2xl">
            <label className="relative block">
              <span className="sr-only">Search champions</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Jinx, Brand, Arena tanks..."
                className="h-14 w-full rounded-md border border-white/[0.12] bg-abyss/[0.72] pl-12 pr-4 text-base font-bold text-white shadow-card outline-none transition placeholder:text-slate-500 focus:border-frost/[0.55] focus:ring-4 focus:ring-frost/10"
              />
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {matches.map((champion) => (
                <Link
                  key={champion.slug}
                  href={`/champions/${champion.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-center text-xs font-black text-slate-200 transition hover:-translate-y-0.5 hover:border-frost/[0.45] hover:bg-white/[0.08] hover:text-white"
                >
                  <ChampionAvatar name={champion.name} className="h-5 w-5 text-[9px]" />
                  {champion.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/champions"
              className="inline-flex items-center gap-2 rounded-md bg-frost px-5 py-3 text-sm font-black text-abyss shadow-glow transition hover:-translate-y-0.5 hover:bg-volt"
            >
              Explore Champions
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/broken-builds"
              className="inline-flex items-center gap-2 rounded-md border border-ember/40 bg-ember/10 px-5 py-3 text-sm font-black text-ember transition hover:-translate-y-0.5 hover:bg-ember/20 hover:text-white"
            >
              <Flame className="h-4 w-4" aria-hidden="true" />
              See Broken Builds
            </Link>
          </div>
        </div>

        <div className="premium-border glass-panel stat-grid relative min-h-[28rem] overflow-hidden rounded-lg p-5 shadow-card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(66,214,255,0.18),transparent_25%),radial-gradient(circle_at_80%_25%,rgba(255,107,61,0.16),transparent_26%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Live Board</p>
                <p className="mt-1 text-2xl font-black text-white">Mayhem Index</p>
              </div>
              <Trophy className="h-8 w-8 text-volt" aria-hidden="true" />
            </div>
            <div className="mt-8 space-y-3">
              {champions.slice(0, 5).map((champion, index) => (
                <Link
                  key={champion.slug}
                  href={`/champions/${champion.slug}`}
                  className="group/item grid grid-cols-[2.2rem_2.5rem_1fr_auto] items-center gap-3 rounded-md border border-white/10 bg-abyss/[0.58] p-3 transition hover:-translate-y-0.5 hover:border-frost/40 hover:bg-white/[0.065]"
                >
                  <span className="text-lg font-black text-slate-500">0{index + 1}</span>
                  <ChampionAvatar name={champion.name} className="h-10 w-10 text-sm" />
                  <span>
                    <span className="block font-black text-white">{champion.name}</span>
                    <span className="line-clamp-1 text-xs font-bold text-slate-500">{champion.arenaStats.brokenBuild.name}</span>
                  </span>
                  <span className="rounded-md bg-volt/[0.12] px-2 py-1 text-sm font-black text-volt">{champion.arenaStats.brokenBuild.brokenScore}</span>
                </Link>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-md border border-white/10 bg-white/[0.045] p-3">
                <p className="text-2xl font-black text-frost">15</p>
                <p className="text-xs font-bold text-slate-500">Champions</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.045] p-3">
                <p className="text-2xl font-black text-ember">30</p>
                <p className="text-xs font-bold text-slate-500">Builds</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.045] p-3">
                <p className="text-2xl font-black text-volt">12</p>
                <p className="text-xs font-bold text-slate-500">Augments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

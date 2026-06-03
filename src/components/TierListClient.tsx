"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import type { Champion, Mode, Tier } from "@/types";
import { formatPercent, modeToStatsKey, tierOrder } from "@/lib/utils";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { ModeToggle } from "@/components/ModeToggle";
import { TierBadge } from "@/components/TierBadge";

export function TierListClient({ championsByMode }: { championsByMode: Record<Mode, Record<Tier, Champion[]>> }) {
  const [mode, setMode] = useState<Mode>("arena");
  const tiers = championsByMode[mode];

  return (
    <div className="space-y-6">
      <div className="premium-border flex flex-col gap-4 rounded-lg bg-panel/[0.72] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-volt">Mode Ranking</p>
          <p className="mt-1 text-sm font-semibold text-slate-400">Switch modes to compare win-rate leaders and meta reliability.</p>
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>
      {tierOrder.map((tier) => (
        <section key={tier} className="premium-border overflow-hidden rounded-lg bg-panel/[0.72] shadow-card">
          <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
            <TierBadge tier={tier} className="h-11 text-base" />
            <div>
              <h2 className="text-xl font-black text-white">Tier {tier}</h2>
              <p className="text-sm font-semibold text-slate-500">{tiers[tier].length} champions</p>
            </div>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <TrendingUp className="h-4 w-4 text-frost" aria-hidden="true" />
              Sorted by {mode === "arena" ? "Arena" : "ARAM Mayhem"} WR
            </div>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {tiers[tier].map((champion) => {
              const stats = champion[modeToStatsKey(mode)];
              return (
                <Link
                  key={champion.slug}
                  href={`/champions/${champion.slug}`}
                  className="card-hover group grid grid-cols-[3rem_1fr] gap-3 rounded-md border border-white/10 bg-white/[0.045] p-3 sm:grid-cols-[3rem_1fr_auto]"
                >
                  <ChampionAvatar name={champion.name} className="h-12 w-12" />
                  <div>
                    <p className="font-black text-white">{champion.name}</p>
                    <p className="text-xs font-bold text-slate-500">{champion.role} · {champion[modeToStatsKey(mode)].bestBuild.name}</p>
                  </div>
                  <div className="col-span-2 grid grid-cols-[1fr_1fr_auto] items-center gap-3 border-t border-white/10 pt-3 text-left sm:col-span-1 sm:flex sm:border-t-0 sm:pt-0 sm:text-right">
                    <div>
                      <p className="text-sm font-black text-volt">{formatPercent(stats.winRate)}</p>
                      <p className="text-[11px] font-semibold text-slate-500">Win</p>
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{formatPercent(stats.pickRate)}</p>
                      <p className="text-[11px] font-semibold text-slate-500">Pick</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-frost transition group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

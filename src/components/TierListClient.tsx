"use client";

import { useState } from "react";
import Link from "next/link";
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
      <div className="flex justify-start">
        <ModeToggle mode={mode} onChange={setMode} />
      </div>
      {tierOrder.map((tier) => (
        <section key={tier} className="premium-border rounded-lg bg-panel/[0.72] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <TierBadge tier={tier} className="h-11 text-base" />
            <div>
              <h2 className="text-xl font-black text-white">Tier {tier}</h2>
              <p className="text-sm font-semibold text-slate-500">{tiers[tier].length} champions</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {tiers[tier].map((champion) => {
              const stats = champion[modeToStatsKey(mode)];
              return (
                <Link
                  key={champion.slug}
                  href={`/champions/${champion.slug}`}
                  className="card-hover grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-md border border-white/10 bg-white/[0.045] p-3"
                >
                  <ChampionAvatar name={champion.name} className="h-12 w-12" />
                  <div>
                    <p className="font-black text-white">{champion.name}</p>
                    <p className="text-xs font-bold text-slate-500">{champion.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-volt">{formatPercent(stats.winRate)}</p>
                    <p className="text-xs font-semibold text-slate-500">{formatPercent(stats.pickRate)} PR</p>
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

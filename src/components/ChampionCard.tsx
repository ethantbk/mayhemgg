import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Champion, Mode } from "@/types";
import { formatPercent, modeToStatsKey } from "@/lib/utils";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { TierBadge } from "@/components/TierBadge";

export function ChampionCard({ champion, mode = "arena" }: { champion: Champion; mode?: Mode }) {
  const stats = champion[modeToStatsKey(mode)];

  return (
    <Link href={`/champions/${champion.slug}`} className="card-hover premium-border group block rounded-lg bg-panel/[0.76] p-4">
      <div className="flex items-start gap-4">
        <ChampionAvatar name={champion.name} className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate text-lg font-black text-white">{champion.name}</h3>
            <TierBadge tier={champion.tier} />
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-400">{champion.role}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Win Rate</p>
          <p className="mt-1 text-xl font-black text-volt">{formatPercent(stats.winRate)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Pick Rate</p>
          <p className="mt-1 text-xl font-black text-white">{formatPercent(stats.pickRate)}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-bold text-slate-400">
        <span>{stats.bestBuild.name}</span>
        <ArrowRight className="h-4 w-4 text-frost transition group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </Link>
  );
}

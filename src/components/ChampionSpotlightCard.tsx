import Link from "next/link";
import { ArrowRight, BadgePercent, Flame } from "lucide-react";
import type { Champion, Mode } from "@/types";
import { formatPercent, modeLabels, modeToStatsKey } from "@/lib/utils";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { ChampionSplash } from "@/components/ChampionSplash";
import { TierBadge } from "@/components/TierBadge";

export function ChampionSpotlightCard({
  champion,
  mode,
  rank
}: {
  champion: Champion;
  mode: Mode;
  rank: number;
}) {
  const stats = champion[modeToStatsKey(mode)];

  return (
    <Link href={`/champions/${champion.slug}`} className="card-hover shine premium-border group relative min-h-[21rem] overflow-hidden rounded-lg bg-panel shadow-card">
      <ChampionSplash name={champion.name} className="opacity-45 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/70 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ChampionAvatar name={champion.name} className="h-14 w-14" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-frost">{modeLabels[mode]}</p>
              <h3 className="mt-1 text-2xl font-black text-white">{champion.name}</h3>
            </div>
          </div>
          <TierBadge tier={champion.tier} />
        </div>

        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-ember/[0.35] bg-ember/[0.12] px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-ember">
            <Flame className="h-4 w-4" aria-hidden="true" />
            Spotlight #{rank}
          </div>
          <p className="text-sm leading-6 text-slate-300">{stats.brokenBuild.explanation}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
              <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <BadgePercent className="h-3.5 w-3.5" aria-hidden="true" />
                Win Rate
              </p>
              <p className="mt-1 text-2xl font-black text-volt">{formatPercent(stats.winRate)}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.06] p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Broken Score</p>
              <p className="mt-1 text-2xl font-black text-white">{stats.brokenBuild.brokenScore}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-sm font-black text-frost">
            <span>{stats.brokenBuild.name}</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
          </div>
        </div>
      </div>
    </Link>
  );
}

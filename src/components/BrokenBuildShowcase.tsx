import Link from "next/link";
import { ArrowRight, Flame, Gauge } from "lucide-react";
import type { Build, Champion, Mode } from "@/types";
import { formatPercent, modeLabels } from "@/lib/utils";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { ChampionSplash } from "@/components/ChampionSplash";
import { ItemPill } from "@/components/ItemPill";

type BrokenBuildEntry = {
  champion: Champion;
  mode: Mode;
  build: Build;
  augments: string[];
  winRate: number;
};

export function BrokenBuildShowcase({ builds }: { builds: BrokenBuildEntry[] }) {
  const [featured, ...secondaryBuilds] = builds;

  if (!featured) {
    return null;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
      <Link href={`/champions/${featured.champion.slug}`} className="card-hover shine premium-border group relative overflow-hidden rounded-lg bg-panel p-5 shadow-card">
        <ChampionSplash name={featured.champion.name} className="opacity-40 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-abyss via-abyss/[0.82] to-abyss/[0.35]" />
        <div className="relative z-10 flex min-h-[26rem] flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <ChampionAvatar name={featured.champion.name} className="h-16 w-16" />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-ember">{modeLabels[featured.mode]}</p>
                <h3 className="mt-1 text-3xl font-black tracking-tight text-white">{featured.champion.name}</h3>
                <p className="mt-1 text-sm font-bold text-frost">{featured.build.name}</p>
              </div>
            </div>
            <div className="rounded-md border border-ember/40 bg-ember/[0.12] px-4 py-3 text-right">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-ember">Broken</p>
              <p className="mt-1 text-3xl font-black text-white">{featured.build.brokenScore}</p>
            </div>
          </div>

          <div>
            <p className="max-w-2xl text-base leading-7 text-slate-300">{featured.build.explanation}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {featured.build.fullBuild.slice(0, 4).map((item) => (
                <ItemPill key={item.name} item={item} />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {featured.augments.map((augment) => (
                <span key={augment} className="rounded-md border border-frost/25 bg-frost/[0.08] px-3 py-2 text-xs font-black text-frost">
                  {augment}
                </span>
              ))}
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-volt">
              View full guide
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </div>
        </div>
      </Link>

      <div className="grid gap-4">
        {secondaryBuilds.map((entry, index) => (
          <Link
            key={`${entry.champion.slug}-${entry.mode}`}
            href={`/champions/${entry.champion.slug}`}
            className="card-hover premium-border grid gap-4 rounded-lg bg-panel/[0.76] p-4 sm:grid-cols-[4rem_1fr_auto]"
          >
            <ChampionAvatar name={entry.champion.name} className="h-16 w-16" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-white/10 bg-white/[0.055] px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  #{index + 2}
                </span>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-frost">{modeLabels[entry.mode]}</span>
              </div>
              <h3 className="mt-2 text-lg font-black text-white">{entry.champion.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-400">{entry.build.name}</p>
            </div>
            <div className="flex items-center gap-3 sm:flex-col sm:items-end">
              <span className="inline-flex items-center gap-1 rounded-md border border-ember/[0.35] bg-ember/10 px-3 py-2 text-sm font-black text-ember">
                <Flame className="h-4 w-4" aria-hidden="true" />
                {entry.build.brokenScore}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-volt/[0.35] bg-volt/10 px-3 py-2 text-sm font-black text-volt">
                <Gauge className="h-4 w-4" aria-hidden="true" />
                {formatPercent(entry.winRate)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

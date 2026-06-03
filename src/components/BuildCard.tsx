import Link from "next/link";
import { Flame, Gauge } from "lucide-react";
import type { Build, Champion, Mode } from "@/types";
import { formatPercent, modeLabels } from "@/lib/utils";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { ItemPill } from "@/components/ItemPill";

export function BuildCard({
  champion,
  mode,
  build,
  augments,
  winRate
}: {
  champion: Champion;
  mode: Mode;
  build: Build;
  augments: string[];
  winRate: number;
}) {
  return (
    <article className="card-hover premium-border rounded-lg bg-panel/80 p-5 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <ChampionAvatar name={champion.name} className="h-16 w-16" />
          <div>
            <p className="text-sm font-bold text-slate-400">{modeLabels[mode]}</p>
            <h3 className="text-xl font-black text-white">{champion.name}</h3>
            <p className="text-sm font-semibold text-frost">{build.name}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div className="rounded-md border border-ember/[0.35] bg-ember/10 px-3 py-2">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ember">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              Score
            </p>
            <p className="mt-1 text-2xl font-black text-white">{build.brokenScore}</p>
          </div>
          <div className="rounded-md border border-volt/[0.35] bg-volt/10 px-3 py-2">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-volt">
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              WR
            </p>
            <p className="mt-1 text-2xl font-black text-white">{formatPercent(winRate)}</p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-300 sm:text-[15px]">{build.explanation}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Items</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {build.fullBuild.map((item) => (
              <ItemPill key={item.name} item={item} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Augments</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {augments.map((augment) => (
              <span key={augment} className="rounded-md border border-frost/20 bg-frost/[0.08] px-3 py-2 text-xs font-bold text-frost">
                {augment}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Link href={`/champions/${champion.slug}`} className="mt-5 inline-flex rounded-md border border-volt/25 bg-volt/10 px-3 py-2 text-sm font-black text-volt transition hover:border-volt/50 hover:bg-volt/[0.15] hover:text-white">
        View champion guide
      </Link>
    </article>
  );
}

import Link from "next/link";
import type { Augment, Champion } from "@/types";
import { formatPercent } from "@/lib/utils";
import { AugmentIcon } from "@/components/AugmentIcon";

export function AugmentCard({ augment, champions }: { augment: Augment; champions: Champion[] }) {
  const bestChampions = augment.bestChampionSlugs
    .map((slug) => champions.find((champion) => champion.slug === slug))
    .filter((champion): champion is Champion => Boolean(champion));

  return (
    <article className="card-hover premium-border rounded-lg bg-panel/[0.78] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <AugmentIcon augment={augment} className="h-12 w-12" />
          <div>
            <h3 className="text-xl font-black text-white">{augment.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{augment.description}</p>
          </div>
        </div>
        <div className="shrink-0 rounded-md border border-volt/[0.35] bg-volt/10 px-3 py-2 text-left sm:text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-volt">Avg WR</p>
          <p className="mt-1 text-xl font-black text-white">{formatPercent(augment.averageWinRate)}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <p className="text-sm font-bold text-slate-400">Pick Rate: <span className="text-white">{formatPercent(augment.pickRate)}</span></p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {bestChampions.map((champion) => (
          <Link
            key={champion.slug}
            href={`/champions/${champion.slug}`}
            className="rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-frost/[0.35] hover:text-white"
          >
            {champion.name}
          </Link>
        ))}
      </div>
    </article>
  );
}

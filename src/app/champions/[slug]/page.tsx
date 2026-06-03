import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { ChampionModeDetails } from "@/components/ChampionModeDetails";
import { StatBox } from "@/components/StatBox";
import { TierBadge } from "@/components/TierBadge";
import { getAllChampions, getAugments, getChampionBySlug, getRelatedChampions } from "@/lib/data";
import { formatPercent } from "@/lib/utils";

type PageParams = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getAllChampions().map((champion) => ({ slug: champion.slug }));
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { slug } = await params;
  const champion = getChampionBySlug(slug);

  if (!champion) {
    return {
      title: "Champion Not Found",
      description: "This MayhemGG champion guide could not be found."
    };
  }

  return {
    title: `${champion.name} Builds`,
    description: `${champion.name} ARAM Mayhem and Arena builds, broken build, augments, item synergies, strengths, weaknesses, and tips.`,
    openGraph: {
      title: `${champion.name} Builds | MayhemGG`,
      description: `${champion.name} guide for ARAM Mayhem and Arena.`
    }
  };
}

export default async function ChampionDetailsPage({ params }: { params: PageParams }) {
  const { slug } = await params;
  const champion = getChampionBySlug(slug);

  if (!champion) {
    notFound();
  }

  const relatedChampions = getRelatedChampions(champion);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="premium-border mb-10 overflow-hidden rounded-lg bg-panel/[0.76] p-5 shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <ChampionAvatar name={champion.name} className="h-20 w-20 sm:h-24 sm:w-24" />
            <div>
              <div className="mb-3 flex items-center gap-3">
                <TierBadge tier={champion.tier} />
                <span className="rounded-md border border-white/10 bg-white/[0.055] px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
                  {champion.role}
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{champion.name}</h1>
              <p className="mt-2 text-sm font-semibold text-slate-400">
                {champion.arenaStats.bestBuild.name} in Arena, {champion.aramMayhemStats.bestBuild.name} in ARAM Mayhem
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[38rem] lg:grid-cols-4">
            <StatBox label="Arena WR" value={formatPercent(champion.arenaStats.winRate)} accent="text-volt" />
            <StatBox label="Arena Pick" value={formatPercent(champion.arenaStats.pickRate)} accent="text-frost" />
            <StatBox label="Mayhem WR" value={formatPercent(champion.aramMayhemStats.winRate)} accent="text-frost" />
            <StatBox label="Difficulty" value={champion.difficulty} />
          </div>
        </div>
      </section>

      <ChampionModeDetails champion={champion} augments={getAugments()} relatedChampions={relatedChampions} />
    </div>
  );
}

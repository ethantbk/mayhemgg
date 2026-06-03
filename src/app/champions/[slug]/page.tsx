import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Activity, BadgePercent, Crosshair, Pickaxe } from "lucide-react";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { ChampionModeDetails } from "@/components/ChampionModeDetails";
import { ChampionSplash } from "@/components/ChampionSplash";
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="premium-border relative mb-10 min-h-[28rem] overflow-hidden rounded-lg bg-panel shadow-card">
        <ChampionSplash name={champion.name} priority className="opacity-[0.62]" />
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/[0.72] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-abyss via-abyss/[0.62] to-transparent" />
        <div className="relative z-10 flex min-h-[28rem] flex-col justify-between gap-8 p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <ChampionAvatar name={champion.name} className="h-24 w-24 sm:h-28 sm:w-28" />
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                <TierBadge tier={champion.tier} />
                <span className="rounded-md border border-white/10 bg-white/[0.055] px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
                  {champion.role}
                </span>
                <span className="rounded-md border border-frost/[0.28] bg-frost/[0.08] px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-frost">
                  {champion.difficulty}
                </span>
              </div>
                <h1 className="text-5xl font-black leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">{champion.name}</h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-300 sm:text-base">
                {champion.arenaStats.bestBuild.name} in Arena, {champion.aramMayhemStats.bestBuild.name} in ARAM Mayhem
              </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{champion.guide.playstyle}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[30rem]">
              <StatBox label="Arena Win" value={formatPercent(champion.arenaStats.winRate)} accent="text-volt" />
              <StatBox label="Mayhem Win" value={formatPercent(champion.aramMayhemStats.winRate)} accent="text-frost" />
              <StatBox label="Arena Pick" value={formatPercent(champion.arenaStats.pickRate)} accent="text-white" />
              <StatBox label="Ban Rate" value={champion.arenaStats.banRate ? formatPercent(champion.arenaStats.banRate) : "N/A"} accent="text-ember" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-white/10 bg-abyss/[0.62] p-4 backdrop-blur">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <Crosshair className="h-4 w-4 text-frost" aria-hidden="true" />
                Arena Core
              </p>
              <p className="mt-2 text-sm font-black text-white">{champion.arenaStats.bestBuild.name}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-abyss/[0.62] p-4 backdrop-blur">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <Pickaxe className="h-4 w-4 text-volt" aria-hidden="true" />
                Mayhem Core
              </p>
              <p className="mt-2 text-sm font-black text-white">{champion.aramMayhemStats.bestBuild.name}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-abyss/[0.62] p-4 backdrop-blur">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <Activity className="h-4 w-4 text-ember" aria-hidden="true" />
                Broken Score
              </p>
              <p className="mt-2 text-2xl font-black text-white">{champion.arenaStats.brokenBuild.brokenScore}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-abyss/[0.62] p-4 backdrop-blur">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <BadgePercent className="h-4 w-4 text-volt" aria-hidden="true" />
                Pick Profile
              </p>
              <p className="mt-2 text-sm font-black text-white">{formatPercent(champion.aramMayhemStats.pickRate)} Mayhem PR</p>
            </div>
          </div>
        </div>
      </section>

      <ChampionModeDetails champion={champion} augments={getAugments()} relatedChampions={relatedChampions} />
    </div>
  );
}

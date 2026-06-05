import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Activity, BadgePercent, Crosshair, Pickaxe } from "lucide-react";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { ChampionModeDetails } from "@/components/ChampionModeDetails";
import { ChampionSplash } from "@/components/ChampionSplash";
import { StatBox } from "@/components/StatBox";
import { TierBadge } from "@/components/TierBadge";
import { getPatchLabel } from "@/lib/patchConfig";
import { formatPercent } from "@/lib/utils";
import { getAugments } from "@/server/repositories/augmentsRepository";
import { getChampions, getChampionBySlug, getRelatedChampions } from "@/server/repositories/championsRepository";

type PageParams = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const champions = await getChampions();
  return champions.map((champion) => ({ slug: champion.slug }));
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { slug } = await params;
  const champion = await getChampionBySlug(slug);

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
  const [champion, augments] = await Promise.all([getChampionBySlug(slug), getAugments()]);

  if (!champion) {
    notFound();
  }

  const relatedChampions = await getRelatedChampions(champion);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="premium-border hero-depth relative mb-14 min-h-[34rem] overflow-hidden rounded-lg bg-panel">
        <ChampionSplash name={champion.name} priority className="scale-105 opacity-[0.72]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(66,214,255,0.24),transparent_30%),radial-gradient(circle_at_38%_74%,rgba(184,255,75,0.14),transparent_34%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/[0.74] to-abyss/[0.12]" />
        <div className="absolute inset-0 bg-gradient-to-r from-abyss via-abyss/[0.68] to-transparent" />
        <div className="relative z-10 flex min-h-[34rem] flex-col justify-between gap-10 p-5 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <ChampionAvatar name={champion.name} className="h-24 w-24 ring-4 ring-frost/[0.16] sm:h-32 sm:w-32" />
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <TierBadge tier={champion.tier} />
                  <span className="rounded-md border border-frost/[0.28] bg-frost/[0.08] px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-frost">
                    {getPatchLabel()}
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/[0.055] px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
                    {champion.role}
                  </span>
                  <span className="rounded-md border border-frost/[0.28] bg-frost/[0.08] px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-frost">
                    {champion.difficulty}
                  </span>
                </div>
                <h1 className="text-6xl font-black leading-none tracking-tight text-white sm:text-7xl lg:text-8xl">{champion.name}</h1>
                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-200 sm:text-lg">
                  {champion.arenaStats.bestBuild.name} in Arena, {champion.aramMayhemStats.bestBuild.name} in ARAM Mayhem
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">{champion.guide.playstyle}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[31rem]">
              <StatBox label="Arena Win" value={formatPercent(champion.arenaStats.winRate)} accent="text-volt" className="bg-volt/[0.08] ring-1 ring-volt/[0.18]" />
              <StatBox label="Mayhem Win" value={formatPercent(champion.aramMayhemStats.winRate)} accent="text-frost" className="bg-frost/[0.08] ring-1 ring-frost/[0.18]" />
              <StatBox label="Arena Pick" value={formatPercent(champion.arenaStats.pickRate)} accent="text-white" />
              <StatBox label="Ban Rate" value={champion.arenaStats.banRate ? formatPercent(champion.arenaStats.banRate) : "N/A"} accent="text-ember" className="bg-ember/[0.08] ring-1 ring-ember/[0.16]" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="row-hover rounded-md border border-white/10 bg-abyss/[0.66] p-4 backdrop-blur">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <Crosshair className="h-4 w-4 text-frost" aria-hidden="true" />
                Arena Core
              </p>
              <p className="mt-2 text-sm font-black text-white">{champion.arenaStats.bestBuild.name}</p>
            </div>
            <div className="row-hover rounded-md border border-white/10 bg-abyss/[0.66] p-4 backdrop-blur">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <Pickaxe className="h-4 w-4 text-volt" aria-hidden="true" />
                Mayhem Core
              </p>
              <p className="mt-2 text-sm font-black text-white">{champion.aramMayhemStats.bestBuild.name}</p>
            </div>
            <div className="row-hover rounded-md border border-ember/[0.28] bg-ember/[0.1] p-4 backdrop-blur">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <Activity className="h-4 w-4 text-ember" aria-hidden="true" />
                Broken Score
              </p>
              <p className="mt-2 text-3xl font-black text-white">{champion.arenaStats.brokenBuild.brokenScore}</p>
            </div>
            <div className="row-hover rounded-md border border-white/10 bg-abyss/[0.66] p-4 backdrop-blur">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <BadgePercent className="h-4 w-4 text-volt" aria-hidden="true" />
                Pick Profile
              </p>
              <p className="mt-2 text-sm font-black text-white">{formatPercent(champion.aramMayhemStats.pickRate)} Mayhem PR</p>
            </div>
          </div>
        </div>
      </section>

      <ChampionModeDetails champion={champion} augments={augments} relatedChampions={relatedChampions} />
    </div>
  );
}

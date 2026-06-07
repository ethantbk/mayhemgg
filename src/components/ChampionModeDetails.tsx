"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Flame, Lightbulb, ShieldAlert, Sparkles, Swords, Target, TrendingUp, Zap } from "lucide-react";
import type { Augment, Champion, Mode } from "@/types";
import { formatPercent, modeLabels, modeToStatsKey } from "@/lib/utils";
import { ChampionCard } from "@/components/ChampionCard";
import { ModeToggle } from "@/components/ModeToggle";
import { SectionHeader } from "@/components/SectionHeader";
import { StatBox } from "@/components/StatBox";
import { ItemPill } from "@/components/ItemPill";
import { AugmentIcon } from "@/components/AugmentIcon";

function BulletList({ items, icon }: { items: string[]; icon: ReactNode }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
          <span className="mt-1 text-frost">{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ModeInsightCard({ champion, mode }: { champion: Champion; mode: Mode }) {
  const stats = champion[modeToStatsKey(mode)];
  const isArena = mode === "arena";

  return (
    <article className="card-hover premium-border rounded-lg bg-gradient-to-br from-panel/[0.82] to-abyss p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-frost">{modeLabels[mode]}</p>
          <h3 className="mt-2 text-xl font-black text-white">{isArena ? "Duel Pressure Plan" : "Bridge Control Plan"}</h3>
        </div>
        <span className="rounded-md border border-volt/[0.28] bg-volt/[0.08] px-3 py-2 text-sm font-black text-volt">
          {formatPercent(stats.winRate)}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        {isArena
          ? `${champion.name} is strongest when the round slows down long enough to force ${stats.bestBuild.name} value. Prioritize partner spacing, first cooldown tracking, and the first takedown window.`
          : `${champion.name} converts constant ARAM Mayhem contact into repeatable pressure. Play around wave states, health pack timing, and choke points before committing to ${stats.brokenBuild.name}.`}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Pick Rate</p>
          <p className="mt-1 text-lg font-black text-white">{formatPercent(stats.pickRate)}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Games</p>
          <p className="mt-1 text-lg font-black text-white">{stats.gamesPlayed?.toLocaleString() ?? "0"}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Broken</p>
          <p className="mt-1 text-lg font-black text-ember">{stats.brokenBuild.brokenScore}</p>
        </div>
      </div>
    </article>
  );
}

export function ChampionModeDetails({
  champion,
  augments,
  relatedChampions
}: {
  champion: Champion;
  augments: Augment[];
  relatedChampions: Champion[];
}) {
  const [mode, setMode] = useState<Mode>("arena");
  const stats = champion[modeToStatsKey(mode)];
  const selectedAugments = stats.augments
    .map((augmentId) => augments.find((augment) => augment.id === augmentId))
    .filter((augment): augment is Augment => Boolean(augment));

  return (
    <div className="space-y-14">
      <section className="premium-border rounded-lg bg-gradient-to-br from-panel/[0.88] via-panel/[0.72] to-abyss p-5 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-frost">{modeLabels[mode]} snapshot</p>
            <h2 className="mt-2 text-2xl font-black text-white">Mode Statistics</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Switch modes to update builds, augment recommendations, item synergies, and related champion context.</p>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatBox label="Tier" value={champion.tier} accent="text-volt" className="bg-volt/[0.08] ring-1 ring-volt/[0.18]" />
          <StatBox label="Win Rate" value={formatPercent(stats.winRate)} accent="text-volt" className="bg-volt/[0.08] ring-1 ring-volt/[0.18]" />
          <StatBox label="Pick Rate" value={formatPercent(stats.pickRate)} accent="text-frost" />
          <StatBox label="Games" value={stats.gamesPlayed?.toLocaleString() ?? "0"} accent="text-white" />
          <StatBox label="Broken" value={`${stats.brokenBuild.brokenScore}`} accent="text-ember" className="bg-ember/[0.08] ring-1 ring-ember/[0.16]" />
          <StatBox label="Difficulty" value={champion.difficulty} accent="text-white" />
        </div>
      </section>

      <section className="pt-1">
        <SectionHeader
          eyebrow="Mode Insights"
          title="How This Pick Wins Each Mode"
          description="Arena and ARAM Mayhem reward different timings, spacing, and build priorities."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <ModeInsightCard champion={champion} mode="arena" />
          <ModeInsightCard champion={champion} mode="aramMayhem" />
        </div>
      </section>

      <section className="pt-2">
        <SectionHeader eyebrow="Best Build" title={stats.bestBuild.name} description={stats.bestBuild.explanation} />
        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="premium-border rounded-lg bg-gradient-to-br from-panel/[0.78] to-abyss p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
              <Target className="h-4 w-4 text-volt" aria-hidden="true" />
              Item Order
            </div>
            <div className="space-y-3">
              {stats.bestBuild.itemOrder.map((item, index) => (
                <div key={item.name} className="row-hover grid grid-cols-[2rem_1fr] items-center gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3">
                  <span className="text-center text-sm font-black text-slate-500">{index + 1}</span>
                  <ItemPill item={item} />
                </div>
              ))}
            </div>
          </div>
          <div className="premium-border rounded-lg bg-gradient-to-br from-panel/[0.78] to-abyss p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
              <Swords className="h-4 w-4 text-frost" aria-hidden="true" />
              Full Build
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.bestBuild.fullBuild.map((item) => <ItemPill key={item.name} item={item} />)}
            </div>
            <div className="mt-5 rounded-md border border-frost/[0.2] bg-frost/[0.06] p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-frost">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                Build Read
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{stats.bestBuild.explanation}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-border feature-depth relative overflow-hidden rounded-lg bg-gradient-to-br from-ember/[0.18] via-panel/[0.88] to-frost/[0.1] p-6 sm:p-7 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_26%,rgba(255,107,61,0.28),transparent_34%),radial-gradient(circle_at_18%_82%,rgba(66,214,255,0.12),transparent_34%)]" />
        <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l from-ember/[0.12] to-transparent" />
        <div className="relative z-10 mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ember">
          <Flame className="h-5 w-5" aria-hidden="true" />
          Most Broken Build
        </div>
        <div className="relative z-10 grid gap-7 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">{stats.brokenBuild.name}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">{stats.brokenBuild.explanation}</p>
            <div className="mt-6 inline-flex items-center gap-3 rounded-md border border-ember/[0.45] bg-ember/[0.14] px-4 py-3 text-sm font-black text-ember">
              <span>Broken Score</span>
              <span className="text-3xl text-white">{stats.brokenBuild.brokenScore}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Abuse Path</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.brokenBuild.fullBuild.map((item) => <ItemPill key={item.name} item={item} />)}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="premium-border rounded-lg bg-gradient-to-br from-panel/[0.78] to-abyss p-5 shadow-card">
          <SectionHeader eyebrow="Augments" title="Best Augments" description="Prioritize augments that reinforce the selected mode's win condition." />
          <div className="space-y-3">
            {selectedAugments.map((augment) => (
              <Link key={augment.id} href="/augments" className="card-hover block rounded-md border border-white/10 bg-white/[0.045] p-4 transition hover:border-frost/[0.35]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <AugmentIcon augment={augment} />
                    <div>
                      <p className="font-black text-white">{augment.name}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{augment.description}</p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-volt/[0.25] bg-volt/[0.08] px-2 py-1 text-sm font-black text-volt">
                    {formatPercent(augment.averageWinRate)}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="premium-border rounded-lg bg-gradient-to-br from-panel/[0.78] to-abyss p-5 shadow-card">
          <SectionHeader eyebrow="Items" title="Best Item Synergies" />
          <BulletList items={stats.itemSynergies} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="premium-border rounded-lg bg-gradient-to-br from-panel/[0.78] to-abyss p-5 shadow-card">
          <SectionHeader eyebrow="Profile" title="Strengths" />
          <BulletList items={champion.guide.strengths} icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />} />
        </section>
        <section className="premium-border rounded-lg bg-gradient-to-br from-panel/[0.78] to-abyss p-5 shadow-card">
          <SectionHeader eyebrow="Profile" title="Weaknesses" />
          <BulletList items={champion.guide.weaknesses} icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />} />
        </section>
      </div>

      <section className="premium-border rounded-lg bg-gradient-to-br from-panel/[0.8] via-panel/[0.68] to-abyss p-5 shadow-card">
        <SectionHeader eyebrow="Guide" title="Playstyle Guidance" />
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-md border border-frost/[0.2] bg-frost/[0.06] p-5">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-frost">
              <Zap className="h-4 w-4" aria-hidden="true" />
              Core Identity
            </p>
            <p className="mt-3 text-base leading-8 text-slate-300">{champion.guide.playstyle}</p>
          </div>
          <div>
            <p className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <Activity className="h-4 w-4 text-volt" aria-hidden="true" />
              Tips & Tricks
            </p>
            <BulletList items={champion.guide.tips} icon={<Lightbulb className="h-4 w-4" aria-hidden="true" />} />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Similar Picks" title="Related Champions" />
        <div className="grid gap-4 md:grid-cols-3">
          {relatedChampions.map((related) => (
            <ChampionCard key={related.slug} champion={related} mode={mode} />
          ))}
        </div>
      </section>
    </div>
  );
}

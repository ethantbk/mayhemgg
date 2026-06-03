"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Flame, Lightbulb, ShieldAlert, Sparkles, Swords, Target } from "lucide-react";
import type { Augment, Champion, Mode } from "@/types";
import { formatPercent, modeLabels, modeToStatsKey } from "@/lib/utils";
import { ChampionCard } from "@/components/ChampionCard";
import { ModeToggle } from "@/components/ModeToggle";
import { SectionHeader } from "@/components/SectionHeader";
import { StatBox } from "@/components/StatBox";
import { ItemPill } from "@/components/ItemPill";

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
    <div className="space-y-10">
      <section className="premium-border rounded-lg bg-panel/[0.72] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-frost">{modeLabels[mode]} snapshot</p>
            <h2 className="mt-2 text-2xl font-black text-white">Overview</h2>
          </div>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBox label="Tier" value={champion.tier} accent="text-volt" />
          <StatBox label="Win Rate" value={formatPercent(stats.winRate)} accent="text-volt" />
          <StatBox label="Pick Rate" value={formatPercent(stats.pickRate)} accent="text-frost" />
          <StatBox label="Difficulty" value={champion.difficulty} accent="text-white" />
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Best Build" title={stats.bestBuild.name} description={stats.bestBuild.explanation} />
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="premium-border rounded-lg bg-panel/[0.70] p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
              <Target className="h-4 w-4 text-volt" aria-hidden="true" />
              Item Order
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.bestBuild.itemOrder.map((item) => <ItemPill key={item.name} item={item} />)}
            </div>
          </div>
          <div className="premium-border rounded-lg bg-panel/[0.70] p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
              <Swords className="h-4 w-4 text-frost" aria-hidden="true" />
              Full Build
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.bestBuild.fullBuild.map((item) => <ItemPill key={item.name} item={item} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="premium-border rounded-lg bg-gradient-to-br from-ember/[0.12] via-panel/80 to-frost/[0.08] p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-ember">
          <Flame className="h-5 w-5" aria-hidden="true" />
          Most Broken Build
        </div>
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-black text-white">{stats.brokenBuild.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{stats.brokenBuild.explanation}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-ember/35 bg-ember/10 px-3 py-2 text-sm font-black text-ember">
              Broken Score {stats.brokenBuild.brokenScore}
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Full Build</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {stats.brokenBuild.fullBuild.map((item) => <ItemPill key={item.name} item={item} />)}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="premium-border rounded-lg bg-panel/[0.72] p-5">
          <SectionHeader eyebrow="Augments" title="Best Augments" />
          <div className="space-y-3">
            {selectedAugments.map((augment) => (
              <Link key={augment.id} href="/augments" className="block rounded-md border border-white/10 bg-white/[0.045] p-4 transition hover:border-frost/35">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black text-white">{augment.name}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{augment.description}</p>
                  </div>
                  <span className="shrink-0 text-sm font-black text-volt">{formatPercent(augment.averageWinRate)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="premium-border rounded-lg bg-panel/[0.72] p-5">
          <SectionHeader eyebrow="Items" title="Best Item Synergies" />
          <BulletList items={stats.itemSynergies} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="premium-border rounded-lg bg-panel/[0.72] p-5">
          <SectionHeader eyebrow="Profile" title="Strengths" />
          <BulletList items={champion.guide.strengths} icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />} />
        </section>
        <section className="premium-border rounded-lg bg-panel/[0.72] p-5">
          <SectionHeader eyebrow="Profile" title="Weaknesses" />
          <BulletList items={champion.guide.weaknesses} icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />} />
        </section>
      </div>

      <section className="premium-border rounded-lg bg-panel/[0.72] p-5">
        <SectionHeader eyebrow="Guide" title="Playstyle Guide" />
        <p className="text-base leading-8 text-slate-300">{champion.guide.playstyle}</p>
      </section>

      <section className="premium-border rounded-lg bg-panel/[0.72] p-5">
        <SectionHeader eyebrow="Guide" title="Tips & Tricks" />
        <BulletList items={champion.guide.tips} icon={<Lightbulb className="h-4 w-4" aria-hidden="true" />} />
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

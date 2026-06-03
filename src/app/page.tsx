import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Sparkles } from "lucide-react";
import { BuildCard } from "@/components/BuildCard";
import { ChampionCard } from "@/components/ChampionCard";
import { HeroBanner } from "@/components/HeroBanner";
import { SectionHeader } from "@/components/SectionHeader";
import { getAllChampions, getAugments, getBrokenBuilds, getTopChampions } from "@/lib/data";

export const metadata: Metadata = {
  title: "MayhemGG | ARAM Mayhem and Arena Builds",
  description: "Explore ARAM Mayhem and Arena champion rankings, broken builds, augment combinations, item synergies, and quick champion guides.",
  openGraph: {
    title: "MayhemGG | ARAM Mayhem and Arena Builds",
    description: "The ultimate ARAM Mayhem and Arena build database."
  }
};

export default function HomePage() {
  const champions = getAllChampions();
  const arenaChampions = getTopChampions("arena", 4);
  const aramChampions = getTopChampions("aramMayhem", 4);
  const brokenBuilds = getBrokenBuilds().slice(0, 3);
  const augments = getAugments().slice(0, 4);
  const augmentNames = new Map(getAugments().map((augment) => [augment.id, augment.name]));

  return (
    <>
      <HeroBanner champions={champions} />
      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <SectionHeader
            eyebrow="Arena"
            title="Top Arena Champions"
            description="High-performing picks built for two-player pressure, sustain checks, and round-winning augment spikes."
            action={<Link href="/tier-list" className="text-sm font-black text-frost hover:text-white">Full tier list</Link>}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {arenaChampions.map((champion) => (
              <ChampionCard key={champion.slug} champion={champion} mode="arena" />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="ARAM Mayhem"
            title="Top ARAM Mayhem Champions"
            description="Bridge-dominant champions with strong poke, reliable engage, or reset patterns that thrive in permanent fights."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {aramChampions.map((champion) => (
              <ChampionCard key={champion.slug} champion={champion} mode="aramMayhem" />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Meta Heat"
            title="Most Broken Builds"
            description="The highest broken-score setups in the current mock meta, ranked by oppressive item paths and augment synergy."
            action={<Link href="/broken-builds" className="inline-flex items-center gap-2 text-sm font-black text-ember hover:text-white"><Flame className="h-4 w-4" aria-hidden="true" /> See all</Link>}
          />
          <div className="grid gap-5">
            {brokenBuilds.map((entry) => (
              <BuildCard
                key={`${entry.champion.slug}-${entry.mode}`}
                champion={entry.champion}
                mode={entry.mode}
                build={entry.build}
                augments={entry.augments.map((id) => augmentNames.get(id) ?? id)}
                winRate={entry.winRate}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Augments"
            title="Trending Augments"
            description="Augments with strong average win rates and clear champion identity."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {augments.map((augment) => (
              <Link key={augment.id} href="/augments" className="card-hover premium-border rounded-lg bg-panel/[0.78] p-5">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md border border-frost/30 bg-frost/10 text-frost">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-black text-white">{augment.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{augment.description}</p>
                <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-sm font-bold">
                  <span className="text-slate-500">Average WR</span>
                  <span className="text-volt">{augment.averageWinRate.toFixed(1)}%</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrokenBuildShowcase } from "@/components/BrokenBuildShowcase";
import { ChampionCard } from "@/components/ChampionCard";
import { ChampionSpotlightCard } from "@/components/ChampionSpotlightCard";
import { HeroBanner } from "@/components/HeroBanner";
import { SectionHeader } from "@/components/SectionHeader";
import { AugmentIcon } from "@/components/AugmentIcon";
import { getAugments } from "@/server/repositories/augmentsRepository";
import { getBrokenBuilds } from "@/server/repositories/buildsRepository";
import { getChampions, getTopChampions } from "@/server/repositories/championsRepository";

export const metadata: Metadata = {
  title: "MayhemGG | ARAM Mayhem and Arena Builds",
  description: "Explore ARAM Mayhem and Arena champion rankings, broken builds, augment combinations, item synergies, and quick champion guides.",
  openGraph: {
    title: "MayhemGG | ARAM Mayhem and Arena Builds",
    description: "The ultimate ARAM Mayhem and Arena build database."
  }
};

export default async function HomePage() {
  const [champions, arenaChampions, aramChampions, brokenBuildsRaw, spotlightChampions, augmentsRaw] = await Promise.all([
    getChampions(),
    getTopChampions("arena", 4),
    getTopChampions("aramMayhem", 4),
    getBrokenBuilds(),
    getTopChampions("arena", 3),
    getAugments()
  ]);
  const brokenBuilds = brokenBuildsRaw.slice(0, 4);
  const augments = augmentsRaw.slice(0, 4);
  const augmentNames = new Map(augmentsRaw.map((augment) => [augment.id, augment.name]));
  const showcasedBuilds = brokenBuilds.map((entry) => ({
    ...entry,
    augments: entry.augments.map((id) => augmentNames.get(id) ?? id)
  }));

  return (
    <>
      <HeroBanner champions={champions} />
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <section>
          <SectionHeader
            eyebrow="Champion Spotlights"
            title="Meta Picks Worth Locking In"
            description="High-impact champions with strong stats, practical build paths, and broken-score pressure in the current MayhemGG meta."
            action={<Link href="/champions" className="inline-flex items-center gap-2 text-sm font-black text-frost transition hover:text-white">Browse all <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {spotlightChampions.map((champion, index) => (
              <ChampionSpotlightCard key={champion.slug} champion={champion} mode="arena" rank={index + 1} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Meta Heat"
            title="Featured Most Broken Builds"
            description="The top broken-score setup gets the feature treatment, with the next strongest builds ranked for quick comparison."
            action={<Link href="/broken-builds" className="inline-flex items-center gap-2 text-sm font-black text-ember transition hover:text-white">See all builds <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
          />
          <BrokenBuildShowcase builds={showcasedBuilds} />
        </section>

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
            eyebrow="Augments"
            title="Trending Augments"
            description="Augments with strong average win rates and clear champion identity, tuned for quick scanning."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {augments.map((augment) => (
              <Link key={augment.id} href="/augments" className="card-hover shine premium-border rounded-lg bg-panel/[0.78] p-5 shadow-card">
                <AugmentIcon augment={augment} className="mb-5 h-12 w-12" />
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

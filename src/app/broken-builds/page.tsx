import type { Metadata } from "next";
import { BuildCard } from "@/components/BuildCard";
import { SectionHeader } from "@/components/SectionHeader";
import { getAugments, getBrokenBuilds } from "@/lib/data";
import { getPatchLabel } from "@/lib/patchConfig";

export const metadata: Metadata = {
  title: "Broken Builds",
  description: "Ranked ARAM Mayhem and Arena broken builds by champion, mode, broken score, win rate, augments, items, and explanation.",
  openGraph: {
    title: "MayhemGG Broken Builds",
    description: "The strongest mock-meta builds ranked by broken score."
  }
};

export default function BrokenBuildsPage() {
  const augmentNames = new Map(getAugments().map((augment) => [augment.id, augment.name]));
  const builds = getBrokenBuilds();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow={`Meta Heat | ${getPatchLabel()}`}
        title="Broken Builds"
        description="Ranked strongest-first by broken score, combining win rate, augment abuse, item synergy, and mode-specific reliability."
      />
      <div className="grid gap-5">
        {builds.map((entry) => (
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
    </div>
  );
}

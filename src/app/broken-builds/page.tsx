import type { Metadata } from "next";
import { BuildCard } from "@/components/BuildCard";
import { SectionHeader } from "@/components/SectionHeader";
import { getAugments } from "@/server/repositories/augmentsRepository";
import { getBrokenBuilds } from "@/server/repositories/buildsRepository";
import { getPublishedDataSource } from "@/server/repositories/publishedDataset";

export const metadata: Metadata = {
  title: "Broken Builds",
  description: "Ranked ARAM Mayhem and Arena broken builds by champion, mode, broken score, win rate, augments, items, and explanation.",
  openGraph: {
    title: "MayhemGG Broken Builds",
    description: "The strongest current-patch builds ranked by broken score."
  }
};

export const dynamic = "force-dynamic";

export default async function BrokenBuildsPage() {
  const [dataSource, augments, builds] = await Promise.all([getPublishedDataSource(), getAugments(), getBrokenBuilds()]);
  const augmentNames = new Map(augments.map((augment) => [augment.id, augment.name]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow={`Meta Heat | ${dataSource.patchLabel}`}
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
            patchLabel={dataSource.patchLabel}
          />
        ))}
      </div>
    </div>
  );
}

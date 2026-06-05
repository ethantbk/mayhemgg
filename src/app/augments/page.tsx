import type { Metadata } from "next";
import { AugmentCard } from "@/components/AugmentCard";
import { SectionHeader } from "@/components/SectionHeader";
import { getAugments } from "@/server/repositories/augmentsRepository";
import { getChampions } from "@/server/repositories/championsRepository";

export const metadata: Metadata = {
  title: "Augments",
  description: "Arena and ARAM Mayhem augment database with descriptions, average win rates, best champions, and pick rates.",
  openGraph: {
    title: "MayhemGG Augments",
    description: "Find the best augments and champion combinations."
  }
};

export default async function AugmentsPage() {
  const [champions, augmentsRaw] = await Promise.all([getChampions(), getAugments()]);
  const augments = augmentsRaw.sort((a, b) => b.averageWinRate - a.averageWinRate);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Augment Lab"
        title="Augments"
        description="Average win rate, pick rate, and best champion pairings for high-impact Arena and ARAM Mayhem augment choices."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {augments.map((augment) => (
          <AugmentCard key={augment.id} augment={augment} champions={champions} />
        ))}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { SectionHeader } from "@/components/SectionHeader";
import { TierListClient } from "@/components/TierListClient";
import { getChampionsByTier } from "@/lib/data";

export const metadata: Metadata = {
  title: "Tier List",
  description: "MayhemGG champion tier list for ARAM Mayhem and Arena, grouped by S+, S, A, B, and C tiers.",
  openGraph: {
    title: "MayhemGG Tier List",
    description: "Switch between ARAM Mayhem and Arena champion rankings."
  }
};

export default function TierListPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Rankings"
        title="Champion Tier List"
        description="Mode-specific champion groups based on mock win rate, pick rate, build strength, and practical reliability."
      />
      <TierListClient championsByMode={{ arena: getChampionsByTier("arena"), aramMayhem: getChampionsByTier("aramMayhem") }} />
    </div>
  );
}

import type { Metadata } from "next";
import { ChampionsExplorer } from "@/components/ChampionsExplorer";
import { SectionHeader } from "@/components/SectionHeader";
import { getAllChampions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Champions",
  description: "Search, sort, and filter ARAM Mayhem and Arena champions by role, mode, win rate, pick rate, and tier.",
  openGraph: {
    title: "MayhemGG Champions",
    description: "All ARAM Mayhem and Arena champion statistics and quick guide links."
  }
};

export default function ChampionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Champion Database"
        title="All Champions"
        description="Search the roster, filter by role and mode, and jump into focused build guides for ARAM Mayhem and Arena."
      />
      <ChampionsExplorer champions={getAllChampions()} />
    </div>
  );
}

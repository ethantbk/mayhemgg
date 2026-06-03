"use client";

import { useMemo, useState } from "react";
import type { Champion, Mode, Role } from "@/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { modeToStatsKey } from "@/lib/utils";
import { ChampionCard } from "@/components/ChampionCard";
import { FilterPanel } from "@/components/FilterPanel";
import { SearchBar } from "@/components/SearchBar";

export function ChampionsExplorer({ champions }: { champions: Champion[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "All">("All");
  const [mode, setMode] = useState<Mode | "all">("all");
  const debouncedQuery = useDebouncedValue(query);

  const filteredChampions = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();

    return champions
      .filter((champion) => {
        const matchesSearch = !normalized || champion.name.toLowerCase().includes(normalized) || champion.role.toLowerCase().includes(normalized);
        const matchesRole = role === "All" || champion.role === role;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (mode === "all") {
          const aAverage = (a.arenaStats.winRate + a.aramMayhemStats.winRate) / 2;
          const bAverage = (b.arenaStats.winRate + b.aramMayhemStats.winRate) / 2;
          return bAverage - aAverage;
        }

        return b[modeToStatsKey(mode)].winRate - a[modeToStatsKey(mode)].winRate;
      });
  }, [champions, debouncedQuery, mode, role]);

  const cardMode: Mode = mode === "all" ? "arena" : mode;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_28rem]">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by champion or role..." />
        <FilterPanel role={role} mode={mode} onRoleChange={setRole} onModeChange={setMode} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-400">
          Showing <span className="text-white">{filteredChampions.length}</span> champions sorted by win rate
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredChampions.map((champion) => (
          <ChampionCard key={champion.slug} champion={champion} mode={cardMode} />
        ))}
      </div>
    </div>
  );
}

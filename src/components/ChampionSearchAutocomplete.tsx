"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Champion } from "@/types";
import { cn, formatPercent } from "@/lib/utils";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { TierBadge } from "@/components/TierBadge";

export function ChampionSearchAutocomplete({
  champions,
  value,
  onQueryChange,
  placeholder = "Search champions...",
  maxResults = 6,
  showPopularOnFocus = true,
  className,
  inputClassName
}: {
  champions: Champion[];
  value?: string;
  onQueryChange?: (value: string) => void;
  placeholder?: string;
  maxResults?: number;
  showPopularOnFocus?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  const router = useRouter();
  const listboxId = useId();
  const [internalValue, setInternalValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const query = value ?? internalValue;

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return showPopularOnFocus ? champions.slice(0, maxResults) : [];
    }

    return champions
      .filter((champion) => {
        return (
          champion.name.toLowerCase().includes(normalized) ||
          champion.role.toLowerCase().includes(normalized) ||
          champion.slug.includes(normalized)
        );
      })
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(normalized) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(normalized) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return b.arenaStats.winRate - a.arenaStats.winRate;
      })
      .slice(0, maxResults);
  }, [champions, maxResults, query, showPopularOnFocus]);

  const updateQuery = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onQueryChange?.(nextValue);
    setActiveIndex(0);
    setIsOpen(true);
  };

  const navigateToChampion = (champion: Champion) => {
    setIsOpen(false);
    router.push(`/champions/${champion.slug}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (results.length ? (current + 1) % results.length : 0));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (results.length ? (current - 1 + results.length) % results.length : 0));
    }

    if (event.key === "Enter" && isOpen && results[activeIndex]) {
      event.preventDefault();
      navigateToChampion(results[activeIndex]);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showResults = isOpen && (results.length > 0 || query.trim().length > 0);

  return (
    <div
      className={cn("relative", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <label className="relative block">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls={listboxId}
          aria-activedescendant={showResults && results[activeIndex] ? `${listboxId}-${results[activeIndex].slug}` : undefined}
          className={cn(
            "h-12 w-full rounded-md border border-white/10 bg-white/[0.055] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-frost/[0.5] focus:bg-white/[0.08] focus:ring-4 focus:ring-frost/10",
            inputClassName
          )}
        />
      </label>

      {showResults ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-white/10 bg-abyss/[0.96] p-2 shadow-card backdrop-blur-xl"
        >
          {results.length ? (
            <div className="max-h-[22rem] overflow-y-auto">
              {results.map((champion, index) => (
                <button
                  key={champion.slug}
                  id={`${listboxId}-${champion.slug}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => navigateToChampion(champion)}
                  className={cn(
                    "grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-md p-3 text-left transition",
                    activeIndex === index ? "bg-frost/[0.1] text-white" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <ChampionAvatar name={champion.name} className="h-10 w-10 text-sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{champion.name}</span>
                    <span className="block truncate text-xs font-semibold text-slate-500">
                      {champion.role} | Arena WR {formatPercent(champion.arenaStats.winRate)}
                    </span>
                  </span>
                  <TierBadge tier={champion.tier} />
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm font-semibold text-slate-400">
              No champion found.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

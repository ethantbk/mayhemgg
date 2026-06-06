import Link from "next/link";
import { ArrowRight, Beaker, Bookmark, MessageSquare, ThumbsUp, Zap } from "lucide-react";
import type { ChaosLabBuild } from "@/types/chaosLab";
import { modeLabels } from "@/lib/utils";
import { AugmentIcon } from "@/components/AugmentIcon";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { ItemPill } from "@/components/ItemPill";

function riskClass(risk: ChaosLabBuild["risk"]) {
  if (risk === "Low") return "border-volt/25 bg-volt/[0.08] text-volt";
  if (risk === "Medium") return "border-frost/25 bg-frost/[0.08] text-frost";
  if (risk === "High") return "border-ember/25 bg-ember/[0.08] text-ember";
  return "border-red-400/25 bg-red-400/[0.08] text-red-200";
}

function statusClass(status: ChaosLabBuild["status"]) {
  if (status === "Verified") return "border-volt/25 bg-volt/[0.08] text-volt";
  if (status === "Fresh") return "border-frost/25 bg-frost/[0.08] text-frost";
  if (status === "Testing") return "border-arcane/25 bg-arcane/[0.1] text-violet-200";
  return "border-ember/25 bg-ember/[0.08] text-ember";
}

export function ChaosBuildCard({ build, featured = false }: { build: ChaosLabBuild; featured?: boolean }) {
  return (
    <article className={`group relative card-hover premium-border shine rounded-lg bg-panel/[0.78] p-5 shadow-card ${featured ? "feature-depth border-ember/[0.24] bg-[linear-gradient(145deg,rgba(255,107,61,0.12),rgba(16,22,36,0.9)_42%,rgba(66,214,255,0.08))]" : ""}`}>
      <Link href={`/chaos-lab/${build.id}`} className="absolute inset-0 z-10 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-frost/60 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss" aria-label={`Open ${build.title} Chaos Lab build`}>
        <span className="sr-only">Open {build.title}</span>
      </Link>
      <div className="pointer-events-none relative z-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <ChampionAvatar name={build.championName} className={featured ? "h-20 w-20" : "h-16 w-16"} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-white/10 bg-white/[0.055] px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">
                {modeLabels[build.mode]}
              </span>
              <span className={`rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${statusClass(build.status)}`}>
                {build.status}
              </span>
            </div>
            <h3 className={`${featured ? "text-2xl" : "text-xl"} mt-2 font-black leading-tight text-white`}>{build.title}</h3>
            <p className="mt-1 text-sm font-bold text-frost">
              {build.championName} by{" "}
              {build.creatorSlug ? (
                <Link href={`/chaos-lab/creator/${build.creatorSlug}`} className="pointer-events-auto underline decoration-frost/30 underline-offset-4 transition hover:text-white">
                  {build.creator}
                </Link>
              ) : (
                build.creator
              )}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-56">
          <div className="rounded-md border border-volt/20 bg-volt/[0.07] px-2 py-2 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-volt">WR</p>
            <p className="mt-1 text-lg font-black text-white">{build.winRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-md border border-frost/20 bg-frost/[0.07] px-2 py-2 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-frost">Votes</p>
            <p className="mt-1 text-lg font-black text-white">{build.votes.toLocaleString()}</p>
          </div>
          <div className={`rounded-md border px-2 py-2 text-center ${riskClass(build.risk)}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">Risk</p>
            <p className="mt-1 text-lg font-black text-white">{build.risk}</p>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-300">{build.summary}</p>

      {build.tags.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {build.tags.map((tag) => (
            <span key={`${build.id}-${tag}`} className="rounded-md border border-frost/20 bg-frost/[0.08] px-2.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-frost">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            <Beaker className="h-4 w-4 text-frost" aria-hidden="true" />
            Item Path
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {build.items.slice(0, featured ? 6 : 4).map((item) => (
              <ItemPill key={`${build.id}-${item.name}`} item={item} />
            ))}
          </div>
        </div>
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            <Zap className="h-4 w-4 text-volt" aria-hidden="true" />
            Augment Stack
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {build.augments.map((augment) => (
              <span key={`${build.id}-${augment}`} className="inline-flex items-center gap-2 rounded-md border border-frost/20 bg-frost/[0.08] px-2.5 py-2 text-xs font-bold text-frost">
                <AugmentIcon augment={augment} className="h-7 w-7 rounded" />
                {augment}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <ThumbsUp className="h-3.5 w-3.5 text-volt" aria-hidden="true" />
            {build.votes.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-frost" aria-hidden="true" />
            {build.comments}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5 text-ember" aria-hidden="true" />
            {build.savedCount.toLocaleString()}
          </span>
          <span>{build.games.toLocaleString()} games</span>
        </div>
        <Link href={`/chaos-lab/${build.id}`} className="pointer-events-auto inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-sm font-black text-slate-200 transition group-hover:border-frost/30 group-hover:bg-frost/[0.1] group-hover:text-white">
          Open lab page
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      </div>
    </article>
  );
}

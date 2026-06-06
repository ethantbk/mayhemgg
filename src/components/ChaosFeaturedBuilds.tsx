import Link from "next/link";
import { ArrowRight, CalendarClock, MessageSquare, Sparkles, ThumbsUp, Trophy, Zap } from "lucide-react";
import type { ChaosLabBuild, ChaosLabCreator } from "@/types/chaosLab";
import { modeLabels } from "@/lib/utils";
import { AugmentIcon } from "@/components/AugmentIcon";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { ChaosCreatorCard } from "@/components/ChaosCreatorCard";
import { ItemPill } from "@/components/ItemPill";

function getRecencyScore(build: ChaosLabBuild) {
  if (!build.publishedAt) {
    if (build.category === "Newest") return 95;
    if (build.category === "Upvoted") return 55;
    return 35;
  }

  const publishedTime = new Date(build.publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return 25;
  }

  const ageDays = Math.max(0, (Date.now() - publishedTime) / 86_400_000);
  return Math.max(0, 120 - ageDays * 6);
}

function getFeaturedScore(build: ChaosLabBuild) {
  return build.votes + build.comments * 14 + build.savedCount * 5 + getRecencyScore(build);
}

function getActivityLabel(build: ChaosLabBuild) {
  if (!build.publishedAt) {
    return build.category === "Newest" ? "Fresh lab activity" : "Community activity";
  }

  const publishedTime = new Date(build.publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return "Community activity";
  }

  const ageHours = Math.max(1, Math.round((Date.now() - publishedTime) / 3_600_000));

  if (ageHours < 24) {
    return `${ageHours}h since update`;
  }

  return `${Math.round(ageHours / 24)}d since update`;
}

function getFeaturedBuilds(builds: ChaosLabBuild[]) {
  return [...builds]
    .sort((a, b) => getFeaturedScore(b) - getFeaturedScore(a))
    .slice(0, 4);
}

function getCreatorSpotlight(buildOfTheWeek: ChaosLabBuild | undefined, creators: ChaosLabCreator[]) {
  if (!creators.length) {
    return undefined;
  }

  return creators.find((creator) => creator.slug === buildOfTheWeek?.creatorSlug || creator.name === buildOfTheWeek?.creator)
    ?? [...creators].sort((a, b) => b.totalVotes - a.totalVotes)[0];
}

function FeaturedBuildRow({ build, rank }: { build: ChaosLabBuild; rank: number }) {
  return (
    <Link href={`/chaos-lab/${build.id}`} className="group grid gap-3 rounded-md border border-white/10 bg-white/[0.045] p-4 transition hover:border-frost/25 hover:bg-frost/[0.07] sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-frost/20 bg-frost/[0.08] text-sm font-black text-frost">
        {rank}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-white/10 bg-white/[0.055] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            {modeLabels[build.mode]}
          </span>
          {build.tags.slice(0, 2).map((tag) => (
            <span key={`${build.id}-${tag}`} className="rounded-md border border-volt/20 bg-volt/[0.07] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-volt">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-2 text-sm font-black text-white transition group-hover:text-frost">{build.title}</p>
        <p className="mt-1 text-xs font-bold text-slate-500">
          {build.championName} by {build.creator}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs font-black text-slate-400 sm:justify-end">
        <span className="inline-flex items-center gap-1 text-volt">
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
          {build.votes.toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1 text-frost">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          {build.comments}
        </span>
      </div>
    </Link>
  );
}

function BuildOfTheWeekCard({ build }: { build: ChaosLabBuild }) {
  return (
    <article className="premium-border feature-depth relative overflow-hidden rounded-lg bg-[linear-gradient(145deg,rgba(184,255,75,0.12),rgba(16,22,36,0.92)_38%,rgba(66,214,255,0.12))] p-5 shadow-card sm:p-6">
      <div className="absolute inset-0 stat-grid opacity-25" />
      <div className="relative z-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <ChampionAvatar name={build.championName} className="h-20 w-20" />
            <div>
              <p className="inline-flex items-center gap-2 rounded-md border border-volt/25 bg-volt/[0.09] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-volt">
                <Trophy className="h-4 w-4" aria-hidden="true" />
                Build of the Week
              </p>
              <h3 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">{build.title}</h3>
              <p className="mt-1 text-sm font-bold text-frost">
                {build.championName} by{" "}
                {build.creatorSlug ? (
                  <Link href={`/chaos-lab/creator/${build.creatorSlug}`} className="underline decoration-frost/30 underline-offset-4 transition hover:text-white">
                    {build.creator}
                  </Link>
                ) : (
                  build.creator
                )}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-64">
            <div className="rounded-md border border-volt/20 bg-volt/[0.07] px-3 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-volt">Votes</p>
              <p className="mt-1 text-xl font-black text-white">{build.votes.toLocaleString()}</p>
            </div>
            <div className="rounded-md border border-frost/20 bg-frost/[0.07] px-3 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-frost">Comments</p>
              <p className="mt-1 text-xl font-black text-white">{build.comments}</p>
            </div>
            <div className="rounded-md border border-ember/20 bg-ember/[0.07] px-3 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ember">Saved</p>
              <p className="mt-1 text-xl font-black text-white">{build.savedCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">{build.summary}</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <Zap className="h-4 w-4 text-volt" aria-hidden="true" />
              Core Path
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {build.items.slice(0, 5).map((item) => (
                <ItemPill key={`${build.id}-${item.name}`} item={item} />
              ))}
            </div>
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <Sparkles className="h-4 w-4 text-frost" aria-hidden="true" />
              Featured Augments
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {build.augments.slice(0, 3).map((augment) => (
                <span key={`${build.id}-${augment}`} className="inline-flex items-center gap-2 rounded-md border border-frost/20 bg-frost/[0.08] px-2.5 py-2 text-xs font-bold text-frost">
                  <AugmentIcon augment={augment} className="h-7 w-7 rounded" />
                  {augment}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            <CalendarClock className="h-4 w-4 text-frost" aria-hidden="true" />
            {getActivityLabel(build)}
          </span>
          <Link href={`/chaos-lab/${build.id}`} className="inline-flex items-center gap-2 rounded-md border border-volt/30 bg-volt/[0.1] px-4 py-3 text-sm font-black text-volt transition hover:bg-volt/[0.16] hover:text-white">
            Open build
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ChaosFeaturedBuilds({
  builds,
  creators
}: {
  builds: ChaosLabBuild[];
  creators: ChaosLabCreator[];
}) {
  const featuredBuilds = getFeaturedBuilds(builds);
  const buildOfTheWeek = featuredBuilds[0];
  const creatorSpotlight = getCreatorSpotlight(buildOfTheWeek, creators);

  if (!buildOfTheWeek) {
    return null;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
      <BuildOfTheWeekCard build={buildOfTheWeek} />
      <div className="grid gap-5">
        <div className="premium-border rounded-lg bg-panel/[0.72] p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-frost">Featured Builds</p>
              <h3 className="mt-1 text-xl font-black text-white">Hot From Chaos Lab</h3>
            </div>
            <Link href="/chaos-lab" className="inline-flex items-center gap-2 text-sm font-black text-frost transition hover:text-white">
              View lab
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3">
            {featuredBuilds.slice(1, 4).map((build, index) => (
              <FeaturedBuildRow key={build.id} build={build} rank={index + 2} />
            ))}
          </div>
        </div>
        {creatorSpotlight ? <ChaosCreatorCard creator={creatorSpotlight} /> : null}
      </div>
    </div>
  );
}

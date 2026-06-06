import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Beaker, Bookmark, Flame, Sparkles, ThumbsUp, Timer, Trophy } from "lucide-react";
import { ChaosBuildCard } from "@/components/ChaosBuildCard";
import { ChaosCreatorCard } from "@/components/ChaosCreatorCard";
import { SectionHeader } from "@/components/SectionHeader";
import { chaosBuildTags, getChaosBuildTagBySlug, getChaosBuildTagSlug } from "@/lib/chaosTags";
import { getChaosLabBuilds, getChaosLabCreators } from "@/server/repositories/chaosLabRepository";
import type { ChaosLabBuild } from "@/types/chaosLab";

export const metadata: Metadata = {
  title: "Chaos Lab",
  description: "Explore MayhemGG community builds, experimental tech, upvoted builds, newest submissions, and creator spotlights.",
  openGraph: {
    title: "Chaos Lab | MayhemGG",
    description: "Community-powered ARAM Mayhem and Arena build experiments."
  }
};

function getChaosBuildsByCategory(builds: ChaosLabBuild[], category: ChaosLabBuild["category"]) {
  return builds.filter((build) => build.category === category);
}

function getMostUpvotedChaosBuilds(builds: ChaosLabBuild[], limit = 3) {
  return [...builds].sort((a, b) => b.votes - a.votes).slice(0, limit);
}

function getNewestChaosBuilds(builds: ChaosLabBuild[], limit = 3) {
  return builds
    .filter((build) => build.category === "Newest")
    .sort((a, b) => {
      if (!a.publishedAt || !b.publishedAt) return 0;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, limit);
}

function EmptyBuildState({ tag }: { tag?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6 text-sm font-bold leading-6 text-slate-400">
      No Chaos Lab builds match {tag ? <span className="text-frost">{tag}</span> : "this filter"} yet.
    </div>
  );
}

function MiniBuildRow({ build, rank }: { build: ChaosLabBuild; rank: number }) {
  return (
    <article className="group relative row-hover grid gap-3 rounded-md border border-white/10 bg-white/[0.045] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <Link href={`/chaos-lab/${build.id}`} className="absolute inset-0 z-10 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-frost/60 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss" aria-label={`Open ${build.title}`}>
        <span className="sr-only">Open {build.title}</span>
      </Link>
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-frost/20 bg-frost/[0.08] text-sm font-black text-frost">
        {rank}
      </div>
      <div className="pointer-events-none relative z-20">
        <p className="text-sm font-black text-white">{build.title}</p>
        <p className="mt-1 text-xs font-bold text-slate-500">
          {build.championName} by{" "}
          {build.creatorSlug ? (
            <Link href={`/chaos-lab/creator/${build.creatorSlug}`} className="pointer-events-auto text-frost transition hover:text-white">
              {build.creator}
            </Link>
          ) : (
            build.creator
          )}
        </p>
      </div>
      <div className="pointer-events-none relative z-20 flex items-center gap-3 text-sm font-black">
        <span className="text-volt">{build.votes.toLocaleString()} votes</span>
        <span className="inline-flex items-center gap-1 text-ember">
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
          {build.savedCount.toLocaleString()}
        </span>
        <span className="text-frost">{build.winRate.toFixed(1)}%</span>
      </div>
    </article>
  );
}

type ChaosLabPageProps = {
  searchParams: Promise<{
    tag?: string;
  }>;
};

export default async function ChaosLabPage({ searchParams }: ChaosLabPageProps) {
  const params = await searchParams;
  const selectedTag = getChaosBuildTagBySlug(params.tag);
  const [chaosBuilds, chaosCreators] = await Promise.all([
    getChaosLabBuilds(),
    getChaosLabCreators()
  ]);
  const visibleBuilds = selectedTag
    ? chaosBuilds.filter((build) => build.tags.includes(selectedTag))
    : chaosBuilds;
  const communityBuilds = getChaosBuildsByCategory(visibleBuilds, "Community");
  const experimentalBuilds = getChaosBuildsByCategory(visibleBuilds, "Experimental");
  const upvotedBuilds = getMostUpvotedChaosBuilds(visibleBuilds, 4);
  const newestBuilds = getNewestChaosBuilds(visibleBuilds, 3);
  const featuredBuild = upvotedBuilds[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="premium-border hero-depth relative overflow-hidden rounded-lg bg-panel">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(66,214,255,0.28),transparent_32%),radial-gradient(circle_at_86%_14%,rgba(184,255,75,0.16),transparent_30%),radial-gradient(circle_at_64%_92%,rgba(255,107,61,0.18),transparent_36%)]" />
        <div className="absolute inset-0 stat-grid opacity-40" />
        <div className="relative z-10 grid gap-10 p-5 sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="mb-5 flex w-fit items-center gap-2 rounded-md border border-frost/25 bg-frost/[0.08] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-frost">
                <Beaker className="h-4 w-4" aria-hidden="true" />
                Chaos Lab
              </div>
              <h1 className="text-5xl font-black leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
                Community tech before it becomes meta.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-300 sm:text-lg">
                Browse player-made builds, risky experiments, fresh submissions, and the most upvoted MayhemGG theorycrafts for ARAM Mayhem and Arena.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-abyss/[0.62] p-4 backdrop-blur">
                <Sparkles className="h-5 w-5 text-frost" aria-hidden="true" />
                <p className="mt-3 text-2xl font-black text-white">{visibleBuilds.length}</p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{selectedTag ? "Tagged Builds" : "Lab Builds"}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-abyss/[0.62] p-4 backdrop-blur">
                <ThumbsUp className="h-5 w-5 text-volt" aria-hidden="true" />
                <p className="mt-3 text-2xl font-black text-white">{(upvotedBuilds[0]?.votes ?? 0).toLocaleString()}</p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Top Votes</p>
              </div>
              <div className="rounded-md border border-white/10 bg-abyss/[0.62] p-4 backdrop-blur">
                <Flame className="h-5 w-5 text-ember" aria-hidden="true" />
                <p className="mt-3 text-2xl font-black text-white">{experimentalBuilds.length}</p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Experiments</p>
              </div>
            </div>
          </div>
          {featuredBuild ? <ChaosBuildCard build={featuredBuild} featured /> : <EmptyBuildState tag={selectedTag ?? undefined} />}
        </div>
      </section>

      <div className="space-y-16 py-14 lg:py-16">
        <section className="premium-border rounded-lg bg-panel/[0.72] p-4 shadow-card sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-frost">Build Tags</p>
              <h2 className="mt-1 text-xl font-black text-white">Filter the lab by playstyle</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/chaos-lab"
                className={`rounded-md border px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                  selectedTag
                    ? "border-white/10 bg-white/[0.045] text-slate-400 hover:border-frost/25 hover:text-white"
                    : "border-volt/35 bg-volt/[0.12] text-volt"
                }`}
              >
                All
              </Link>
              {chaosBuildTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/chaos-lab?tag=${getChaosBuildTagSlug(tag)}`}
                  className={`rounded-md border px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                    selectedTag === tag
                      ? "border-frost/35 bg-frost/[0.14] text-white shadow-[0_0_24px_rgba(66,214,255,0.14)]"
                      : "border-white/10 bg-white/[0.045] text-slate-400 hover:border-frost/25 hover:text-white"
                  }`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Community Builds"
            title="Player-Tested Mayhem Pages"
            description="Builds with enough votes, comments, and practical games to look more like repeatable tech than one-round luck."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {communityBuilds.length
              ? communityBuilds.map((build) => (
                  <ChaosBuildCard key={build.id} build={build} />
                ))
              : <EmptyBuildState tag={selectedTag ?? undefined} />}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Experimental Builds"
            title="High-Risk Lab Work"
            description="Unstable ideas with sharp upside, weird item timings, and enough chaos to deserve a proper test queue."
            action={<span className="inline-flex items-center gap-2 rounded-md border border-ember/25 bg-ember/[0.08] px-3 py-2 text-sm font-black text-ember"><Flame className="h-4 w-4" aria-hidden="true" /> Volatile</span>}
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {experimentalBuilds.length
              ? experimentalBuilds.map((build) => (
                  <ChaosBuildCard key={build.id} build={build} />
                ))
              : <EmptyBuildState tag={selectedTag ?? undefined} />}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
          <div>
            <SectionHeader
              eyebrow="Most Upvoted Builds"
              title="Community Favorites"
              description="The builds players keep coming back to, ranked by community vote pressure."
            />
            <div className="grid gap-3">
              {upvotedBuilds.length
                ? upvotedBuilds.map((build, index) => (
                    <MiniBuildRow key={build.id} build={build} rank={index + 1} />
                  ))
                : <EmptyBuildState tag={selectedTag ?? undefined} />}
            </div>
          </div>
          <div>
            <SectionHeader
              eyebrow="Newest Builds"
              title="Fresh From The Lab"
              description="Recent submissions that are still gathering proof, comments, and stat confidence."
              action={<Timer className="h-5 w-5 text-frost" aria-hidden="true" />}
            />
            <div className="grid gap-3">
              {newestBuilds.length
                ? newestBuilds.map((build, index) => (
                    <MiniBuildRow key={build.id} build={build} rank={index + 1} />
                  ))
                : <EmptyBuildState tag={selectedTag ?? undefined} />}
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Creator Spotlight"
            title="Theorycrafters Driving The Meta"
            description="Creator profiles shaped around specialties, signature champions, and repeatable build identity."
            action={<span className="inline-flex items-center gap-2 text-sm font-black text-volt">Creator board <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>}
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {chaosCreators.map((creator) => (
              <ChaosCreatorCard key={creator.handle} creator={creator} />
            ))}
          </div>
        </section>

        <section className="premium-border relative overflow-hidden rounded-lg bg-panel/[0.74] p-6 shadow-card sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(184,255,75,0.13),transparent_34%),radial-gradient(circle_at_18%_82%,rgba(66,214,255,0.12),transparent_30%)]" />
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-frost">
                <Trophy className="h-4 w-4" aria-hidden="true" />
                Foundation Ready
              </p>
              <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">The next broken build starts in the lab.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                Watch off-meta ideas climb from risky experiment to community favorite, then compare them against MayhemGG&apos;s strongest ranked builds.
              </p>
            </div>
            <Link href="/broken-builds" className="inline-flex w-fit items-center gap-2 rounded-md border border-volt/30 bg-volt/[0.1] px-4 py-3 text-sm font-black text-volt transition hover:bg-volt/[0.16] hover:text-white">
              Compare broken builds
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

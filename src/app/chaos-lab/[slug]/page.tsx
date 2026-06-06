import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bookmark, Crown, MessageSquare, ShieldAlert, Sparkles, Swords, ThumbsUp, Trophy } from "lucide-react";
import { AugmentIcon } from "@/components/AugmentIcon";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { ChaosBookmarkButton } from "@/components/ChaosBookmarkButton";
import { ChaosBulletList, ChaosDetailSection } from "@/components/ChaosDetailSection";
import { ChaosCommentsPanel } from "@/components/ChaosCommentsPanel";
import { ChaosCommunityRating } from "@/components/ChaosCommunityRating";
import { ChaosVoteControls } from "@/components/ChaosVoteControls";
import { ItemPill } from "@/components/ItemPill";
import { StatBox } from "@/components/StatBox";
import { modeLabels } from "@/lib/utils";
import { getCurrentSupabaseUser } from "@/server/auth/chaosCreatorAuth";
import { getChaosLabBookmarkStatus, getChaosLabBuildBySlug, getChaosLabBuildDetails, getChaosLabBuilds, getChaosLabCommentsPage } from "@/server/repositories/chaosLabRepository";

type ChaosBuildPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const builds = await getChaosLabBuilds();

  return builds.map((build) => ({
    slug: build.slug
  }));
}

export async function generateMetadata({ params }: ChaosBuildPageProps): Promise<Metadata> {
  const { slug } = await params;
  const build = await getChaosLabBuildBySlug(slug);

  if (!build) {
    return {
      title: "Chaos Build Not Found | MayhemGG"
    };
  }

  const title = `${build.title} ${build.championName} Build | MayhemGG Chaos Lab`;
  const description = `${build.creator}'s ${modeLabels[build.mode]} ${build.championName} build with items, augments, matchup notes, and community ratings.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article"
    }
  };
}

export default async function ChaosBuildDetailsPage({ params }: ChaosBuildPageProps) {
  const { slug } = await params;
  const details = await getChaosLabBuildDetails(slug);

  if (!details) {
    notFound();
  }

  const { build } = details;
  const user = await getCurrentSupabaseUser();
  const bookmark = await getChaosLabBookmarkStatus(slug, user?.id);
  const commentsPage = await getChaosLabCommentsPage({ slug, page: 1, pageSize: 5 }) ?? {
    comments: details.commentPreview,
    page: 1,
    pageSize: 5,
    total: details.commentPreview.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  };

  return (
    <main className="min-h-screen bg-abyss text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(66,214,255,0.22),transparent_32%),radial-gradient(circle_at_78%_0%,rgba(184,255,75,0.15),transparent_28%),linear-gradient(180deg,rgba(8,13,24,0.72),rgba(8,13,24,1))]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-abyss to-transparent" />

        <div className="container relative py-8 sm:py-12 lg:py-16">
          <Link href="/chaos-lab" className="inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-frost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Chaos Lab
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md border border-frost/25 bg-frost/[0.08] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-frost">
                  {modeLabels[build.mode]}
                </span>
                <span className="rounded-md border border-volt/25 bg-volt/[0.08] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-volt">
                  {build.status}
                </span>
                <span className="rounded-md border border-ember/25 bg-ember/[0.08] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-ember">
                  {build.risk} Risk
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                <ChampionAvatar name={build.championName} className="h-24 w-24 sm:h-28 sm:w-28" />
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-volt">Chaos Build</p>
                  <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {build.title}
                  </h1>
                  <p className="mt-3 text-lg font-bold text-frost">
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

              <p className="mt-7 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">{build.summary}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/champions/${build.championSlug}`} className="inline-flex items-center gap-2 rounded-md border border-frost/25 bg-frost/[0.1] px-4 py-3 text-sm font-black text-white transition hover:border-frost/50 hover:bg-frost/[0.16]">
                  View Champion
                  <Swords className="h-4 w-4" aria-hidden="true" />
                </Link>
                <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-black text-slate-300">
                  <Crown className="h-4 w-4 text-volt" aria-hidden="true" />
                  {build.creatorTag}
                </span>
              </div>
            </div>

            <div className="premium-border rounded-lg bg-panel/[0.78] p-5 shadow-card">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Live Lab Snapshot</p>
              <div className="mt-4 grid gap-3">
                <StatBox label="Win Rate" value={`${build.winRate.toFixed(1)}%`} accent="text-volt" className="bg-volt/[0.06]" />
                <StatBox label="Votes" value={build.votes.toLocaleString()} accent="text-frost" className="bg-frost/[0.06]" />
                <StatBox label="Saves" value={bookmark.savedCount.toLocaleString()} accent="text-ember" className="bg-ember/[0.06]" />
                <StatBox label="Games Tested" value={build.games.toLocaleString()} accent="text-white" />
              </div>
              <div className="mt-4">
                <ChaosBookmarkButton buildSlug={build.slug} initialIsSaved={bookmark.isSaved} initialSavedCount={bookmark.savedCount} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <div className="grid gap-8">
            <ChaosDetailSection eyebrow="Featured Path" title="Core Item Path" featured>
              <div className="grid gap-3">
                {build.items.map((item, index) => (
                  <div key={`${build.id}-${item.name}`} className="row-hover flex flex-col gap-3 rounded-md border border-white/10 bg-white/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-ember/20 bg-ember/[0.08] text-sm font-black text-ember">
                        {index + 1}
                      </span>
                      <ItemPill item={item} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{item.category}</span>
                  </div>
                ))}
              </div>
            </ChaosDetailSection>

            <ChaosDetailSection eyebrow="Recommended Stack" title="Augments">
              <div className="grid gap-3 sm:grid-cols-3">
                {build.augments.map((augment, index) => (
                  <div key={`${build.id}-${augment}`} className="row-hover rounded-md border border-frost/20 bg-frost/[0.065] p-4">
                    <AugmentIcon augment={augment} className="h-12 w-12" />
                    <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Priority {index + 1}</p>
                    <p className="mt-2 text-lg font-black text-white">{augment}</p>
                  </div>
                ))}
              </div>
            </ChaosDetailSection>

            <ChaosDetailSection eyebrow="Matchup Read" title="Matchup Notes">
              <ChaosBulletList items={details.matchupNotes} />
            </ChaosDetailSection>

            <div className="grid gap-8 lg:grid-cols-2">
              <ChaosDetailSection eyebrow="Power Profile" title="Strengths">
                <ChaosBulletList items={details.strengths} tone="volt" />
              </ChaosDetailSection>
              <ChaosDetailSection eyebrow="Failure Points" title="Weaknesses">
                <ChaosBulletList items={details.weaknesses} tone="ember" />
              </ChaosDetailSection>
            </div>
          </div>

          <aside className="grid content-start gap-8">
            <ChaosDetailSection eyebrow="Community" title="Rating" featured>
              <div className="grid gap-4">
                <ChaosCommunityRating rating={details.communityRating} />
                <ChaosVoteControls buildSlug={build.slug} initialRating={details.communityRating} />
              </div>
            </ChaosDetailSection>

            <ChaosDetailSection eyebrow="Discussion" title="Comment Preview">
              <ChaosCommentsPanel buildSlug={build.slug} initialCommentsPage={commentsPage} />
            </ChaosDetailSection>

            <div className="premium-border rounded-lg bg-panel/[0.72] p-5 shadow-card">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-volt">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Build Signals
              </p>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.045] px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-300">
                    <ThumbsUp className="h-4 w-4 text-volt" aria-hidden="true" />
                    Votes
                  </span>
                  <span className="font-black text-white">{build.votes.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.045] px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-300">
                    <MessageSquare className="h-4 w-4 text-frost" aria-hidden="true" />
                    Comments
                  </span>
                  <span className="font-black text-white">{build.comments}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.045] px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-300">
                    <Bookmark className="h-4 w-4 text-ember" aria-hidden="true" />
                    Saves
                  </span>
                  <span className="font-black text-white">{bookmark.savedCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.045] px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-300">
                    <ShieldAlert className="h-4 w-4 text-ember" aria-hidden="true" />
                    Risk
                  </span>
                  <span className="font-black text-white">{build.risk}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.045] px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-300">
                    <Trophy className="h-4 w-4 text-volt" aria-hidden="true" />
                    Status
                  </span>
                  <span className="font-black text-white">{build.status}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

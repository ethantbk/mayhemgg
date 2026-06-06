import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FlaskConical, Sparkles, ThumbsUp, Trophy, UserRound } from "lucide-react";
import { ChampionAvatar } from "@/components/ChampionAvatar";
import { ChaosBuildCard } from "@/components/ChaosBuildCard";
import { SectionHeader } from "@/components/SectionHeader";
import { getChaosLabCreatorProfile, getChaosLabCreators } from "@/server/repositories/chaosLabRepository";

type CreatorProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const creators = await getChaosLabCreators();

  return creators.map((creator) => ({
    slug: creator.slug
  }));
}

export async function generateMetadata({ params }: CreatorProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getChaosLabCreatorProfile(slug);

  if (!profile) {
    return {
      title: "Creator Not Found | MayhemGG"
    };
  }

  const title = `${profile.creator.name} Chaos Lab Creator`;
  const description = `${profile.creator.name} builds, creator bio, top Chaos Lab submissions, newest builds, and community votes on MayhemGG.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | MayhemGG`,
      description,
      type: "profile"
    }
  };
}

function formatJoinDate(value?: string) {
  if (!value) {
    return "Founding creator";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Founding creator";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric"
  }).format(date);
}

export default async function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  const { slug } = await params;
  const profile = await getChaosLabCreatorProfile(slug);

  if (!profile) {
    notFound();
  }

  const { creator, topBuilds, newestBuilds } = profile;

  return (
    <main className="min-h-screen bg-abyss text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(66,214,255,0.22),transparent_32%),radial-gradient(circle_at_78%_0%,rgba(184,255,75,0.14),transparent_28%),linear-gradient(180deg,rgba(8,13,24,0.72),rgba(8,13,24,1))]" />
        <div className="absolute inset-0 stat-grid opacity-30" />
        <div className="container relative py-8 sm:py-12 lg:py-16">
          <Link href="/chaos-lab" className="inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-frost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Chaos Lab
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-md border border-frost/25 bg-frost/[0.08] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-frost">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Creator Profile
                </span>
                <span className="rounded-md border border-volt/25 bg-volt/[0.08] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-volt">
                  {creator.handle}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                <ChampionAvatar name={creator.featuredChampion} className="h-24 w-24 sm:h-28 sm:w-28" />
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-volt">Chaos Lab Creator</p>
                  <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {creator.name}
                  </h1>
                  <p className="mt-3 text-lg font-bold text-frost">{creator.specialty}</p>
                </div>
              </div>

              <p className="mt-7 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">{creator.bio}</p>
            </div>

            <div className="premium-border rounded-lg bg-panel/[0.78] p-5 shadow-card">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Creator Snapshot</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-frost">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Joined
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">{formatJoinDate(creator.joinedAt)}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-md border border-volt/20 bg-volt/[0.07] p-4">
                    <FlaskConical className="h-4 w-4 text-volt" aria-hidden="true" />
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-volt">Total Builds</p>
                    <p className="mt-2 text-3xl font-black text-white">{creator.buildsPublished.toLocaleString()}</p>
                  </div>
                  <div className="rounded-md border border-frost/20 bg-frost/[0.07] p-4">
                    <ThumbsUp className="h-4 w-4 text-frost" aria-hidden="true" />
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-frost">Votes Received</p>
                    <p className="mt-2 text-3xl font-black text-white">{creator.totalVotes.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <div className="space-y-16">
          <section>
            <SectionHeader
              eyebrow="Top Builds"
              title={`${creator.name}'s Most Upvoted Builds`}
              description="The creator submissions with the strongest community vote pressure."
              action={<Trophy className="h-5 w-5 text-volt" aria-hidden="true" />}
            />
            {topBuilds.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {topBuilds.map((build) => (
                  <ChaosBuildCard key={build.id} build={build} />
                ))}
              </div>
            ) : (
              <div className="premium-border rounded-lg bg-panel/[0.72] p-6 text-sm font-bold text-slate-400">
                No published Chaos Lab builds yet.
              </div>
            )}
          </section>

          <section>
            <SectionHeader
              eyebrow="Newest Builds"
              title="Fresh Creator Submissions"
              description="The latest builds published by this creator."
              action={<Sparkles className="h-5 w-5 text-frost" aria-hidden="true" />}
            />
            {newestBuilds.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {newestBuilds.map((build) => (
                  <ChaosBuildCard key={build.id} build={build} />
                ))}
              </div>
            ) : (
              <div className="premium-border rounded-lg bg-panel/[0.72] p-6 text-sm font-bold text-slate-400">
                New submissions will appear here after this creator publishes builds.
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

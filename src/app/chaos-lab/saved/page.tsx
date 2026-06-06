import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bookmark, Sparkles } from "lucide-react";
import { ChaosBuildCard } from "@/components/ChaosBuildCard";
import { SectionHeader } from "@/components/SectionHeader";
import { getCurrentSupabaseUser } from "@/server/auth/chaosCreatorAuth";
import { getSavedChaosLabBuilds } from "@/server/repositories/chaosLabRepository";

export const metadata: Metadata = {
  title: "Saved Chaos Builds",
  description: "Your saved MayhemGG Chaos Lab builds.",
  robots: {
    index: false,
    follow: false
  },
  openGraph: {
    title: "Saved Chaos Builds | MayhemGG",
    description: "Private saved Chaos Lab builds."
  }
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SavedChaosBuildsPage() {
  const user = await getCurrentSupabaseUser();

  if (!user) {
    redirect("/chaos-lab/creator/sign-in?next=/chaos-lab/saved");
  }

  const savedBuilds = await getSavedChaosLabBuilds(user.id);

  return (
    <main className="min-h-screen bg-abyss text-white">
      <section className="container py-10 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/chaos-lab" className="inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-frost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Chaos Lab
          </Link>
          <Link href="/chaos-lab/create" className="rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-sm font-black text-slate-300 transition hover:border-frost/30 hover:bg-frost/[0.08] hover:text-white">
            Create Build
          </Link>
        </div>

        <section className="mt-8 premium-border relative overflow-hidden rounded-lg bg-panel p-6 shadow-card sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(66,214,255,0.22),transparent_32%),radial-gradient(circle_at_86%_14%,rgba(184,255,75,0.14),transparent_30%),radial-gradient(circle_at_64%_92%,rgba(255,107,61,0.14),transparent_36%)]" />
          <div className="relative">
            <div className="flex w-fit items-center gap-2 rounded-md border border-ember/25 bg-ember/[0.08] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-ember">
              <Bookmark className="h-4 w-4" aria-hidden="true" />
              Saved Builds
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Your saved Chaos Lab builds.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              Keep track of experimental pages, creator builds, and off-meta tech you want to test later.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <SectionHeader
            eyebrow="Bookmarks"
            title={`${savedBuilds.length.toLocaleString()} Saved Build${savedBuilds.length === 1 ? "" : "s"}`}
            description="Saved builds are private to your signed-in Supabase account."
            action={<Sparkles className="h-5 w-5 text-frost" aria-hidden="true" />}
          />

          {savedBuilds.length ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {savedBuilds.map((build) => (
                <ChaosBuildCard key={build.id} build={build} />
              ))}
            </div>
          ) : (
            <div className="premium-border rounded-lg bg-panel/[0.72] p-6 shadow-card">
              <p className="text-sm font-bold leading-6 text-slate-300">
                No saved builds yet. Open a Chaos Lab build and use the save button to add it here.
              </p>
              <Link href="/chaos-lab" className="mt-5 inline-flex items-center gap-2 rounded-md border border-frost/25 bg-frost/[0.08] px-4 py-3 text-sm font-black text-frost transition hover:bg-frost/[0.14] hover:text-white">
                Browse Chaos Lab
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

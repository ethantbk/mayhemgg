import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Plus, ShieldCheck, UserRound } from "lucide-react";
import { getCurrentChaosCreatorSession } from "@/server/auth/chaosCreatorAuth";

export const metadata: Metadata = {
  title: "Creator Dashboard",
  description: "Private Chaos Lab creator dashboard for MayhemGG.",
  robots: {
    index: false,
    follow: false
  },
  openGraph: {
    title: "Creator Dashboard | MayhemGG",
    description: "Private Chaos Lab creator dashboard."
  }
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ChaosCreatorDashboardPage() {
  const session = await getCurrentChaosCreatorSession();

  if (!session) {
    redirect("/chaos-lab/creator/sign-in?next=/chaos-lab/creator/dashboard");
  }

  return (
    <main className="min-h-screen bg-abyss text-white">
      <section className="container py-10 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/chaos-lab" className="inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-frost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Chaos Lab
          </Link>
          <Link href="/auth/sign-out" className="rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-sm font-black text-slate-300 transition hover:border-ember/30 hover:bg-ember/[0.08] hover:text-white">
            Sign out
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="premium-border relative overflow-hidden rounded-lg bg-panel p-6 shadow-card sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(66,214,255,0.22),transparent_32%),radial-gradient(circle_at_88%_20%,rgba(184,255,75,0.13),transparent_30%)]" />
            <div className="relative">
              <div className="flex w-fit items-center gap-2 rounded-md border border-volt/25 bg-volt/[0.08] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-volt">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Authenticated
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                {session.creator ? `${session.creator.name} dashboard` : "Creator profile pending"}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                {session.creator
                  ? "Your Supabase account is linked to a Chaos Lab creator profile."
                  : "Your Supabase account is signed in, but it is not linked to a Chaos Lab creator profile yet."}
              </p>
            </div>
          </section>

          <aside className="premium-border rounded-lg bg-panel/[0.78] p-5 shadow-card">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-frost" aria-hidden="true" />
              <h2 className="text-xl font-black text-white">Session</h2>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Email</p>
                <p className="mt-2 break-all text-sm font-bold text-white">{session.user.email ?? "No email available"}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Creator Link</p>
                <p className="mt-2 text-sm font-bold text-white">{session.creator ? "Linked" : "Pending"}</p>
              </div>
            </div>
          </aside>
        </div>

        {session.creator ? (
          <>
            <section className="mt-8 grid gap-5 lg:grid-cols-3">
              <div className="premium-border rounded-lg bg-panel/[0.72] p-5 shadow-card">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-volt">Specialty</p>
                <p className="mt-3 text-lg font-black text-white">{session.creator.specialty}</p>
              </div>
              <div className="premium-border rounded-lg bg-panel/[0.72] p-5 shadow-card">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-frost">Published Builds</p>
                <p className="mt-3 text-3xl font-black text-white">{session.creator.buildsPublished}</p>
              </div>
              <div className="premium-border rounded-lg bg-panel/[0.72] p-5 shadow-card">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-ember">Total Votes</p>
                <p className="mt-3 text-3xl font-black text-white">{session.creator.totalVotes.toLocaleString()}</p>
              </div>
            </section>

            <Link href="/chaos-lab/create" className="mt-8 inline-flex items-center gap-2 rounded-md border border-volt/30 bg-volt/[0.12] px-4 py-3 text-sm font-black text-volt transition hover:bg-volt/[0.18] hover:text-white">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Chaos Build
            </Link>
          </>
        ) : (
          <section className="mt-8 premium-border rounded-lg bg-panel/[0.72] p-5 shadow-card">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-ember">Profile Link Required</p>
            <h2 className="mt-3 text-2xl font-black text-white">Connect this user to `chaos_creators.auth_user_id`.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              After linking, this dashboard will show the creator profile and can become the home for build submission tools.
            </p>
          </section>
        )}

        <Link href="/chaos-lab" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-frost transition hover:text-white">
          View public Chaos Lab
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

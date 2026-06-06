import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole, ShieldAlert } from "lucide-react";
import { ChaosBuildCreateForm } from "@/components/ChaosBuildCreateForm";
import { getCurrentChaosCreatorSession } from "@/server/auth/chaosCreatorAuth";
import { getChampions } from "@/server/repositories/championsRepository";

export const metadata: Metadata = {
  title: "Create Chaos Build",
  description: "Private Chaos Lab build submission for MayhemGG creators.",
  robots: {
    index: false,
    follow: false
  },
  openGraph: {
    title: "Create Chaos Build | MayhemGG",
    description: "Private Chaos Lab build submission."
  }
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CreateChaosBuildPage() {
  const session = await getCurrentChaosCreatorSession();

  if (!session) {
    redirect("/chaos-lab/creator/sign-in?next=/chaos-lab/create");
  }

  if (!session.creator) {
    return (
      <main className="min-h-screen bg-abyss text-white">
        <section className="container py-10 sm:py-14">
          <Link href="/chaos-lab" className="inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-frost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Chaos Lab
          </Link>
          <div className="mt-8 premium-border rounded-lg bg-panel/[0.78] p-6 shadow-card sm:p-8">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-ember" aria-hidden="true" />
              <p className="text-xs font-black uppercase tracking-[0.18em] text-ember">Creator Link Required</p>
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">This account is not linked to a creator profile.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
              Link this Supabase user to `chaos_creators.auth_user_id` before submitting Chaos Lab builds.
            </p>
            <Link href="/chaos-lab/creator/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-md border border-frost/25 bg-frost/[0.08] px-4 py-3 text-sm font-black text-frost transition hover:bg-frost/[0.14] hover:text-white">
              View Creator Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const champions = await getChampions();

  return (
    <main className="min-h-screen bg-abyss text-white">
      <section className="container py-10 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/chaos-lab" className="inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-frost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Chaos Lab
          </Link>
          <Link href="/chaos-lab/creator/dashboard" className="rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-sm font-black text-slate-300 transition hover:border-frost/30 hover:bg-frost/[0.08] hover:text-white">
            Creator Dashboard
          </Link>
        </div>

        <section className="mt-8 premium-border relative overflow-hidden rounded-lg bg-panel p-6 shadow-card sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(66,214,255,0.22),transparent_32%),radial-gradient(circle_at_86%_14%,rgba(184,255,75,0.14),transparent_30%),radial-gradient(circle_at_64%_92%,rgba(255,107,61,0.14),transparent_36%)]" />
          <div className="relative">
            <div className="flex w-fit items-center gap-2 rounded-md border border-volt/25 bg-volt/[0.08] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-volt">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Creator Submission
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Create a Chaos Lab build.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              Submit an Arena or ARAM Mayhem build under {session.creator.name}. New builds enter the lab as fresh creator submissions.
            </p>
          </div>
        </section>

        <div className="mt-8">
          <ChaosBuildCreateForm champions={champions.map((champion) => ({ name: champion.name, slug: champion.slug }))} />
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Database, LockKeyhole } from "lucide-react";
import { ChaosCreatorAuthForm } from "@/components/ChaosCreatorAuthForm";
import { isSupabasePublicConfigAvailable } from "@/lib/supabase/config";
import { getCurrentChaosCreatorSession } from "@/server/auth/chaosCreatorAuth";

export const metadata: Metadata = {
  title: "Creator Sign In",
  description: "Private Chaos Lab creator sign-in for MayhemGG.",
  robots: {
    index: false,
    follow: false
  },
  openGraph: {
    title: "Creator Sign In | MayhemGG",
    description: "Private Chaos Lab creator access."
  }
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CreatorSignInPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/chaos-lab/creator/dashboard";
  }

  return value;
}

export default async function CreatorSignInPage({ searchParams }: CreatorSignInPageProps) {
  const params = await searchParams;
  const session = await getCurrentChaosCreatorSession();
  const next = safeNextPath(params.next);

  if (session) {
    redirect(next);
  }

  const isConfigured = isSupabasePublicConfigAvailable();

  return (
    <main className="min-h-screen bg-abyss text-white">
      <section className="container py-10 sm:py-14">
        <Link href="/chaos-lab" className="inline-flex items-center gap-2 text-sm font-black text-slate-400 transition hover:text-frost">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Chaos Lab
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="premium-border relative overflow-hidden rounded-lg bg-panel p-6 shadow-card sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(66,214,255,0.22),transparent_32%),radial-gradient(circle_at_84%_16%,rgba(184,255,75,0.13),transparent_30%)]" />
            <div className="relative">
              <div className="flex w-fit items-center gap-2 rounded-md border border-frost/25 bg-frost/[0.08] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-frost">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                Creator Auth
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Chaos Lab creator access.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Sign in with the email connected to your creator profile to manage Chaos Lab publishing tools as they come online.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {isConfigured ? (
              <ChaosCreatorAuthForm redirectTo={next} />
            ) : (
              <div className="premium-border rounded-lg bg-panel/[0.78] p-5 shadow-card sm:p-6">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-ember" aria-hidden="true" />
                  <h2 className="text-xl font-black text-white">Supabase is not configured</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable creator sign-in.
                </p>
              </div>
            )}

            {params.error ? (
              <p className="rounded-md border border-ember/25 bg-ember/[0.08] px-3 py-2 text-sm font-bold text-ember">
                Creator sign-in could not be completed. Try a fresh link.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

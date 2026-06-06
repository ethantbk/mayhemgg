"use client";

import { useMemo, useState } from "react";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type SubmitState = "idle" | "loading" | "sent" | "error";

export function ChaosCreatorAuthForm({
  redirectTo = "/chaos-lab/creator/dashboard"
}: {
  redirectTo?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
  }, [redirectTo]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
          shouldCreateUser: true
        }
      });

      if (error) {
        setState("error");
        setMessage(error.message);
        return;
      }

      setState("sent");
      setMessage("Check your email for a secure creator sign-in link.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Creator sign-in could not be started.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="premium-border rounded-lg bg-panel/[0.78] p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-md border border-frost/25 bg-frost/[0.08] text-frost">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-frost">Creator Access</p>
          <h2 className="mt-1 text-2xl font-black text-white">Sign in to Chaos Lab</h2>
        </div>
      </div>

      <label className="mt-6 block text-sm font-bold text-slate-300" htmlFor="creator-email">
        Email
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            id="creator-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="h-12 w-full rounded-md border border-white/10 bg-abyss/[0.72] pl-10 pr-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-frost/50"
            placeholder="creator@mayhemgg.com"
          />
        </div>
        <button
          type="submit"
          disabled={state === "loading"}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-volt/30 bg-volt/[0.12] px-5 text-sm font-black text-volt transition hover:bg-volt/[0.18] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
          Send Link
        </button>
      </div>

      {message ? (
        <p className={`mt-4 rounded-md border px-3 py-2 text-sm font-bold ${state === "error" ? "border-ember/25 bg-ember/[0.08] text-ember" : "border-volt/25 bg-volt/[0.08] text-volt"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

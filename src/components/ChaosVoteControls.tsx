"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ChaosLabCommunityRating } from "@/types/chaosLab";

type VoteValue = "up" | "down";
type VoteState = "idle" | "loading" | "error";

type VoteResponse = {
  ok: boolean;
  data?: {
    rating?: ChaosLabCommunityRating;
  };
  error?: string;
};

export function ChaosVoteControls({
  buildSlug,
  initialRating
}: {
  buildSlug: string;
  initialRating: ChaosLabCommunityRating;
}) {
  const [rating, setRating] = useState(initialRating);
  const [state, setState] = useState<VoteState>("idle");
  const [message, setMessage] = useState("");

  async function submitVote(vote: VoteValue) {
    setState("loading");
    setMessage("");

    try {
      const response = await fetch(`/api/chaos-lab/builds/${buildSlug}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ vote })
      });
      const result = await response.json() as VoteResponse;

      if (!response.ok || !result.ok || !result.data?.rating) {
        setState("error");
        setMessage(result.error ?? "Vote could not be recorded.");
        return;
      }

      setRating(result.data.rating);
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Vote could not be recorded.");
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Community Votes</p>
          <p className="mt-2 text-3xl font-black text-white">{rating.netVotes.toLocaleString()}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => submitVote("up")}
            disabled={state === "loading"}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${rating.userVote === "up" ? "border-volt/40 bg-volt/[0.14] text-volt" : "border-white/10 bg-white/[0.055] text-slate-300 hover:border-volt/30 hover:text-white"}`}
          >
            {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ThumbsUp className="h-4 w-4" aria-hidden="true" />}
            Upvote
          </button>
          <button
            type="button"
            onClick={() => submitVote("down")}
            disabled={state === "loading"}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${rating.userVote === "down" ? "border-ember/40 bg-ember/[0.14] text-ember" : "border-white/10 bg-white/[0.055] text-slate-300 hover:border-ember/30 hover:text-white"}`}
          >
            <ThumbsDown className="h-4 w-4" aria-hidden="true" />
            Downvote
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md border border-volt/20 bg-volt/[0.07] px-2 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-volt">Up</p>
          <p className="mt-1 text-lg font-black text-white">{rating.upvotes.toLocaleString()}</p>
        </div>
        <div className="rounded-md border border-ember/20 bg-ember/[0.07] px-2 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ember">Down</p>
          <p className="mt-1 text-lg font-black text-white">{rating.downvotes.toLocaleString()}</p>
        </div>
        <div className="rounded-md border border-frost/20 bg-frost/[0.07] px-2 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-frost">Rate</p>
          <p className="mt-1 text-lg font-black text-white">{rating.upvoteRate}%</p>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-ember/25 bg-ember/[0.08] px-3 py-2 text-sm font-bold text-ember">
          {message.includes("sign in") ? (
            <>
              <Link href="/chaos-lab/creator/sign-in" className="underline decoration-ember/50 underline-offset-4">
                Sign in
              </Link>
              {" "}to vote on Chaos Lab builds.
            </>
          ) : (
            message
          )}
        </p>
      ) : null}
    </div>
  );
}

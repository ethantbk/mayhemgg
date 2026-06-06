"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, MessageSquare, Send } from "lucide-react";
import { ChaosCommentPreview } from "@/components/ChaosCommentPreview";
import type { ChaosLabCommentsPage } from "@/types/chaosLab";

type RequestState = "idle" | "loading" | "submitting" | "error";

type CommentsResponse = {
  ok: boolean;
  data?: {
    commentsPage?: ChaosLabCommentsPage;
    commentsCount?: number;
  };
  error?: string;
  details?: string[];
};

export function ChaosCommentsPanel({
  buildSlug,
  initialCommentsPage
}: {
  buildSlug: string;
  initialCommentsPage: ChaosLabCommentsPage;
}) {
  const [commentsPage, setCommentsPage] = useState(initialCommentsPage);
  const [body, setBody] = useState("");
  const [state, setState] = useState<RequestState>("idle");
  const [message, setMessage] = useState("");

  async function loadPage(page: number) {
    setState("loading");
    setMessage("");

    try {
      const response = await fetch(`/api/chaos-lab/builds/${buildSlug}/comments?page=${page}&limit=${commentsPage.pageSize}`);
      const result = await response.json() as CommentsResponse;

      if (!response.ok || !result.ok || !result.data?.commentsPage) {
        setState("error");
        setMessage(result.error ?? "Comments could not be loaded.");
        return;
      }

      setCommentsPage(result.data.commentsPage);
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Comments could not be loaded.");
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch(`/api/chaos-lab/builds/${buildSlug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ body })
      });
      const result = await response.json() as CommentsResponse;

      if (!response.ok || !result.ok) {
        setState("error");
        setMessage(result.details?.[0] ?? result.error ?? "Comment could not be posted.");
        return;
      }

      setBody("");
      await loadPage(1);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Comment could not be posted.");
    }
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={submitComment} className="rounded-md border border-white/10 bg-white/[0.045] p-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-frost">
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Add Comment
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          maxLength={1000}
          className="mt-3 w-full rounded-md border border-white/10 bg-abyss/[0.72] px-3 py-3 text-sm font-bold leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-frost/50"
          placeholder="Share matchup notes, item timing, or what happened when you tested this build."
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-500">{body.length}/1000</p>
          <button
            type="submit"
            disabled={state === "submitting"}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-volt/30 bg-volt/[0.12] px-4 text-sm font-black text-volt transition hover:bg-volt/[0.18] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            Post
          </button>
        </div>
      </form>

      {message ? (
        <p className="rounded-md border border-ember/25 bg-ember/[0.08] px-3 py-2 text-sm font-bold text-ember">
          {message.includes("sign in") ? (
            <>
              <Link href="/chaos-lab/creator/sign-in" className="underline decoration-ember/50 underline-offset-4">
                Sign in
              </Link>
              {" "}to comment on Chaos Lab builds.
            </>
          ) : (
            message
          )}
        </p>
      ) : null}

      <ChaosCommentPreview comments={commentsPage.comments} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Page {commentsPage.page} of {commentsPage.totalPages} - {commentsPage.total.toLocaleString()} comments
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadPage(commentsPage.page - 1)}
            disabled={!commentsPage.hasPreviousPage || state === "loading"}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-3 text-sm font-black text-slate-300 transition hover:border-frost/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </button>
          <button
            type="button"
            onClick={() => loadPage(commentsPage.page + 1)}
            disabled={!commentsPage.hasNextPage || state === "loading"}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-3 text-sm font-black text-slate-300 transition hover:border-frost/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

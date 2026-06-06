"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";

type BookmarkState = "idle" | "loading" | "error";

type BookmarkStatus = {
  isSaved: boolean;
  savedCount: number;
};

type BookmarkResponse = {
  ok: boolean;
  data?: {
    bookmark?: BookmarkStatus;
  };
  error?: string;
};

export function ChaosBookmarkButton({
  buildSlug,
  initialIsSaved,
  initialSavedCount
}: {
  buildSlug: string;
  initialIsSaved: boolean;
  initialSavedCount: number;
}) {
  const [bookmark, setBookmark] = useState<BookmarkStatus>({
    isSaved: initialIsSaved,
    savedCount: initialSavedCount
  });
  const [state, setState] = useState<BookmarkState>("idle");
  const [message, setMessage] = useState("");

  async function toggleBookmark() {
    setState("loading");
    setMessage("");

    try {
      const response = await fetch(`/api/chaos-lab/builds/${buildSlug}/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          saved: !bookmark.isSaved
        })
      });
      const result = await response.json() as BookmarkResponse;

      if (!response.ok || !result.ok || !result.data?.bookmark) {
        setState("error");
        setMessage(result.error ?? "Build could not be saved.");
        return;
      }

      setBookmark(result.data.bookmark);
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Build could not be saved.");
    }
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={toggleBookmark}
        disabled={state === "loading"}
        className={`inline-flex h-12 items-center justify-center gap-2 rounded-md border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${bookmark.isSaved ? "border-volt/35 bg-volt/[0.12] text-volt" : "border-white/10 bg-white/[0.055] text-slate-300 hover:border-frost/30 hover:text-white"}`}
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : bookmark.isSaved ? (
          <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Bookmark className="h-4 w-4" aria-hidden="true" />
        )}
        {bookmark.isSaved ? "Saved" : "Save Build"}
      </button>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {bookmark.savedCount.toLocaleString()} saves
      </p>
      {message ? (
        <p className="rounded-md border border-ember/25 bg-ember/[0.08] px-3 py-2 text-sm font-bold text-ember">
          {message.includes("sign in") ? (
            <>
              <Link href="/chaos-lab/creator/sign-in" className="underline decoration-ember/50 underline-offset-4">
                Sign in
              </Link>
              {" "}to save Chaos Lab builds.
            </>
          ) : (
            message
          )}
        </p>
      ) : null}
    </div>
  );
}

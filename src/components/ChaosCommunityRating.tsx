import { Gauge, Star, ThumbsUp } from "lucide-react";
import type { ChaosLabCommunityRating } from "@/types/chaosLab";

export function ChaosCommunityRating({
  rating
}: {
  rating: ChaosLabCommunityRating;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-lg border border-volt/20 bg-volt/[0.07] p-5 shadow-card">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-volt">Community Score</p>
        <div className="mt-4 flex items-end gap-3">
          <p className="text-5xl font-black tracking-tight text-white">{rating.score.toFixed(1)}</p>
          <p className="pb-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-400">/ 10</p>
        </div>
        <div className="mt-4 flex gap-1.5 text-volt" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-5 w-5 fill-current" />
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Based on {rating.totalRatings.toLocaleString()} community ratings from players testing the build path.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.14em]">
          <span className="rounded-md border border-volt/20 bg-volt/[0.08] px-2 py-1 text-volt">
            {rating.upvotes.toLocaleString()} up
          </span>
          <span className="rounded-md border border-ember/20 bg-ember/[0.08] px-2 py-1 text-ember">
            {rating.downvotes.toLocaleString()} down
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div className="row-hover rounded-md border border-white/10 bg-white/[0.045] p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-frost">
            <ThumbsUp className="h-4 w-4" aria-hidden="true" />
            Upvote Rate
          </div>
          <p className="mt-3 text-3xl font-black text-white">{rating.upvoteRate}%</p>
        </div>
        <div className="row-hover rounded-md border border-white/10 bg-white/[0.045] p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-ember">
            <Gauge className="h-4 w-4" aria-hidden="true" />
            Pilot Difficulty
          </div>
          <p className="mt-3 text-3xl font-black text-white">{rating.difficultyVote}</p>
        </div>
      </div>
    </div>
  );
}

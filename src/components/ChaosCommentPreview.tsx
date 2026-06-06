import { MessageSquare } from "lucide-react";
import type { ChaosLabCommentPreview } from "@/types/chaosLab";

export function ChaosCommentPreview({
  comments
}: {
  comments: ChaosLabCommentPreview[];
}) {
  return (
    <div className="grid gap-3">
      {comments.map((comment) => (
        <article key={`${comment.author}-${comment.postedAgo}`} className="row-hover rounded-md border border-white/10 bg-white/[0.045] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-frost/20 bg-frost/[0.08] text-sm font-black text-frost">
                  {comment.author.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-black text-white">{comment.author}</p>
                  <p className="text-xs font-bold text-slate-500">{comment.badge}</p>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs font-bold text-slate-400">
              <MessageSquare className="h-3.5 w-3.5 text-frost" aria-hidden="true" />
              {comment.postedAgo}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">{comment.comment}</p>
        </article>
      ))}
    </div>
  );
}

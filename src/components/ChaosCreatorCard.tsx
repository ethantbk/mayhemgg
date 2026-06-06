import Link from "next/link";
import { Award, FlaskConical, ThumbsUp } from "lucide-react";
import type { ChaosLabCreator } from "@/types/chaosLab";
import { ChampionAvatar } from "@/components/ChampionAvatar";

export function ChaosCreatorCard({ creator }: { creator: ChaosLabCreator }) {
  return (
    <Link href={`/chaos-lab/creator/${creator.slug}`} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-frost/60 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss">
    <article className="card-hover premium-border rounded-lg bg-panel/[0.72] p-5 shadow-card">
      <div className="flex items-center gap-4">
        <ChampionAvatar name={creator.featuredChampion} className="h-16 w-16" />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-volt">Creator Spotlight</p>
          <h3 className="mt-1 text-xl font-black text-white transition group-hover:text-frost">{creator.name}</h3>
          <p className="text-sm font-bold text-frost">{creator.handle}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{creator.spotlight}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-white/10 bg-white/[0.045] p-3">
          <Award className="h-4 w-4 text-volt" aria-hidden="true" />
          <p className="mt-2 text-xs font-bold text-slate-500">Specialty</p>
          <p className="mt-1 text-sm font-black text-white">{creator.specialty}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.045] p-3">
          <FlaskConical className="h-4 w-4 text-frost" aria-hidden="true" />
          <p className="mt-2 text-xs font-bold text-slate-500">Builds</p>
          <p className="mt-1 text-sm font-black text-white">{creator.buildsPublished}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.045] p-3">
          <ThumbsUp className="h-4 w-4 text-ember" aria-hidden="true" />
          <p className="mt-2 text-xs font-bold text-slate-500">Votes</p>
          <p className="mt-1 text-sm font-black text-white">{creator.totalVotes.toLocaleString()}</p>
        </div>
      </div>
    </article>
    </Link>
  );
}

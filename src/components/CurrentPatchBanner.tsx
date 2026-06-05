import { Database, RadioTower, Sparkles } from "lucide-react";
import { currentPatch, getPatchLabel } from "@/lib/patchConfig";

export function CurrentPatchBanner() {
  return (
    <section className="border-b border-white/10 bg-panel/[0.42] backdrop-blur-xl" aria-label="Current patch">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-frost/30 bg-frost/[0.1] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-frost">
            <RadioTower className="h-3.5 w-3.5" aria-hidden="true" />
            {getPatchLabel()}
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border border-volt/25 bg-volt/[0.08] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-volt">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {currentPatch.statusLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-400">
          <span>{currentPatch.modesLabel}</span>
          <span className="inline-flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            {currentPatch.dataSourceLabel}
          </span>
        </div>
      </div>
    </section>
  );
}

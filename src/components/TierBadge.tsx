import type { Tier } from "@/types";
import { cn } from "@/lib/utils";

const tierStyles: Record<Tier, string> = {
  "S+": "border-volt/50 bg-volt/[0.15] text-volt",
  S: "border-frost/50 bg-frost/[0.14] text-frost",
  A: "border-arcane/50 bg-arcane/[0.16] text-violet-200",
  B: "border-amber-300/45 bg-amber-300/[0.12] text-amber-200",
  C: "border-slate-400/40 bg-slate-400/10 text-slate-200"
};

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-10 items-center justify-center rounded-md border px-2 py-1 text-xs font-black", tierStyles[tier], className)}>
      {tier}
    </span>
  );
}

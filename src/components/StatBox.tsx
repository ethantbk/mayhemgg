import { cn } from "@/lib/utils";

export function StatBox({
  label,
  value,
  accent = "text-white",
  className
}: {
  label: string;
  value: string;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={cn("premium-border rounded-md bg-white/[0.035] p-4", className)}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={cn("mt-2 text-2xl font-black", accent)}>{value}</p>
    </div>
  );
}

import { cn } from "@/lib/utils";

export function ChampionAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      className={cn(
        "relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-white/[0.12] bg-gradient-to-br from-frost/25 via-arcane/20 to-ember/25 text-lg font-black text-white shadow-card",
        className
      )}
      aria-label={`${name} icon placeholder`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.28),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.1),transparent)]" />
      <span className="relative">{initials}</span>
    </div>
  );
}

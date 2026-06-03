import { cn } from "@/lib/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function ChampionCardSkeleton() {
  return (
    <div className="premium-border rounded-lg bg-panel/[0.72] p-4">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-14 w-14 shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-12" />
        <SkeletonBlock className="h-12" />
      </div>
      <SkeletonBlock className="mt-5 h-9" />
    </div>
  );
}

export function BuildCardSkeleton() {
  return (
    <div className="premium-border rounded-lg bg-panel/[0.72] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-16 w-16" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-6 w-44" />
          </div>
        </div>
        <SkeletonBlock className="h-14 w-36" />
      </div>
      <SkeletonBlock className="mt-5 h-16" />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-10" />
        <SkeletonBlock className="h-10" />
      </div>
    </div>
  );
}

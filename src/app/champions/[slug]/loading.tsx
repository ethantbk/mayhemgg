import { ChampionCardSkeleton, SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SkeletonBlock className="h-44 w-full rounded-lg" />
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <SkeletonBlock className="h-48 rounded-lg" />
        <SkeletonBlock className="h-48 rounded-lg" />
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <ChampionCardSkeleton />
        <ChampionCardSkeleton />
        <ChampionCardSkeleton />
      </div>
    </div>
  );
}

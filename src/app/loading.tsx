import { BuildCardSkeleton, ChampionCardSkeleton, SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SkeletonBlock className="h-72 w-full rounded-lg" />
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        <ChampionCardSkeleton />
        <ChampionCardSkeleton />
        <ChampionCardSkeleton />
      </div>
      <div className="mt-10 grid gap-5">
        <BuildCardSkeleton />
        <BuildCardSkeleton />
      </div>
    </div>
  );
}

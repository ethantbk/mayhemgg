import { ChampionCardSkeleton, SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SkeletonBlock className="h-8 w-36" />
      <SkeletonBlock className="mt-4 h-12 w-full max-w-2xl" />
      <SkeletonBlock className="mt-8 h-24 w-full rounded-lg" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ChampionCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

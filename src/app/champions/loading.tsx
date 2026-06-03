import { ChampionCardSkeleton, SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SkeletonBlock className="h-8 w-40" />
      <SkeletonBlock className="mt-4 h-12 w-full max-w-xl" />
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_28rem]">
        <SkeletonBlock className="h-12" />
        <SkeletonBlock className="h-32" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <ChampionCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

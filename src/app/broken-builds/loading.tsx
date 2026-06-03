import { BuildCardSkeleton, SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SkeletonBlock className="h-8 w-44" />
      <SkeletonBlock className="mt-4 h-12 w-full max-w-2xl" />
      <div className="mt-8 grid gap-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <BuildCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

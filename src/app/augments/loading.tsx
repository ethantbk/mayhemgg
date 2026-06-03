import { SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SkeletonBlock className="h-8 w-32" />
      <SkeletonBlock className="mt-4 h-12 w-full max-w-2xl" />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="premium-border rounded-lg bg-panel/[0.72] p-5">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="mt-4 h-20" />
            <SkeletonBlock className="mt-5 h-10 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function AppSegmentLoading() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-7 w-48 rounded-xl" />
        </div>
        <div className="hidden sm:flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}


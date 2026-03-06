import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_#1a3c2f,_#020617)] flex items-center justify-center px-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 rounded-full bg-slate-800/80" />
          <Skeleton className="h-8 w-64 rounded-xl bg-slate-800/80" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl bg-slate-800/80" />
          <Skeleton className="h-32 rounded-2xl bg-slate-800/80" />
          <Skeleton className="h-32 rounded-2xl bg-slate-800/80" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-40 rounded-full bg-slate-800/80" />
          <Skeleton className="h-48 rounded-2xl bg-slate-800/80" />
        </div>
      </div>
    </div>
  );
}


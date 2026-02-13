import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "../page-header";

export function DashboardSkeleton() {
  return (
    <>
    <PageHeader
        title="Dashboard"
        description="Welcome back! Here's a snapshot of your business."
      />
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
       <Skeleton className="h-[200px] w-full" />
    </div>
    </>
  );
}

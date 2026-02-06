'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { ActivityLog } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import * as Icons from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LucideIcon = ({ name, className }: { name: string, className?: string }) => {
  const Icon = (Icons as any)[name];
  if (!Icon) {
    return <Icons.Activity className={className} />; // Fallback icon
  }
  return <Icon className={className} />;
};


export function RecentActivity() {
  const firestore = useFirestore();

  const activityQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'activity_logs'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
  }, [firestore]);

  const { data: activities, isLoading: areActivitiesLoading } = useCollection<ActivityLog>(activityQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>A log of recent events in the CRM.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {areActivitiesLoading && (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        )}
        {!areActivitiesLoading && activities && activities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
        )}
        {!areActivitiesLoading && activities && activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <LucideIcon name={activity.icon} className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm text-muted-foreground">
                {activity.description}
              </p>
            </div>
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              {activity.timestamp ? formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true }) : ''}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

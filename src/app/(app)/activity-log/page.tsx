'use client';
import { PageHeader } from '@/components/page-header';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AuditLog } from '@/lib/types';
import { format } from 'date-fns';
import { useCurrentUser } from '@/hooks/use-current-user';

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-yellow-100 text-yellow-800',
  delete: 'bg-red-100 text-red-800',
};

function ActivityLogTable({ data, isLoading }: { data: AuditLog[] | null, isLoading: boolean }) {
   if (isLoading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
   }

   if (!data || data.length === 0) {
    return <p className="text-muted-foreground">No activity has been logged yet.</p>;
  }
  
  const toDate = (timestamp: any): Date => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Collection</TableHead>
            <TableHead>Document ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((log) => (
            <TableRow key={log.id}>
                <TableCell>{format(toDate(log.timestamp), 'PPp')}</TableCell>
                <TableCell>{log.userEmail}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={actionColors[log.action]}>
                        {log.action}
                    </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{log.collectionName}</TableCell>
                <TableCell className="font-mono text-xs">{log.docId}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


export default function ActivityLogPage() {
  const firestore = useFirestore();
  const { isAuthenticated, isLoading: isUserLoading } = useCurrentUser();

  const logsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore]);

  const { data: logs, isLoading: areLogsLoading } = useCollection<AuditLog>(logsQuery);

  const isLoading = isUserLoading || areLogsLoading;

  return (
    <>
      <PageHeader
        title="Activity Log"
        description="A record of all create, update, and delete actions in the CRM."
      />
      <Card>
        <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Showing the last 50 events.</CardDescription>
        </CardHeader>
        <CardContent>
            <ActivityLogTable data={logs} isLoading={isLoading} />
        </CardContent>
      </Card>
    </>
  );
}

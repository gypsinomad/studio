'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Task, TaskStatus } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


const statusColors: Record<TaskStatus, string> = {
    open: 'bg-blue-100 text-blue-800',
    inProgress: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800',
}

function TasksTable({ data }: { data: Task[] }) {
   if (data.length === 0) {
    return <p className="text-muted-foreground">You have no tasks assigned to you.</p>;
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
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize", statusColors[task.status])}>
                    {task.status}
                </Badge>
              </TableCell>
              <TableCell>{format(toDate(task.dueDate), 'PP')}</TableCell>
              <TableCell>{format(toDate(task.createdAt), 'PP')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function TasksPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'tasks'), where('assigneeId', '==', user.uid));
  }, [firestore, user]);

  const { data: tasks, isLoading } = useCollection(tasksQuery);

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Organize your work and track important to-dos."
      >
        <Button>
          <PlusCircle className="mr-2" />
          New Task
        </Button>
      </PageHeader>
      
      {isLoading && (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && tasks && <TasksTable data={tasks} />}
    </>
  );
}

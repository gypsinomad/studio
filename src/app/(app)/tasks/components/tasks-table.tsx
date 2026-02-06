'use client';
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
};

interface TasksTableProps {
  data: Task[];
}

export function TasksTable({ data }: TasksTableProps) {
   if (data.length === 0) {
    return <p className="text-muted-foreground">You have no tasks assigned to you in this company.</p>;
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
                    {task.status.replace(/([A-Z])/g, ' $1')}
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

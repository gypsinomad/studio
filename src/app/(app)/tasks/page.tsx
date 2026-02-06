'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { TasksTable } from './components/tasks-table';
import { useCurrentCompany } from '@/hooks/use-current-company';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NewTaskForm } from './components/new-task-form';

export default function TasksPage() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { companyId, isLoading: isCompanyLoading } = useCurrentCompany();
  const { isSales, isAdmin, isLoading: isUserLoading } = useCurrentUser();

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user || !companyId) return null;
    return query(
      collection(firestore, 'companies', companyId, 'tasks'), 
      where('assigneeId', '==', user.uid),
      orderBy('dueDate', 'desc')
    );
  }, [firestore, user, companyId]);

  const { data: tasks, isLoading: areTasksLoading } = useCollection(tasksQuery);

  const isLoading = isCompanyLoading || areTasksLoading || isUserLoading;
  const canCreate = (isSales || isAdmin) && !!companyId;


  return (
    <>
      <PageHeader
        title="My Tasks"
        description="Organize your work and track important to-dos."
      >
        <Button onClick={() => setIsNewTaskOpen(true)} disabled={!canCreate}>
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

      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create a New Task</DialogTitle>
                <DialogDescription>
                    This task will be assigned to you in the current company.
                </DialogDescription>
            </DialogHeader>
            <NewTaskForm onSuccess={() => setIsNewTaskOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Info } from 'lucide-react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { TasksTable } from './components/tasks-table';
import { useCurrentCompany } from '@/hooks/use-current-company';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NewTaskForm } from './components/new-task-form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function TasksPage() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { companyId, companyIds, isLoading: isCompanyLoading } = useCurrentCompany();
  const { isAuthenticated, isLoading: isUserLoading } = useCurrentUser();

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
  const canCreate = !!companyId && isAuthenticated;


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
      
      {!isLoading && companyIds.length === 0 && isAuthenticated && (
         <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Create a Company to Get Started</AlertTitle>
            <AlertDescription>
                You need to create or be added to a company before you can manage tasks.
                Go to the <Link href="/companies" className="font-bold hover:underline">Companies page</Link> to create your first one.
            </AlertDescription>
         </Alert>
      )}

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

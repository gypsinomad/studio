'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { TasksTable } from './components/tasks-table';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { NewTaskForm } from './components/new-task-form';
import { logActivity } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export default function TasksPage() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isUserLoading } = useCurrentUser();

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // RESTRICTION REMOVED: Fetch all tasks for everyone.
    return query(
      collection(firestore, 'tasks'), 
      orderBy('dueDate', 'desc')
    );
  }, [firestore]);

  const { data: tasks, isLoading: areTasksLoading } = useCollection(tasksQuery);

  const isLoading = areTasksLoading || isUserLoading;

  const handleDeleteRequest = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTaskId || !firestore || !user) return;

    const docRef = doc(firestore, 'tasks', selectedTaskId);
    try {
      const beforeSnap = await getDoc(docRef);
      if (beforeSnap.exists()) {
        await logActivity(firestore, user, 'delete', 'tasks', selectedTaskId, beforeSnap.data(), null);
        await deleteDoc(docRef);
        toast({ title: 'Success', description: 'Task deleted.' });
      }
    } catch (error) {
      console.error("Failed to delete task: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete task.' });
    }
    
    setIsDeleteAlertOpen(false);
    setSelectedTaskId(null);
  };


  return (
    <>
      <PageHeader
        title="All Tasks"
        description="View and manage all tasks across the company."
      >
        <Button onClick={() => setIsNewTaskOpen(true)} disabled={!isAuthenticated || isLoading}>
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

      {!isLoading && tasks && <TasksTable data={tasks} onDelete={handleDeleteRequest} />}

      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create a New Task</DialogTitle>
                <DialogDescription>
                    The task will be visible to all team members.
                </DialogDescription>
            </DialogHeader>
            <NewTaskForm onSuccess={() => setIsNewTaskOpen(false)} />
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

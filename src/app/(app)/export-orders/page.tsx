'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ExportOrdersTable } from './components/export-orders-table';
import type { ExportOrder } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { logActivity } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';


export default function ExportOrdersPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const { userProfile, isAdmin, isAuthenticated, isLoading: isUserLoading } = useCurrentUser();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || !user) return null;
    
    const ordersCollection = collection(firestore, 'exportOrders');

    // RESTRICTION REMOVED: Fetch all orders for everyone.
    return query(ordersCollection);
  }, [firestore, userProfile, user, isAdmin]);

  const { data: orders, isLoading: areOrdersLoading } = useCollection<ExportOrder>(ordersQuery);

  const isLoading = isUserLoading || areOrdersLoading;

  const handleEditRequest = (orderId: string) => {
    router.push(`/export-orders/${orderId}/edit`);
  };

  const handleDeleteRequest = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedOrderId || !firestore || !user) return;

    const docRef = doc(firestore, 'exportOrders', selectedOrderId);
    try {
      const beforeSnap = await getDoc(docRef);
      if (beforeSnap.exists()) {
        await logActivity(firestore, user, 'delete', 'exportOrders', selectedOrderId, beforeSnap.data(), null);
        await deleteDoc(docRef);
        toast({ title: 'Success', description: 'Export order deleted.' });
      }
    } catch (error) {
      console.error("Failed to delete order: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete export order.' });
    }
    
    setIsDeleteAlertOpen(false);
    setSelectedOrderId(null);
  };

  return (
    <>
      <PageHeader
        title="Export Orders"
        description="Manage all your export orders and track their progress."
      >
        <Button onClick={() => router.push('/export-orders/new')} disabled={!isAuthenticated || isLoading}>
          <PlusCircle className="mr-2" />
          New Export Order
        </Button>
      </PageHeader>
      
      {isLoading && (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && orders && orders.length > 0 && <ExportOrdersTable data={orders} onDelete={handleDeleteRequest} onEdit={handleEditRequest} />}

      {!isLoading && (!orders || orders.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No export orders yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start managing your export operations by creating your first export order. Track shipments, documents, and payments all in one place.
          </p>
          <Button onClick={() => router.push('/export-orders/new')} disabled={!isAuthenticated}>
            <PlusCircle className="mr-2" />
            Create Your First Export Order
          </Button>
        </div>
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the export order.
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

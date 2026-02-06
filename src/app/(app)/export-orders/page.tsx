'use client';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ExportOrdersTable } from './components/export-orders-table';
import type { ExportOrder } from '@/lib/types';


export default function ExportOrdersPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, userProfile, isAdmin, isAuthenticated, isLoading: isUserLoading } = useCurrentUser();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || !user) return null;
    
    const ordersCollection = collection(firestore, 'exportOrders');

    if (isAdmin) {
      return query(ordersCollection);
    } 
    return query(ordersCollection, where('assignedUserId', '==', user.uid));
  }, [firestore, userProfile, user, isAdmin]);

  const { data: orders, isLoading: areOrdersLoading } = useCollection<ExportOrder>(ordersQuery);

  const isLoading = isUserLoading || areOrdersLoading;

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

      {!isLoading && orders && <ExportOrdersTable data={orders} />}
    </>
  );
}

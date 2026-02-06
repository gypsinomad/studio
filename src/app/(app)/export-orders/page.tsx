'use client';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentCompany } from '@/hooks/use-current-company';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ExportOrdersTable } from './components/export-orders-table';
import type { ExportOrder } from '@/lib/types';


export default function ExportOrdersPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, userProfile, isAdmin, isSales, isLoading: isUserLoading } = useCurrentUser();
  const { companyId, isLoading: isCompanyLoading } = useCurrentCompany();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !companyId || !userProfile || !user) return null;
    
    const ordersCollection = collection(firestore, 'companies', companyId, 'exportOrders');

    // Admins can see all orders in the company
    if (isAdmin) {
      return query(ordersCollection);
    } 
    // Sales executives see only the orders they are assigned to
    return query(ordersCollection, where('assignedUserId', '==', user.uid));
  }, [firestore, companyId, userProfile, user, isAdmin]);

  const { data: orders, isLoading: areOrdersLoading } = useCollection<ExportOrder>(ordersQuery);

  const isLoading = isCompanyLoading || isUserLoading || areOrdersLoading;
  const canCreate = (isAdmin || isSales) && !!companyId;

  return (
    <>
      <PageHeader
        title="Export Orders"
        description="Manage all your export orders and track their progress."
      >
        <Button onClick={() => router.push('/export-orders/new')} disabled={!canCreate}>
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

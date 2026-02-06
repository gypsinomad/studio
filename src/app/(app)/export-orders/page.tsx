'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentCompany } from '@/hooks/use-current-company';
import { ExportOrdersTable } from './components/export-orders-table';
import type { ExportOrder } from '@/lib/types';


export default function ExportOrdersPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { companyId, isLoading: isCompanyLoading } = useCurrentCompany();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !companyId || !userProfile || !user) return null;
    
    const ordersCollection = collection(firestore, 'companies', companyId, 'exportOrders');

    if (userProfile.role === 'admin') {
      return query(ordersCollection);
    } else {
      return query(ordersCollection, where('assignedUserId', '==', user.uid));
    }
  }, [firestore, companyId, userProfile, user]);

  const { data: orders, isLoading: areOrdersLoading } = useCollection<ExportOrder>(ordersQuery);

  const isLoading = isCompanyLoading || isProfileLoading || areOrdersLoading;

  return (
    <>
      <PageHeader
        title="Export Orders"
        description="Manage all your export orders and track their progress."
      >
        <Button onClick={() => router.push('/export-orders/new')}>
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

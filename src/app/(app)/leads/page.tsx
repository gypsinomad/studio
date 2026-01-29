'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';
import { LeadsTable } from './components/leads-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeadsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const leadsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    // According to the security rules, leads are in a subcollection under the user
    return query(collection(firestore, `users/${user.uid}/leads`));
  }, [firestore, user]);

  const { data: leads, isLoading } = useCollection(leadsQuery);

  return (
    <>
      <PageHeader
        title="Leads"
        description="Manage all your potential customers and track their progress."
      >
        <Button>
          <PlusCircle />
          New Lead
        </Button>
      </PageHeader>
      
      {isLoading && (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && leads && <LeadsTable data={leads} />}
    </>
  );
}

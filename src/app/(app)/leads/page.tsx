'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { LeadsTable } from './components/leads-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentCompany } from '@/hooks/use-current-company';

export default function LeadsPage() {
  const firestore = useFirestore();
  const { companyId, isLoading: isCompanyLoading } = useCurrentCompany();

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || !companyId) return null;
    // Query the nested 'leads' subcollection within the current company.
    return query(collection(firestore, 'companies', companyId, 'leads'));
  }, [firestore, companyId]);

  const { data: leads, isLoading: areLeadsLoading } = useCollection(leadsQuery);

  const isLoading = isCompanyLoading || areLeadsLoading;

  return (
    <>
      <PageHeader
        title="Leads"
        description="Manage all your potential customers and track their progress."
      >
        <Button>
          <PlusCircle className="mr-2" />
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

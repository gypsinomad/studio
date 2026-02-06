'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { LeadsTable } from './components/leads-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentCompany } from '@/hooks/use-current-company';

export default function LeadsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { companyId, isLoading: isCompanyLoading } = useCurrentCompany();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || !companyId || !userProfile || !user) return null;
    
    const leadsCollection = collection(firestore, 'companies', companyId, 'leads');

    if (userProfile.role === 'admin') {
      return query(leadsCollection);
    } else {
      return query(leadsCollection, where('assignedUserId', '==', user.uid));
    }
  }, [firestore, companyId, userProfile, user]);

  const { data: leads, isLoading: areLeadsLoading } = useCollection(leadsQuery);

  const isLoading = isCompanyLoading || isProfileLoading || areLeadsLoading;

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

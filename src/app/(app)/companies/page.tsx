'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { CompaniesTable } from './components/companies-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentCompany } from '@/hooks/use-current-company';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NewCompanyForm } from './components/new-company-form';

export default function CompaniesPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isNewCompanyOpen, setIsNewCompanyOpen] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userProfileRef);

  // This query will fetch all company documents where the company ID
  // is in the user's `companyIds` array.
  const companiesQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.companyIds || userProfile.companyIds.length === 0) return null;
    // Firestore 'in' queries are limited to 30 items. For more, you'd need to fetch individually.
    return query(collection(firestore, 'companies'), where('__name__', 'in', userProfile.companyIds));
  }, [firestore, userProfile]);

  const { data: companies, isLoading } = useCollection(companiesQuery);

  return (
    <>
      <PageHeader
        title="Companies"
        description="Manage your database of client and partner companies."
      >
        <Button onClick={() => setIsNewCompanyOpen(true)}>
          <PlusCircle />
          New Company
        </Button>
      </PageHeader>
      
      {isLoading && (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && companies && <CompaniesTable data={companies} />}

      <Dialog open={isNewCompanyOpen} onOpenChange={setIsNewCompanyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Company</DialogTitle>
            <DialogDescription>
              This will create a new company tenant in your CRM.
            </DialogDescription>
          </DialogHeader>
          <NewCompanyForm onSuccess={() => setIsNewCompanyOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

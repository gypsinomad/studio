'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { CompaniesTable } from './components/companies-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NewCompanyForm } from './components/new-company-form';

export default function CustomersPage() {
  const [isNewCompanyOpen, setIsNewCompanyOpen] = useState(false);
  const firestore = useFirestore();
  const { isAuthenticated, isLoading: isUserLoading } = useCurrentUser();

  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: companies, isLoading: areCompaniesLoading } = useCollection(companiesQuery);

  const isLoading = areCompaniesLoading || isUserLoading;

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage your customer companies."
      >
        <Button onClick={() => setIsNewCompanyOpen(true)} disabled={!isAuthenticated || isLoading}>
          <PlusCircle />
          New Customer
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
                <DialogTitle>Create a New Customer Company</DialogTitle>
                <DialogDescription>
                    This customer will be added to your CRM.
                </DialogDescription>
            </DialogHeader>
            <NewCompanyForm onSuccess={() => setIsNewCompanyOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

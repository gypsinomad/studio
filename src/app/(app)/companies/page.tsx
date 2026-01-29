'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection } from '@/firebase';
import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { CompaniesTable } from './components/companies-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function CompaniesPage() {
  const firestore = useFirestore();

  const companiesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'));
  }, [firestore]);

  const { data: companies, isLoading } = useCollection(companiesQuery);

  return (
    <>
      <PageHeader
        title="Companies"
        description="Manage your database of client and partner companies."
      >
        <Button>
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
    </>
  );
}

'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { ContactsTable } from './components/contacts-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentCompany } from '@/hooks/use-current-company';

export default function ContactsPage() {
  const firestore = useFirestore();
  const { companyId, isLoading: isCompanyLoading } = useCurrentCompany();

  const contactsQuery = useMemoFirebase(() => {
    if (!firestore || !companyId) return null;
    return query(collection(firestore, 'companies', companyId, 'contacts'));
  }, [firestore, companyId]);

  const { data: contacts, isLoading: areContactsLoading } = useCollection(contactsQuery);

  const isLoading = isCompanyLoading || areContactsLoading;

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Keep track of all your business contacts."
      >
        <Button>
          <PlusCircle />
          New Contact
        </Button>
      </PageHeader>
      
      {isLoading && (
         <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && contacts && <ContactsTable data={contacts} />}
    </>
  );
}

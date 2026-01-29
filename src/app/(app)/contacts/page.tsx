'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection } from '@/firebase';
import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { ContactsTable } from './components/contacts-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContactsPage() {
  const firestore = useFirestore();

  const contactsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'contacts'));
  }, [firestore]);

  const { data: contacts, isLoading } = useCollection(contactsQuery);

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

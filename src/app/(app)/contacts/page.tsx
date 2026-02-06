'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { ContactsTable } from './components/contacts-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentCompany } from '@/hooks/use-current-company';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NewContactForm } from './components/new-contact-form';

export default function ContactsPage() {
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const firestore = useFirestore();
  const { companyId, isLoading: isCompanyLoading } = useCurrentCompany();
  const { isSales, isAdmin, isLoading: isUserLoading } = useCurrentUser();

  const contactsQuery = useMemoFirebase(() => {
    if (!firestore || !companyId) return null;
    return query(collection(firestore, 'companies', companyId, 'contacts'));
  }, [firestore, companyId]);

  const { data: contacts, isLoading: areContactsLoading } = useCollection(contactsQuery);

  const isLoading = isCompanyLoading || areContactsLoading || isUserLoading;
  const canCreate = (isSales || isAdmin) && !!companyId;

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Keep track of all your business contacts."
      >
        <Button onClick={() => setIsNewContactOpen(true)} disabled={!canCreate}>
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

      <Dialog open={isNewContactOpen} onOpenChange={setIsNewContactOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create a New Contact</DialogTitle>
                <DialogDescription>
                    This contact will be associated with your currently selected company.
                </DialogDescription>
            </DialogHeader>
            <NewContactForm onSuccess={() => setIsNewContactOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

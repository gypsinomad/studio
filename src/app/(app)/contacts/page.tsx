'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Info } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { ContactsTable } from './components/contacts-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentCompany } from '@/hooks/use-current-company';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NewContactForm } from './components/new-contact-form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function ContactsPage() {
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const firestore = useFirestore();
  const { companyId, companyIds, isLoading: isCompanyLoading } = useCurrentCompany();
  const { isAuthenticated, isLoading: isUserLoading } = useCurrentUser();

  const contactsQuery = useMemoFirebase(() => {
    if (!firestore || !companyId) return null;
    return query(collection(firestore, 'companies', companyId, 'contacts'));
  }, [firestore, companyId]);

  const { data: contacts, isLoading: areContactsLoading } = useCollection(contactsQuery);

  const isLoading = isCompanyLoading || areContactsLoading || isUserLoading;
  const canCreate = !!companyId && isAuthenticated;

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

      {!isLoading && companyIds.length === 0 && isAuthenticated && (
         <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Create a Company to Get Started</AlertTitle>
            <AlertDescription>
                You need to create or be added to a company before you can manage contacts.
                Go to the <Link href="/companies" className="font-bold hover:underline">Companies page</Link> to create your first one.
            </AlertDescription>
         </Alert>
      )}
      
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

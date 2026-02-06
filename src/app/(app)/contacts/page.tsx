'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ContactsTable } from './components/contacts-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { NewContactForm } from './components/new-contact-form';
import { logActivity } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export default function ContactsPage() {
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isUserLoading } = useCurrentUser();

  const contactsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'contacts'));
  }, [firestore]);

  const { data: contacts, isLoading: areContactsLoading } = useCollection(contactsQuery);

  const isLoading = areContactsLoading || isUserLoading;

  const handleDeleteRequest = (contactId: string) => {
    setSelectedContactId(contactId);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedContactId || !firestore || !user) return;

    const docRef = doc(firestore, 'contacts', selectedContactId);
    try {
      const beforeSnap = await getDoc(docRef);
      if (beforeSnap.exists()) {
        await logActivity(firestore, user, 'delete', 'contacts', selectedContactId, beforeSnap.data(), null);
        await deleteDoc(docRef);
        toast({ title: 'Success', description: 'Contact deleted.' });
      }
    } catch (error) {
      console.error("Failed to delete contact: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete contact.' });
    }
    
    setIsDeleteAlertOpen(false);
    setSelectedContactId(null);
  };


  return (
    <>
      <PageHeader
        title="Contacts"
        description="Keep track of all your business contacts."
      >
        <Button onClick={() => setIsNewContactOpen(true)} disabled={!isAuthenticated || isLoading}>
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

      {!isLoading && contacts && <ContactsTable data={contacts} onDelete={handleDeleteRequest} />}

      <Dialog open={isNewContactOpen} onOpenChange={setIsNewContactOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create a New Contact</DialogTitle>
                <DialogDescription>
                    This contact will be added to your CRM.
                </DialogDescription>
            </DialogHeader>
            <NewContactForm onSuccess={() => setIsNewContactOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

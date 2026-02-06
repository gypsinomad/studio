'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { CompaniesTable } from './components/companies-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { NewCompanyForm } from './components/new-company-form';
import { logActivity } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const [isNewCompanyOpen, setIsNewCompanyOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isUserLoading } = useCurrentUser();

  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: companies, isLoading: areCompaniesLoading } = useCollection(companiesQuery);

  const isLoading = areCompaniesLoading || isUserLoading;

  const handleDeleteRequest = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setIsDeleteAlertOpen(true);
  };
  
  const handleEditRequest = (companyId: string) => {
    // TODO: Implement edit functionality
    toast({ title: 'Not Implemented', description: 'Editing companies will be available soon.' });
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCompanyId || !firestore || !user) return;

    const docRef = doc(firestore, 'companies', selectedCompanyId);
    try {
      const beforeSnap = await getDoc(docRef);
      if (beforeSnap.exists()) {
        await logActivity(firestore, user, 'delete', 'companies', selectedCompanyId, beforeSnap.data(), null);
        await deleteDoc(docRef);
        toast({ title: 'Success', description: 'Customer company deleted.' });
      }
    } catch (error) {
      console.error("Failed to delete company: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete company.' });
    }
    
    setIsDeleteAlertOpen(false);
    setSelectedCompanyId(null);
  };

  return (
    <>
      <PageHeader
        title="Customers"
        description="Manage your customer companies."
      >
        <Button onClick={() => setIsNewCompanyOpen(true)} disabled={!isAuthenticated || isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" />
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

      {!isLoading && companies && <CompaniesTable data={companies} onDelete={handleDeleteRequest} onEdit={handleEditRequest} />}

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
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer company.
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

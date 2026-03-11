'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { collection, query, where, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { LeadsTable } from './components/leads-table';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { NewLeadForm } from './components/new-lead-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LeadDetails } from './components/lead-details';
import type { Lead } from '@/lib/types';
import { logActivity } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

export default function LeadsPage() {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const firestore = useFirestore();
  const { user, userProfile, isAuthenticated, isLoading: isUserLoading, idToken } = useCurrentUser();
  const { toast } = useToast();

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile || !user) return null;
    
    const leadsCollectionRef = collection(firestore, 'leads');
    
    const filters = [];
    
    // RESTRICTION REMOVED: Do not filter by assignedUserId.
    if (sourceFilter) {
      filters.push(where('source', '==', sourceFilter));
    }

    return query(leadsCollectionRef, ...filters);

  }, [firestore, userProfile, user, sourceFilter]);

  const { data: leads, isLoading: areLeadsLoading } = useCollection(leadsQuery);

  const isLoading = isUserLoading || areLeadsLoading;

  const handleRowClick = (lead: Lead) => setSelectedLead(lead);
  const handleSheetClose = () => setSelectedLead(null);

  const toggleFilter = (filter: string) => {
    setSourceFilter(current => (current === filter ? null : filter));
  };

  const handleDeleteRequest = (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLeadId || !firestore || !user) return;

    const docRef = doc(firestore, 'leads', selectedLeadId);
    try {
      const beforeSnap = await getDoc(docRef);
      if (beforeSnap.exists()) {
        await logActivity(firestore, user, 'delete', 'leads', selectedLeadId, beforeSnap.data(), null);
        await deleteDoc(docRef);
        toast({ title: 'Success', description: 'Lead deleted.' });
      }
    } catch (error) {
      console.error("Failed to delete lead: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete lead.' });
    }
    
    setIsDeleteAlertOpen(false);
    setSelectedLeadId(null);
  };


  return (
    <>
      <PageHeader
        title="Leads"
        description="Manage all your potential customers and track their progress."
      >
        <div className="flex items-center gap-2">
            <Button 
                variant={sourceFilter === 'whatsapp' ? 'default' : 'outline'}
                onClick={() => toggleFilter('whatsapp')}>
                WhatsApp
            </Button>
            <Button 
                variant={sourceFilter === 'facebookLeadAds' ? 'default' : 'outline'}
                onClick={() => toggleFilter('facebookLeadAds')}>
                Facebook
            </Button>
             <Button onClick={() => setIsNewLeadOpen(true)} disabled={!isAuthenticated || isLoading}>
                <PlusCircle className="mr-2" />
                New Lead
            </Button>
        </div>
      </PageHeader>
      
      {isLoading && <TableSkeleton />}

      {!isLoading && leads && leads.length > 0 && <LeadsTable data={leads} onRowClick={handleRowClick} onDelete={handleDeleteRequest} />}

      {!isLoading && (!leads || leads.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Get started by adding your first lead. Click the "New Lead" button to begin building your sales pipeline.
          </p>
          <Button onClick={() => setIsNewLeadOpen(true)} disabled={!isAuthenticated}>
            <PlusCircle className="mr-2" />
            Add Your First Lead
          </Button>
        </div>
      )}

      <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Lead</DialogTitle>
            <DialogDescription>
              Enter the details below to add a new lead to your CRM.
            </DialogDescription>
          </DialogHeader>
          <NewLeadForm onSuccess={() => setIsNewLeadOpen(false)} />
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedLead} onOpenChange={(isOpen) => !isOpen && handleSheetClose()}>
        <SheetContent className="sm:max-w-md">
            {selectedLead && (
                <>
                <SheetHeader>
                    <SheetTitle>{selectedLead.fullName}</SheetTitle>
                    <SheetDescription>
                        Details for this lead from {selectedLead.companyName}.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <LeadDetails lead={selectedLead} />
                </div>
                </>
            )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead.
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

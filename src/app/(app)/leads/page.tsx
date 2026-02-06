'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Info } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { collection, query, where } from 'firebase/firestore';
import { LeadsTable } from './components/leads-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentCompany } from '@/hooks/use-current-company';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NewLeadForm } from './components/new-lead-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LeadDetails } from './components/lead-details';
import type { Lead } from '@/lib/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function LeadsPage() {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  const firestore = useFirestore();
  const { user, userProfile, isAuthenticated, isLoading: isUserLoading } = useCurrentUser();
  const { companyId, companyIds, isLoading: isCompanyLoading } = useCurrentCompany();

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || !companyId || !userProfile || !user) return null;
    
    let leadsCollectionRef = collection(firestore, 'companies', companyId, 'leads');
    
    const filters = [];
    if (userProfile.role !== 'admin') {
      filters.push(where('assignedUserId', '==', user.uid));
    }
    if (sourceFilter) {
      filters.push(where('source', '==', sourceFilter));
    }

    return query(leadsCollectionRef, ...filters);

  }, [firestore, companyId, userProfile, user, sourceFilter]);

  const { data: leads, isLoading: areLeadsLoading } = useCollection(leadsQuery);

  const isLoading = isCompanyLoading || isUserLoading || areLeadsLoading;
  const canCreate = !!companyId && isAuthenticated;

  const handleRowClick = (lead: Lead) => setSelectedLead(lead);
  const handleSheetClose = () => setSelectedLead(null);

  const toggleFilter = (filter: string) => {
    setSourceFilter(current => (current === filter ? null : filter));
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
             <Button onClick={() => setIsNewLeadOpen(true)} disabled={!canCreate}>
                <PlusCircle className="mr-2" />
                New Lead
            </Button>
        </div>
      </PageHeader>
      
      {!isLoading && companyIds.length === 0 && isAuthenticated && (
         <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Create a Company to Get Started</AlertTitle>
            <AlertDescription>
                You need to create or be added to a company before you can manage leads.
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

      {!isLoading && leads && <LeadsTable data={leads} onRowClick={handleRowClick} />}

      <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Lead</DialogTitle>
            <DialogDescription>
              Enter the details below to add a new lead to your current company.
            </DialogDescription>
          </DialogHeader>
          <NewLeadForm onSuccess={() => setIsNewLeadOpen(false)} />
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedLead} onOpenChange={(isOpen) => !isOpen && handleSheetClose()}>
        <SheetContent>
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
    </>
  );
}

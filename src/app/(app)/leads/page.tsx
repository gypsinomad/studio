'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { LeadsTable } from './components/leads-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentCompany } from '@/hooks/use-current-company';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NewLeadForm } from './components/new-lead-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LeadDetails } from './components/lead-details';
import type { Lead } from '@/lib/types';

export default function LeadsPage() {
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();
  const { companyId, isLoading: isCompanyLoading } = useCurrentCompany();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

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

  const isLoading = isCompanyLoading || isProfileLoading || areLeadsLoading;

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
             <Button onClick={() => setIsNewLeadOpen(true)} disabled={!companyId || isLoading}>
                <PlusCircle className="mr-2" />
                New Lead
            </Button>
        </div>
      </PageHeader>
      
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

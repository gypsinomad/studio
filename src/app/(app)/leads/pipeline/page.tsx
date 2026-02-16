
'use client';

import { useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Lead, LeadStatus } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const KANBAN_COLUMNS: { title: string; status: LeadStatus }[] = [
    { title: 'New', status: 'new' },
    { title: 'Contacted', status: 'contacted' },
    { title: 'Qualified', status: 'qualified' },
    { title: 'Quoted', status: 'quoted' },
    { title: 'Converted', status: 'converted' },
    { title: 'Lost', status: 'lost' },
];

function LeadCard({ lead }: { lead: Lead }) {
    return (
        <Card className="mb-3 hover:shadow-md transition-shadow cursor-grab">
            <CardContent className="p-3">
                <h4 className="font-semibold text-sm text-stone-800">{lead.fullName}</h4>
                <p className="text-xs text-stone-500 truncate">{lead.companyName}</p>
                <p className="text-xs text-stone-500 mt-1 truncate">{lead.productInterest}</p>
            </CardContent>
        </Card>
    )
}

export default function LeadPipelinePage() {
    const firestore = useFirestore();
    const { user, isAdmin, isLoading: isUserLoading } = useCurrentUser();
    const [leadsByStatus, setLeadsByStatus] = useState<Record<LeadStatus, Lead[]>>({
        new: [], contacted: [], qualified: [], quoted: [], converted: [], lost: []
    });

    const leadsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        const leadsCollectionRef = collection(firestore, 'leads');
        const filters = [];
        if (!isAdmin) {
            filters.push(where('assignedUserId', '==', user.uid));
        }
        return query(leadsCollectionRef, ...filters, orderBy('createdAt', 'desc'));
    }, [firestore, user, isAdmin]);

    const { data: leads, isLoading: areLeadsLoading } = useCollection<Lead>(leadsQuery);

    useEffect(() => {
        if (leads) {
            const grouped = leads.reduce((acc, lead) => {
                if (!acc[lead.status]) {
                    acc[lead.status] = [];
                }
                acc[lead.status].push(lead);
                return acc;
            }, { new: [], contacted: [], qualified: [], quoted: [], converted: [], lost: [] }); 
            setLeadsByStatus(grouped);
        }
    }, [leads]);
    
    const isLoading = isUserLoading || areLeadsLoading;

    return (
        <>
            <PageHeader
                title="Lead Pipeline"
                description="Visualize and manage your leads through the sales process."
            />
            <div className="flex-1 flex overflow-x-auto space-x-4 p-1 -mx-1">
                {KANBAN_COLUMNS.map(col => (
                    <div key={col.status} className="w-72 flex-shrink-0 bg-stone-100 rounded-xl">
                        <div className="p-3">
                            <h3 className="font-semibold text-stone-700 capitalize">{col.title} <span className="text-sm text-stone-500 font-normal">({leadsByStatus[col.status]?.length || 0})</span></h3>
                        </div>
                        <div className="p-3 space-y-2 h-full overflow-y-auto">
                            {isLoading && (
                                <>
                                 <Skeleton className="h-20 w-full" />
                                 <Skeleton className="h-20 w-full" />
                                 <Skeleton className="h-20 w-full" />
                                </>
                            )}
                            {!isLoading && leadsByStatus[col.status]?.map(lead => (
                                <LeadCard key={lead.id} lead={lead} />
                            ))}
                             {!isLoading && (!leadsByStatus[col.status] || leadsByStatus[col.status].length === 0) && (
                                <div className="text-center text-sm text-stone-500 py-10 h-full flex items-center justify-center">
                                    <p>No leads in this stage.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

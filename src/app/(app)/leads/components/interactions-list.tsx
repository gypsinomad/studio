'use client';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Interaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Phone, Mail, MessageSquare, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const typeIcons = {
    call: Phone,
    email: Mail,
    whatsapp: MessageSquare,
    meeting: Users,
    other: Phone,
};

const directionIcons = {
    outbound: ArrowUpRight,
    inbound: ArrowDownLeft,
};

const directionColors = {
    outbound: 'text-blue-500',
    inbound: 'text-green-500',
}

interface InteractionsListProps {
    leadId: string;
}

export function InteractionsList({ leadId }: InteractionsListProps) {
    const firestore = useFirestore();
    const interactionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'interactions'),
            where('leadId', '==', leadId),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, leadId]);

    const { data: interactions, isLoading } = useCollection<Interaction>(interactionsQuery);

    if (isLoading) {
        return <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
    }

    if (!interactions || interactions.length === 0) {
        return <p className="text-center text-sm text-muted-foreground py-4">No interactions logged yet.</p>
    }

    return (
        <div className="space-y-4">
             <h4 className="font-medium text-sm">Interaction History</h4>
            <TooltipProvider>
                <div className="space-y-3">
                {interactions.map(interaction => {
                    const TypeIcon = typeIcons[interaction.type];
                    const DirectionIcon = directionIcons[interaction.direction];
                    return (
                        <div key={interaction.id} className="flex items-start gap-3 text-sm">
                             <Tooltip>
                                <TooltipTrigger>
                                     <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground relative">
                                        <TypeIcon className="h-4 w-4" />
                                        <DirectionIcon className={`h-3 w-3 absolute -bottom-1 -right-1 p-0.5 bg-background rounded-full ${directionColors[interaction.direction]}`} />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="capitalize">{interaction.direction} {interaction.type}</p>
                                </TooltipContent>
                            </Tooltip>
                           
                            <div className="flex-1">
                                <p className="text-muted-foreground">{interaction.summary}</p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {interaction.timestamp ? formatDistanceToNow(interaction.timestamp.toDate(), { addSuffix: true }) : ''}
                            </p>
                        </div>
                    )
                })}
                </div>
            </TooltipProvider>
        </div>
    )

}

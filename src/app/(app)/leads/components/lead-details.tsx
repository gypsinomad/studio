
'use client';

import type { Lead, LeadPriority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, BrainCircuit, AlertTriangle, Flame, Zap, Snowflake, ArrowRight, Calendar, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LeadSource, LeadStatus } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { InteractionsList } from './interactions-list';
import { InteractionLogger } from './interaction-logger';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';


interface LeadDetailsProps {
    lead: Lead;
}

const statusColors: Record<LeadStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-green-100 text-green-800',
    quoted: 'bg-purple-100 text-purple-800',
    converted: 'bg-teal-100 text-teal-800',
    lost: 'bg-gray-100 text-gray-800'
};

const priorityColors: Record<LeadPriority, string> = {
    hot: 'bg-red-100 text-red-700',
    warm: 'bg-amber-100 text-amber-700',
    cold: 'bg-sky-100 text-sky-700',
};

const priorityIcons: Record<LeadPriority, React.ReactElement> = {
    hot: <Flame className="h-4 w-4 mr-1.5" />,
    warm: <Zap className="h-4 w-4 mr-1.5" />,
    cold: <Snowflake className="h-4 w-4 mr-1.5" />,
};


const getChannelName = (source: LeadSource | string) => {
    switch (source) {
        case 'whatsapp':
        case 'metaWhatsapp':
            return 'WhatsApp';
        case 'facebookLeadAds':
            return 'Facebook Lead Ad';
        case 'instagramDm':
            return 'Instagram';
        case 'manual':
            return 'Manual Entry';
        case 'website':
            return 'Website Form';
        case 'tradeShow':
            return 'Trade Show';
        case 'referral':
            return 'Referral';
        default:
            return 'Other';
    }
}

/** Helper to safely convert Firestore timestamps to Dates */
const toDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    return new Date(timestamp);
}

function FollowUpManager({ lead }: { lead: Lead }) {
    const { toast } = useToast();
    const { idToken } = useCurrentUser();
    const [nextFollowUp, setNextFollowUp] = useState<Date | undefined>(toDate(lead.nextFollowUpAt) || undefined);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveFollowUp = async () => {
        if (!idToken) {
            toast({ variant: 'destructive', title: "Authentication Error", description: "Could not authenticate your request. Please log in again." });
            return;
        }
        setIsSaving(true);
        try {
            const response = await fetch(`/api/leads/${lead.id}/update-follow-up`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ nextFollowUpAt: nextFollowUp }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update follow-up date.');
            }
            toast({ title: "Success", description: "Follow-up date updated." });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Error", description: error instanceof Error ? error.message : "An unknown error occurred." });
        } finally {
            setIsSaving(false);
        }
    }

    const lastContactDate = toDate(lead.lastContactAt);

    return (
        <div className="space-y-4 rounded-lg border p-4">
             <div className="space-y-1">
                <p className="font-medium text-sm">Follow-Up</p>
                <p className="text-xs text-muted-foreground">Manage contact schedule for this lead.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
                <p className="text-muted-foreground col-span-1">Last Contact</p>
                <p className="font-medium col-span-2">{lastContactDate ? format(lastContactDate, 'PPp') : 'N/A'}</p>
            </div>
             <div className="grid grid-cols-3 gap-2 items-center">
                <p className="text-muted-foreground col-span-1">Next Follow-Up</p>
                <div className="col-span-2">
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                               <Calendar className="mr-2 h-4 w-4" />
                               {nextFollowUp ? format(nextFollowUp, "PPP") : <span className="text-muted-foreground italic">Set a date</span>}
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                           <CalendarComponent mode="single" selected={nextFollowUp} onSelect={setNextFollowUp} initialFocus />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
             <Button size="sm" className="w-full" onClick={handleSaveFollowUp} disabled={isSaving}>
                {isSaving && <LoaderCircle className="animate-spin mr-2"/>}
                Save Follow-Up Date
            </Button>
        </div>
    )
}

export function LeadDetails({ lead }: LeadDetailsProps) {
    const router = useRouter();

    const handleConvertToOrder = () => {
        const query = new URLSearchParams({
            leadId: lead.id!,
            companyName: lead.companyName,
            contactName: lead.fullName,
            contactEmail: lead.email,
            contactPhone: lead.phone,
            productInterest: lead.productInterest,
            destinationCountry: lead.destinationCountry,
            incoterms: lead.incotermsPreference,
        }).toString();

        router.push(`/export-orders/new?${query}`);
    }

    return (
        <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-2 items-center">
                <p className="text-muted-foreground col-span-1">Status</p>
                <div className="col-span-2">
                    <Badge variant="outline" className={cn("capitalize", statusColors[lead.status] || 'bg-slate-100')}>
                        {lead.status}
                    </Badge>
                </div>
            </div>

             <div className="grid grid-cols-3 gap-2 items-center">
                <p className="text-muted-foreground col-span-1">Priority</p>
                <div className="col-span-2">
                    {lead.priority ? (
                        <Badge variant="outline" className={cn("capitalize items-center", priorityColors[lead.priority])}>
                           {priorityIcons[lead.priority]} {lead.priority}
                        </Badge>
                    ) : <span className="text-stone-400">-</span>}
                </div>
            </div>
             <div className="grid grid-cols-3 gap-2">
                <p className="text-muted-foreground col-span-1">Lead Score</p>
                <p className="font-medium col-span-2">{lead.score ?? 'N/A'}</p>
            </div>
            
            {lead.aiStandardization?.status && (
                 <div className="grid grid-cols-3 gap-2 items-center">
                    <p className="text-muted-foreground col-span-1">AI Status</p>
                    <div className="col-span-2">
                        <Badge variant={lead.aiStandardization.status === 'completed' ? 'success' : 'warning'}>
                            {lead.aiStandardization.status}
                        </Badge>
                    </div>
                </div>
            )}

            <Separator />
            
            <div className="grid grid-cols-3 gap-2">
                <p className="text-muted-foreground col-span-1">Full Name</p>
                <p className="font-medium col-span-2">{lead.fullName}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <p className="text-muted-foreground col-span-1">Company</p>
                <p className="col-span-2">{lead.companyName}</p>
            </div>
             <div className="grid grid-cols-3 gap-2">
                <p className="text-muted-foreground col-span-1">Email</p>
                <p className="col-span-2 break-all">{lead.email}</p>
            </div>
             <div className="grid grid-cols-3 gap-2">
                <p className="text-muted-foreground col-span-1">Phone</p>
                <p className="col-span-2">{lead.phone}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-2">
                <p className="text-muted-foreground col-span-1">Channel</p>
                <p className="col-span-2">{getChannelName(lead.source)}</p>
            </div>
             <div className="grid grid-cols-3 gap-2">
                <p className="text-muted-foreground col-span-1">Product Interest</p>
                <p className="col-span-2">{lead.productInterest}</p>
            </div>
             <div className="grid grid-cols-3 gap-2">
                <p className="text-muted-foreground col-span-1">Destination</p>
                <p className="col-span-2">{lead.destinationCountry}</p>
            </div>

            <Separator />

            <FollowUpManager lead={lead} />

            <Separator />

            <InteractionLogger leadId={lead.id!} />
            <InteractionsList leadId={lead.id!} />
            
            <div className="pt-4 space-y-2">
                 <Button className="w-full" onClick={handleConvertToOrder}>
                    Convert to Export Order
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {lead.whatsappThreadId && (
                    <>
                        <Button variant="outline" className="w-full" asChild>
                            <a href={`https://wa.me/${lead.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View in WhatsApp
                            </a>
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">(Opens WhatsApp)</p>
                    </>
                )}
            </div>
        </div>
    );
}

'use client';

import type { Lead } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, BrainCircuit, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LeadSource, LeadStatus } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

export function LeadDetails({ lead }: LeadDetailsProps) {
    return (
        <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-2 items-center">
                <p className="text-muted-foreground col-span-1">Status</p>
                <div className="col-span-2">
                    <Badge variant="outline" className={cn("capitalize", statusColors[lead.status])}>
                        {lead.status}
                    </Badge>
                </div>
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
            
            {lead.aiStandardization?.status === 'completed' && (
                 <Alert variant="success">
                    <BrainCircuit className="h-4 w-4" />
                    <AlertTitle>AI Enhanced</AlertTitle>
                    <AlertDescription>
                        This lead's data was successfully standardized by AI.
                    </AlertDescription>
                </Alert>
            )}

             {lead.aiStandardization?.status === 'failed' && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>AI Processing Failed</AlertTitle>
                    <AlertDescription>
                        Reason: {lead.aiStandardization.reason || 'Unknown error'}. The lead was saved with its original data.
                    </AlertDescription>
                </Alert>
            )}
            
            {lead.whatsappThreadId && (
                <div className="pt-4">
                    <Button variant="outline" className="w-full" asChild>
                        {/* The link is a placeholder, so no real href needed. */}
                        <a href={`https://wa.me/${lead.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View in WhatsApp
                        </a>
                    </Button>
                     <p className="text-xs text-center text-muted-foreground mt-2">(Opens WhatsApp)</p>
                </div>
            )}
        </div>
    );
}

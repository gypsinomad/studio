'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Lead, LeadSource, LeadStatus } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Laptop, User, MessageSquare, Facebook, Instagram, Building, Handshake, Users } from 'lucide-react';

interface LeadsTableProps {
  data: Lead[];
  onRowClick: (lead: Lead) => void;
}

const statusColors: Record<LeadStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-green-100 text-green-800',
    quoted: 'bg-purple-100 text-purple-800',
    converted: 'bg-teal-100 text-teal-800',
    lost: 'bg-gray-100 text-gray-800'
}

const sourceIcons: { [key in LeadSource | string]: React.ReactElement } = {
  manual: <User className="h-5 w-5 text-gray-500" />,
  website: <Laptop className="h-5 w-5 text-gray-500" />,
  whatsapp: <MessageSquare className="h-5 w-5 text-green-500" />,
  metaWhatsapp: <MessageSquare className="h-5 w-5 text-green-500" />,
  facebookLeadAds: <Facebook className="h-5 w-5 text-blue-600" />,
  instagramDm: <Instagram className="h-5 w-5 text-purple-600" />,
  tradeShow: <Building className="h-5 w-5 text-orange-500" />,
  referral: <Handshake className="h-5 w-5 text-indigo-500" />,
};

const sourceLabels: { [key in LeadSource | string]: string } = {
  manual: 'Manual',
  website: 'Website',
  whatsapp: 'WhatsApp',
  metaWhatsapp: 'WhatsApp',
  facebookLeadAds: 'Facebook',
  instagramDm: 'Instagram',
  tradeShow: 'Trade Show',
  referral: 'Referral',
};


export function LeadsTable({ data, onRowClick }: LeadsTableProps) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">No leads match the current filter.</p>;
  }

  const toDate = (timestamp: any): Date => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Full Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Product Interest</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((lead) => (
            <TableRow key={lead.id} onClick={() => onRowClick(lead)} className="cursor-pointer">
              <TableCell className="font-medium">{lead.fullName}</TableCell>
              <TableCell>{lead.companyName}</TableCell>
              <TableCell>{lead.productInterest}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize", statusColors[lead.status])}>
                    {lead.status}
                </Badge>
              </TableCell>
               <TableCell>
                <div className="flex items-center gap-2" title={sourceLabels[lead.source] ?? 'Unknown'}>
                  {sourceIcons[lead.source] ?? <User className="h-5 w-5 text-gray-500" />}
                  <span className="hidden lg:inline">{sourceLabels[lead.source] ?? 'Unknown'}</span>
                </div>
              </TableCell>
              <TableCell>{format(toDate(lead.createdAt), 'PP')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

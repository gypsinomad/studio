'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Lead, LeadSource, LeadStatus, LeadPriority } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Laptop, User, MessageSquare, Facebook, Instagram, Building, Handshake, MoreHorizontal, Pencil, Trash2, BrainCircuit, LoaderCircle, AlertTriangle } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface LeadsTableProps {
  data: Lead[];
  onRowClick: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
}

const statusColors: Record<LeadStatus, string> = {
    new: 'bg-blue-100 text-blue-800 border-blue-200',
    contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    qualified: 'bg-green-100 text-green-800 border-green-200',
    quoted: 'bg-purple-100 text-purple-800 border-purple-200',
    converted: 'bg-teal-100 text-teal-800 border-teal-200',
    lost: 'bg-gray-100 text-gray-800 border-gray-200'
};

const priorityColors: Record<LeadPriority, string> = {
    hot: 'bg-red-100 text-red-700 border-red-200',
    warm: 'bg-amber-100 text-amber-700 border-amber-200',
    cold: 'bg-sky-100 text-sky-700 border-sky-200',
};


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


export function LeadsTable({ data, onRowClick, onDelete }: LeadsTableProps) {
  if (data.length === 0) {
    return <p className="text-stone-500">No leads match the current filter.</p>;
  }

  const toDate = (timestamp: any): Date => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Full Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((lead) => (
            <TableRow key={lead.id} onClick={() => onRowClick(lead)} className="cursor-pointer group">
              <TableCell>
                 <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-900">{lead.fullName}</span>
                  {lead.aiStandardization?.status === 'processing' && <Tooltip><TooltipTrigger><LoaderCircle className="h-4 w-4 text-stone-400 animate-spin" /></TooltipTrigger><TooltipContent>AI standardization is in progress...</TooltipContent></Tooltip>}
                  {lead.aiStandardization?.status === 'completed' && <Tooltip><TooltipTrigger><BrainCircuit className="h-4 w-4 text-green-600" /></TooltipTrigger><TooltipContent>This lead was enhanced by AI.</TooltipContent></Tooltip>}
                  {lead.aiStandardization?.status === 'failed' && <Tooltip><TooltipTrigger><AlertTriangle className="h-4 w-4 text-red-600" /></TooltipTrigger><TooltipContent>AI standardization failed: {lead.aiStandardization.reason}</TooltipContent></Tooltip>}
                </div>
              </TableCell>
              <TableCell>{lead.companyName}</TableCell>
               <TableCell>
                {lead.priority ? (
                    <Badge variant="outline" className={cn("capitalize", priorityColors[lead.priority])}>
                        {lead.priority}
                    </Badge>
                ) : <span className="text-stone-400">-</span>}
              </TableCell>
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
              <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-lg hover:bg-stone-100" disabled>
                        <Pencil className="h-4 w-4 text-stone-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50" onClick={() => onDelete(lead.id!)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TooltipProvider>
    </div>
  );
}

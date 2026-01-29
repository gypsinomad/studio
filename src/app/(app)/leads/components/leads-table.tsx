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
import type { Lead, LeadStatus } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadsTableProps {
  data: Lead[];
}

const statusColors: Record<LeadStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-green-100 text-green-800',
    quoted: 'bg-purple-100 text-purple-800',
    converted: 'bg-teal-100 text-teal-800',
    lost: 'bg-gray-100 text-gray-800'
}

export function LeadsTable({ data }: LeadsTableProps) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">You have no leads assigned to you.</p>;
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
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.fullName}</TableCell>
              <TableCell>{lead.companyName}</TableCell>
              <TableCell>{lead.productInterest}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize", statusColors[lead.status])}>
                    {lead.status}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(lead.createdAt), 'PP')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

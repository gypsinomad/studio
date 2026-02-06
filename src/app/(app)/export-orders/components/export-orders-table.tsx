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
import type { ExportOrder, ExportOrderStage } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ExportOrdersTableProps {
  data: ExportOrder[];
}

const stageColors: Record<string, string> = {
    enquiry: 'bg-gray-200 text-gray-800',
    proformaIssued: 'bg-blue-100 text-blue-800',
    advanceReceived: 'bg-yellow-100 text-yellow-800',
    production: 'bg-purple-100 text-purple-800',
    exportDocumentation: 'bg-indigo-100 text-indigo-800',
    readyToShip: 'bg-orange-100 text-orange-800',
    shipped: 'bg-teal-100 text-teal-800',
    closed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    lostNoResponse: 'bg-gray-400 text-white',
};

const stageLabels: Record<ExportOrderStage, string> = {
    enquiry: "Enquiry",
    proformaIssued: "Quotation Sent",
    advanceReceived: "Order Confirmed",
    production: "Production",
    exportDocumentation: "Documentation",
    readyToShip: "Ready to Ship",
    shipped: "Shipped",
    closed: "Closed",
    cancelled: "Cancelled",
    lostNoResponse: "Lost",
};


export function ExportOrdersTable({ data }: ExportOrdersTableProps) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">You have no export orders assigned to you.</p>;
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
            <TableHead>Title</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Value (USD)</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.title}</TableCell>
              <TableCell>{order.destinationCountry}</TableCell>
              <TableCell>${order.totalValue.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize", stageColors[order.stage])}>
                    {stageLabels[order.stage as ExportOrderStage] || order.stage}
                </Badge>
              </TableCell>
              <TableCell>{format(toDate(order.createdAt), 'PP')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

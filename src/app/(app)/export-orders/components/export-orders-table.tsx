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

const stageColors: Record<ExportOrderStage, string> = {
    leadReceived: 'bg-gray-200 text-gray-800',
    quotationSent: 'bg-blue-100 text-blue-800',
    orderConfirmed: 'bg-yellow-100 text-yellow-800',
    exportDocumentation: 'bg-purple-100 text-purple-800',
    shipmentReady: 'bg-orange-100 text-orange-800',
    shippedDelivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    lostNoResponse: 'bg-gray-100 text-gray-500'
};

const stageLabels: Record<ExportOrderStage, string> = {
    leadReceived: "Lead",
    quotationSent: "Quoted",
    orderConfirmed: "Confirmed",
    exportDocumentation: "Docs",
    shipmentReady: "Ready",
    shippedDelivered: "Shipped",
    cancelled: "Cancelled",
    lostNoResponse: "Lost"
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
                    {stageLabels[order.stage]}
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

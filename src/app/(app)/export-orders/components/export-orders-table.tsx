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
import type { ExportOrder, ExportOrderStage } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';


interface ExportOrdersTableProps {
  data: ExportOrder[];
  onDelete: (orderId: string) => void;
  onEdit: (orderId: string) => void;
}

const stageColors: Record<string, string> = {
    leadReceived: 'bg-blue-100 text-blue-800',
    quotationSent: 'bg-cyan-100 text-cyan-800',
    orderConfirmed: 'bg-yellow-100 text-yellow-800',
    exportDocumentation: 'bg-purple-100 text-purple-800',
    shipmentReady: 'bg-orange-100 text-orange-800',
    shippedDelivered: 'bg-teal-100 text-teal-800',
    cancelled: 'bg-red-100 text-red-800',
    lostNoResponse: 'bg-gray-400 text-white',
    // Legacy support
    enquiry: 'bg-gray-200 text-gray-800',
    proformaIssued: 'bg-cyan-100 text-cyan-800',
    advanceReceived: 'bg-yellow-100 text-yellow-800',
    production: 'bg-indigo-100 text-indigo-800',
    readyToShip: 'bg-orange-100 text-orange-800',
    shipped: 'bg-teal-100 text-teal-800',
    closed: 'bg-green-100 text-green-800',
};

const stageLabels: Record<string, string> = {
    leadReceived: 'Lead Received',
    quotationSent: 'Quotation Sent',
    orderConfirmed: 'Order Confirmed',
    exportDocumentation: 'Documentation',
    shipmentReady: 'Shipment Ready',
    shippedDelivered: 'Shipped & Delivered',
    cancelled: 'Cancelled',
    lostNoResponse: 'Lost',
     // Legacy support
    enquiry: "Enquiry",
    proformaIssued: "Quotation Sent",
    advanceReceived: "Order Confirmed",
    production: "Production",
    readyToShip: "Shipment Ready",
    shipped: "Shipped & Delivered",
    closed: "Closed",
};


export function ExportOrdersTable({ data, onDelete, onEdit }: ExportOrdersTableProps) {
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
            <TableHead className="w-[50px]"></TableHead>
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
                    {stageLabels[order.stage] || order.stage}
                </Badge>
              </TableCell>
              <TableCell>{format(toDate(order.createdAt), 'PP')}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(order.id!)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => onDelete(order.id!)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

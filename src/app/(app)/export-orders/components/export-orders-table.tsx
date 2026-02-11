'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ExportOrder, IceGateStatusUpdate } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';


interface ExportOrdersTableProps {
  data: ExportOrder[];
  onDelete: (orderId: string) => void;
  onEdit: (orderId: string) => void;
}

const stageColors: Record<string, string> = {
    leadReceived: 'bg-blue-50 text-blue-700 border-blue-200',
    quotationSent: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    orderConfirmed: 'bg-amber-50 text-amber-700 border-amber-200',
    exportDocumentation: 'bg-purple-50 text-purple-700 border-purple-200',
    shipmentReady: 'bg-orange-50 text-orange-700 border-orange-200',
    shippedDelivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    lostNoResponse: 'bg-stone-100 text-stone-600 border-stone-200',
};

const iceGateStatusColors: Record<IceGateStatusUpdate, string> = {
  'Not Started': 'bg-stone-100 text-stone-600 border-stone-200',
  'Submitted': 'bg-blue-50 text-blue-700 border-blue-200',
  'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
  'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Query Raised': 'bg-orange-50 text-orange-700 border-orange-200',
  'Rejected': 'bg-red-50 text-red-700 border-red-200',
  'Clearance Completed': 'bg-teal-50 text-teal-700 border-teal-200',
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
};


export function ExportOrdersTable({ data, onDelete, onEdit }: ExportOrdersTableProps) {
  if (data.length === 0) {
    return <p className="text-stone-500">You have no export orders assigned to you.</p>;
  }

  const toDate = (timestamp: any): Date => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>ICEGATE Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((order) => (
            <TableRow key={order.id} className="group">
              <TableCell className="font-medium text-stone-900">{order.title}</TableCell>
              <TableCell>{order.destinationCountry}</TableCell>
              <TableCell>{order.currency || 'USD'} {order.totalValue.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize", stageColors[order.stage])}>
                    {stageLabels[order.stage] || order.stage}
                </Badge>
              </TableCell>
              <TableCell>
                {order.iceGateStatus ? (
                  <Badge variant="outline" className={cn("capitalize", iceGateStatusColors[order.iceGateStatus])}>
                      {order.iceGateStatus}
                  </Badge>
                ) : <span className="text-stone-400">N/A</span>}
              </TableCell>
              <TableCell>{format(toDate(order.createdAt), 'PP')}</TableCell>
              <TableCell className="text-right">
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-lg hover:bg-stone-100" onClick={() => onEdit(order.id!)}>
                        <Pencil className="h-4 w-4 text-stone-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50" onClick={() => onDelete(order.id!)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

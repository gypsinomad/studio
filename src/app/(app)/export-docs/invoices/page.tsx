'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Filter, FileText, Download, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const invoices = [
  { id: "CI-2026-0012", type: "Commercial", buyer: "Gulf Foods LLC (UAE)", currency: "USD", amount: 12500, status: "Confirmed", date: "2026-02-10" },
  { id: "PI-2026-0011", type: "Proforma", buyer: "London Spice Co (UK)", currency: "GBP", amount: 8200, status: "Draft", date: "2026-02-09" },
  { id: "CI-2026-0010", type: "Commercial", buyer: "Nairobi Traders (Kenya)", currency: "USD", amount: 5800, status: "Confirmed", date: "2026-02-08" },
  { id: "SI-2026-0009", type: "Sample", buyer: "Gulf Foods LLC (UAE)", currency: "USD", amount: 350, status: "Confirmed", date: "2026-02-05" },
];

export default function ExportInvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Invoices & Docs" description="Generate and track export invoices, packing lists, and certificates.">
        <Button asChild><Link href="/export-docs/invoices/new"><PlusCircle className="mr-2 size-4" /> Create Invoice</Link></Button>
      </PageHeader>

      <div className="flex items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="flex gap-2 flex-1">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoice or buyer..." className="pl-8 bg-white" />
          </div>
          <Button variant="outline" className="bg-white"><Filter className="mr-2 size-4" /> Filters</Button>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-white cursor-pointer hover:bg-muted">All Types</Badge>
          <Badge variant="outline" className="bg-white cursor-pointer hover:bg-muted">Confirmed Only</Badge>
        </div>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-bold text-primary">{inv.id}</TableCell>
                <TableCell><Badge variant="secondary">{inv.type}</Badge></TableCell>
                <TableCell>{inv.buyer}</TableCell>
                <TableCell>{inv.currency}</TableCell>
                <TableCell className="font-medium">{inv.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={inv.status === 'Confirmed' ? 'default' : 'outline'} className={inv.status === 'Confirmed' ? 'bg-emerald-600' : ''}>
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell>{inv.date}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Download PDF"><Download className="size-4" /></Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Detail</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Cancel Invoice</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
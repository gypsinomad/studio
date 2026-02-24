'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calculator, FileText, Box, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const stats = [
  { title: "Total Export Value (MTD)", value: "$142,500", icon: FileText, description: "Active commercial invoices" },
  { title: "Active Invoices", value: "12", icon: FileText, description: "Awaiting confirm or shipping" },
  { title: "Pending Payments", value: "8", icon: ArrowRight, description: "Receivables outstanding" },
  { title: "Items in Register", value: "154", icon: Box, description: "Master SKU count" },
];

const recentInvoices = [
  { id: "CI-2026-0012", buyer: "Gulf Foods LLC", currency: "USD", amount: 12500, status: "Confirmed", date: "2026-02-10" },
  { id: "PI-2026-0011", buyer: "London Spice Co", currency: "GBP", amount: 8200, status: "Draft", date: "2026-02-09" },
  { id: "CI-2026-0010", buyer: "Nairobi Traders", currency: "USD", amount: 5800, status: "Confirmed", date: "2026-02-08" },
];

const pendingPayments = [
  { id: "CI-2026-0008", buyer: "Apex Imports", amount: 4200, due: "2026-02-01", overdue: true },
  { id: "CI-2026-0005", buyer: "Gulf Foods LLC", amount: 9000, due: "2026-02-15", overdue: false },
];

export default function ExportDocsOverview() {
  return (
    <div className="space-y-6">
      <PageHeader title="Export Documentation" description="Manage items, analyze containers, and generate shipping docs.">
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/export-docs/analyzer"><Calculator className="mr-2 size-4" /> Open Analyzer</Link></Button>
          <Button variant="outline" asChild><Link href="/export-docs/items/new"><PlusCircle className="mr-2 size-4" /> Add Item</Link></Button>
          <Button asChild><Link href="/export-docs/invoices/new"><PlusCircle className="mr-2 size-4" /> New Invoice</Link></Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.title}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Export Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.id}</TableCell>
                    <TableCell>{inv.buyer}</TableCell>
                    <TableCell>{inv.currency} {inv.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === 'Confirmed' ? 'default' : 'secondary'}>{inv.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="link" className="w-full mt-4" asChild><Link href="/export-docs/invoices">View All Invoices</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.id}</TableCell>
                    <TableCell>{p.buyer}</TableCell>
                    <TableCell>${p.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={p.overdue ? "text-destructive font-bold" : ""}>{p.due}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="link" className="w-full mt-4" asChild><Link href="/export-docs/payments">Manage Payments</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calculator, FileText, Box, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const stats = [
  { title: "Total Export Value (MTD)", value: "$142,500", icon: TrendingUp, description: "+12% from last month", color: "text-emerald-600" },
  { title: "Active Invoices", value: "12", icon: FileText, description: "4 awaiting confirmation", color: "text-blue-600" },
  { title: "Pending Payments", value: "8", icon: ArrowRight, description: "3 are overdue", color: "text-amber-600" },
  { title: "Items in Register", value: "154", icon: Box, description: "12 added this week", color: "text-stone-600" },
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
    <div className="space-y-8">
      <PageHeader title="Export Documentation" description="Manage items, analyze containers, and generate shipping docs.">
        <div className="flex gap-3">
          <Button variant="outline" asChild><Link href="/export-docs/analyzer"><Calculator className="mr-2 size-4" /> Open Analyzer</Link></Button>
          <Button variant="outline" asChild><Link href="/export-docs/items/new"><PlusCircle className="mr-2 size-4" /> Add Item</Link></Button>
          <Button variant="emerald" asChild><Link href="/export-docs/invoices/new"><PlusCircle className="mr-2 size-4" /> New Invoice</Link></Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title} className="group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">{s.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-stone-50 group-hover:bg-white group-hover:shadow-sm transition-all ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-headline font-bold text-stone-900 mt-1">{s.value}</div>
              <p className="text-xs text-stone-500 mt-2 font-medium flex items-center">
                {s.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-lg border-stone-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Export Invoices</CardTitle>
              <CardDescription>Latest generated shipping documents</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/export-docs/invoices">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Invoice #</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((inv) => (
                  <TableRow key={inv.id} className="group cursor-pointer">
                    <TableCell className="pl-6 font-bold text-spice-600">{inv.id}</TableCell>
                    <TableCell className="font-medium">{inv.buyer}</TableCell>
                    <TableCell className="font-semibold">{inv.currency} {inv.amount.toLocaleString()}</TableCell>
                    <TableCell className="pr-6">
                      <Badge variant={inv.status === 'Confirmed' ? 'emerald' : 'secondary'} className={inv.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-stone-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Accounts receivable for export orders</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/export-docs/payments">Manage <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Invoice #</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="pr-6">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((p) => (
                  <TableRow key={p.id} className="group cursor-pointer">
                    <TableCell className="pl-6 font-bold text-spice-600">{p.id}</TableCell>
                    <TableCell className="font-medium">{p.buyer}</TableCell>
                    <TableCell className="font-semibold">${p.amount.toLocaleString()}</TableCell>
                    <TableCell className="pr-6">
                      <span className={p.overdue ? "text-red-600 font-bold px-2 py-1 bg-red-50 rounded-md text-xs" : "text-stone-500 text-xs font-medium"}>
                        {p.due}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
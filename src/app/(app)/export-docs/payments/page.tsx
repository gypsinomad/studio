'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Filter, CreditCard, ArrowUpRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const mockPayments = [
  { id: "PAY-001", invoiceNo: "CI-2026-0012", buyer: "Gulf Foods LLC", amount: 12500, currency: "USD", method: "TT", date: "2026-02-12", status: "Paid" },
  { id: "PAY-002", invoiceNo: "CI-2026-0010", buyer: "Nairobi Traders", amount: 5800, currency: "USD", method: "LC", date: "2026-02-11", status: "Paid" },
  { id: "PAY-003", invoiceNo: "CI-2026-0008", buyer: "Apex Imports", amount: 4200, currency: "USD", method: "DP", date: "2026-02-01", status: "Overdue" },
  { id: "PAY-004", invoiceNo: "PI-2026-0011", buyer: "London Spice Co", amount: 8200, currency: "GBP", method: "Pending", date: "2026-02-15", status: "Pending" },
];

export default function ExportPaymentsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Export Payments" description="Track receivables, advance payments, and LC realizations.">
        <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 shadow-lg">
          <PlusCircle className="mr-2 size-4" /> Record Payment
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-emerald-600 text-white border-none shadow-emerald-100 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider opacity-80">Total Realized (MTD)</CardTitle>
            <CheckCircle2 className="size-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-bold">$18,300</div>
            <p className="text-xs mt-2 opacity-80 font-medium">92% of expected revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-stone-200 shadow-stone-200/50 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-stone-500">Pending Realization</CardTitle>
            <Clock className="size-4 text-spice-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-bold text-stone-900">$12,400</div>
            <p className="text-xs mt-2 text-stone-500 font-medium">4 invoices awaiting TT/LC</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100 shadow-red-100/50 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-600">Overdue Payments</CardTitle>
            <AlertCircle className="size-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-bold text-red-700">$4,200</div>
            <p className="text-xs mt-2 text-red-600 font-medium font-bold">1 major account overdue</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex gap-2 flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
            <Input placeholder="Search invoice or buyer..." className="pl-10 h-10 border-stone-100 bg-stone-50/50 focus:bg-white transition-colors" />
          </div>
          <Button variant="outline" className="border-stone-200"><Filter className="mr-2 size-4" /> Filters</Button>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-stone-200/50 rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50/50 hover:bg-transparent">
                <TableHead className="pl-6">Invoice No</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Due/Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPayments.map((p) => (
                <TableRow key={p.id} className="group cursor-pointer">
                  <TableCell className="pl-6 font-bold text-spice-600">{p.invoiceNo}</TableCell>
                  <TableCell className="font-medium text-stone-900">{p.buyer}</TableCell>
                  <TableCell className="font-bold">
                    {p.currency} {p.amount.toLocaleString()}
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="bg-stone-100 text-stone-700 border-none">{p.method}</Badge></TableCell>
                  <TableCell className="text-sm text-stone-500 font-medium">{p.date}</TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        p.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      View <ArrowUpRight className="ml-1 size-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
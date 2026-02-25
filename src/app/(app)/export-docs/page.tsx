
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calculator, FileText, Box, ArrowRight, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import type { ExportOrder } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const stats = [
  { title: "Total Export Value (MTD)", value: "$142,500", icon: TrendingUp, description: "+12% from last month", color: "text-spice-600" },
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

function MissingCriticalDocs() {
    const firestore = useFirestore();
    const q = useMemoFirebase(() => {
        if (!firestore) return null;
        // List orders in Shipment Ready stage that might be missing docs
        return query(
            collection(firestore, 'exportOrders'), 
            where('stage', '==', 'shipmentReady'),
            limit(5)
        );
    }, [firestore]);

    const { data: orders, isLoading } = useCollection<ExportOrder>(q);

    return (
        <Card className="shadow-lg border-stone-100 overflow-hidden">
            <CardHeader className="bg-amber-50/50 border-b border-amber-100">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div>
                        <CardTitle className="text-lg">Critical Document Alerts</CardTitle>
                        <CardDescription>Orders ready for shipment with pending compliance docs</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-6 space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : !orders || orders.length === 0 ? (
                    <div className="p-12 text-center text-stone-400 font-medium">
                        All shipment-ready orders have documents in order.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-stone-50/50">
                                <TableHead className="pl-6">Order Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="pr-6 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map(order => {
                                const missingCount = (order.docsTotal || 8) - (order.docsCompleted || 0);
                                return (
                                    <TableRow key={order.id} className="group">
                                        <TableCell className="pl-6">
                                            <p className="font-bold text-stone-900">{order.title}</p>
                                            <p className="text-[10px] text-stone-500 uppercase font-bold">{order.destinationCountry}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-100 rounded-lg">
                                                {missingCount} Docs Pending
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <Button variant="ghost" size="sm" asChild className="text-spice-600 hover:text-spice-700 hover:bg-spice-50 rounded-lg">
                                                <Link href={`/export-orders/${order.id}/edit`}>
                                                    Review <ExternalLink className="ml-2 h-3 w-3" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

export default function ExportDocsOverview() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader title="Export Documentation" description="Manage items, analyze containers, and generate shipping docs.">
        <div className="flex gap-3">
          <Button variant="outline" asChild className="rounded-xl"><Link href="/export-docs/analyzer"><Calculator className="mr-2 size-4" /> Open Analyzer</Link></Button>
          <Button variant="outline" asChild className="rounded-xl"><Link href="/export-docs/items/new"><PlusCircle className="mr-2 size-4" /> Add Item</Link></Button>
          <Button asChild className="rounded-xl bg-spice-600 hover:bg-spice-700"><Link href="/export-docs/invoices/new"><PlusCircle className="mr-2 size-4" /> New Invoice</Link></Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title} className="group relative overflow-hidden rounded-2xl transition-all hover:shadow-xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-spice-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-stone-500">{s.title}</CardTitle>
              <div className={`p-2.5 rounded-xl bg-stone-50 group-hover:bg-white group-hover:shadow-md transition-all ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-headline font-bold text-stone-900 mt-1">{s.value}</div>
              <p className="text-[11px] text-stone-500 mt-2 font-bold uppercase tracking-wider flex items-center">
                {s.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg border-stone-100 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                <CardTitle>Recent Export Invoices</CardTitle>
                <CardDescription>Latest generated shipping documents</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="rounded-lg text-spice-600 hover:bg-spice-50">
                <Link href="/export-docs/invoices">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow className="bg-stone-50/50 hover:bg-transparent">
                    <TableHead className="pl-6">Invoice #</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentInvoices.map((inv) => (
                    <TableRow key={inv.id} className="group cursor-pointer hover:bg-stone-50/50 transition-colors">
                        <TableCell className="pl-6 font-bold text-spice-600">{inv.id}</TableCell>
                        <TableCell className="font-semibold text-stone-900">{inv.buyer}</TableCell>
                        <TableCell className="font-bold text-stone-700">{inv.currency} {inv.amount.toLocaleString()}</TableCell>
                        <TableCell className="pr-6">
                        <Badge variant="outline" className={inv.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1 rounded-lg' : 'font-bold'}>
                            {inv.status}
                        </Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>

            <Card className="shadow-lg border-stone-100 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                <CardTitle>Pending Payments</CardTitle>
                <CardDescription>Accounts receivable for export orders</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="rounded-lg text-spice-600 hover:bg-spice-50">
                <Link href="/export-docs/payments">Manage <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow className="bg-stone-50/50 hover:bg-transparent">
                    <TableHead className="pl-6">Invoice #</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="pr-6">Due Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingPayments.map((p) => (
                    <TableRow key={p.id} className="group cursor-pointer hover:bg-stone-50/50 transition-colors">
                        <TableCell className="pl-6 font-bold text-spice-600">{p.id}</TableCell>
                        <TableCell className="font-semibold text-stone-900">{p.buyer}</TableCell>
                        <TableCell className="font-bold text-stone-700">${p.amount.toLocaleString()}</TableCell>
                        <TableCell className="pr-6">
                        <span className={p.overdue ? "text-red-600 font-bold px-2 py-1 bg-red-50 border border-red-100 rounded-lg text-[10px] uppercase" : "text-stone-500 text-[10px] font-bold uppercase"}>
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

        <div className="space-y-8">
            <MissingCriticalDocs />
            
            <Card className="bg-gradient-to-br from-spice-600 to-spice-800 text-white rounded-2xl shadow-xl border-none p-1">
                <div className="bg-spice-900/20 p-6 rounded-[calc(1rem-4px)] h-full flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-headline font-bold">Documentation Assistant</h3>
                        <p className="text-spice-100 text-sm mt-2 font-medium">Use the AI analyzer to estimate container loads and automatically fill export document attributes.</p>
                    </div>
                    <Button variant="secondary" asChild className="mt-6 w-full bg-white text-spice-900 hover:bg-spice-50 font-bold rounded-xl h-12 shadow-lg">
                        <Link href="/export-docs/analyzer">Start Analysis</Link>
                    </Button>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}

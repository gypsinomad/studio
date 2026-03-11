'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calculator, FileText, Box, ArrowRight, TrendingUp, AlertCircle, ExternalLink, Eye, FileCheck } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import type { ExportOrder, Document as DocumentType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const pendingPayments = [
  { id: "CI-2026-0008", buyer: "Apex Imports", amount: 4200, due: "2026-02-01", overdue: true },
  { id: "CI-2026-0005", buyer: "Gulf Foods LLC", amount: 9000, due: "2026-02-15", overdue: false },
];

function RecentInvoices() {
    const firestore = useFirestore();
    const INVOICE_TYPES = ["proformaInvoice", "commercialInvoice", "shippingBill", "billOfLading", "packingList"];
    
    const q = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'documents'),
            where('type', 'in', INVOICE_TYPES),
            orderBy('uploadedAt', 'desc'),
            limit(5)
        );
    }, [firestore]);

    const { data: documents, isLoading } = useCollection<DocumentType>(q);

    const toDate = (timestamp: any): Date => {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
        }
        return new Date(timestamp);
    }

    return (
        <Card className="shadow-lg border-slate-100 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Export Documents</CardTitle>
                    <CardDescription>Latest confirmed shipping documents</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="rounded-lg text-primary hover:bg-primary/5">
                    <Link href="/export-docs/invoices">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : !documents || documents.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-medium italic">
                        No real documents uploaded yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-transparent">
                                <TableHead className="pl-6">Document</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="pr-6 text-right">View</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-2">
                                          {doc.status === 'finalized' && <FileCheck className="h-3 w-3 text-emerald-600" />}
                                          <div>
                                            <p className="font-bold text-slate-900 truncate max-w-[200px]">{doc.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{format(toDate(doc.uploadedAt), 'PP')}</p>
                                          </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-white text-slate-600 text-[10px] font-bold">
                                            {doc.type.replace(/([A-Z])/g, ' $1').trim()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary rounded-lg" onClick={() => window.open(doc.fileUrl, '_blank')}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

function MissingCriticalDocs() {
    const firestore = useFirestore();
    const q = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'exportOrders'), 
            where('stage', '==', 'shipmentReady'),
            limit(5)
        );
    }, [firestore]);

    const { data: orders, isLoading } = useCollection<ExportOrder>(q);

    return (
        <Card interactive className="border-accent/20 bg-accent/5 overflow-hidden ring-1 ring-accent/10">
            <CardHeader className="bg-accent/10 border-b border-accent/10">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-accent" />
                    <div>
                        <CardTitle className="text-lg text-slate-900">Critical Document Alerts</CardTitle>
                        <CardDescription className="text-slate-600">Orders ready for shipment with pending compliance docs</CardDescription>
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
                    <div className="p-12 text-center text-slate-400 font-medium">
                        All shipment-ready orders have documents in order.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-transparent">
                                <TableHead className="pl-6">Order Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="pr-6 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map(order => {
                                const missingCount = (order.docsTotal || 8) - (order.docsCompleted || 0);
                                return (
                                    <TableRow key={order.id} className="group hover:bg-white/50">
                                        <TableCell className="pl-6">
                                            <p className="font-bold text-slate-900">{order.title}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{order.destinationCountry}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-100 rounded-lg">
                                                {missingCount} Docs Pending
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/10 rounded-lg">
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
  const firestore = useFirestore();
  
  // Fetch real item count
  const itemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'items'),
      limit(1000)
    );
  }, [firestore]);

  const { data: items, isLoading: itemsLoading } = useCollection(itemsQuery);
  
  const stats = [
    { title: "Total Export Value (MTD)", value: "$142,500", icon: TrendingUp, description: "+12% from last month", color: "text-primary" },
    { title: "Active Invoices", value: "12", icon: FileText, description: "4 awaiting confirmation", color: "text-blue-600" },
    { title: "Pending Payments", value: "8", icon: ArrowRight, description: "3 are overdue", color: "text-accent" },
    { title: "Items in Register", value: itemsLoading ? "..." : (items?.length || 0).toString(), icon: Box, description: itemsLoading ? "Loading..." : `${items?.length || 0} total items`, color: "text-slate-600" },
  ];

  return (
    <div className="space-y-10">
      <PageHeader title="Export Documentation" description="Manage items, analyze containers, and generate shipping docs with high-precision tools.">
        <div className="flex gap-3">
          <Button variant="outline" asChild className="rounded-xl"><Link href="/export-docs/analyzer"><Calculator className="mr-2 size-4" /> Open Analyzer</Link></Button>
          <Button variant="outline" asChild className="rounded-xl"><Link href="/export-docs/items/new"><PlusCircle className="mr-2 size-4" /> Add Item</Link></Button>
          <Button variant="accent" asChild className="rounded-xl"><Link href="/export-orders"><PlusCircle className="mr-2 size-4" /> New Inquiry</Link></Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title} interactive className="group relative overflow-hidden rounded-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">{s.title}</CardTitle>
              <div className={cn("p-2.5 rounded-xl bg-slate-50 group-hover:scale-110 transition-all duration-300 shadow-sm", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mt-1">{s.value}</div>
              <p className="text-[11px] text-slate-500 mt-2 font-bold uppercase tracking-wider">
                {s.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <RecentInvoices />

            <Card className="shadow-lg border-slate-100 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                <CardTitle>Pending Payments</CardTitle>
                <CardDescription>Accounts receivable for export orders</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="rounded-lg text-primary hover:bg-primary/5">
                <Link href="/export-docs/payments">Manage <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-transparent">
                    <TableHead className="pl-6">Invoice #</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="pr-6">Due Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingPayments.map((p) => (
                    <TableRow key={p.id} className="group cursor-pointer hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-6 font-bold text-primary">{p.id}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{p.buyer}</TableCell>
                        <TableCell className="font-bold text-slate-700">${p.amount.toLocaleString()}</TableCell>
                        <TableCell className="pr-6">
                        <span className={p.overdue ? "text-red-600 font-bold px-2 py-1 bg-red-50 border border-red-100 rounded-lg text-[10px] uppercase" : "text-slate-500 text-[10px] font-bold uppercase"}>
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
            
            <Card interactive className="bg-gradient-to-br from-primary to-primary/80 text-white border-none shadow-xl shadow-primary/20">
                <CardContent className="p-8 h-full flex flex-col justify-between space-y-6">
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">Documentation Assistant</h3>
                        <p className="text-white/80 text-sm mt-3 font-medium leading-relaxed">Leverage high-precision tools to estimate container loads and automate export documentation.</p>
                    </div>
                    <Button variant="secondary" asChild className="w-full bg-white text-primary hover:bg-slate-50 font-bold rounded-xl h-12 shadow-lg transition-transform active:scale-95">
                        <Link href="/export-docs/analyzer">Start Analysis</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
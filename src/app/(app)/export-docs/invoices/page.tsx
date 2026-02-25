'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Filter, FileText, Download, Eye, FileCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import type { Document as DocumentType } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const INVOICE_TYPES = ["proformaInvoice", "commercialInvoice", "shippingBill", "billOfLading", "packingList", "contract", "coo", "phytoCertificate"];

export default function ExportInvoicesPage() {
  const firestore = useFirestore();

  // Fetch real documents from Firestore filtered by invoice and shipping related types
  const docsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'documents'),
      where('type', 'in', INVOICE_TYPES),
      orderBy('uploadedAt', 'desc'),
      limit(100)
    );
  }, [firestore]);

  const { data: documents, isLoading } = useCollection<DocumentType>(docsQuery);

  const toDate = (timestamp: any): Date => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  const handleViewPdf = (url: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices & Docs" description="Access all confirmed export invoices, packing lists, and certificates.">
        <Button asChild className="rounded-xl"><Link href="/export-orders"><PlusCircle className="mr-2 size-4" /> Go to Orders</Link></Button>
      </PageHeader>

      <div className="flex items-center justify-between gap-4 bg-white/50 p-4 rounded-2xl border border-stone-200/60 shadow-sm backdrop-blur-sm">
        <div className="flex gap-2 flex-1">
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
            <Input placeholder="Search documents..." className="pl-10 bg-white/80 h-10 border-stone-200 rounded-xl" />
          </div>
          <Button variant="outline" className="bg-white rounded-xl h-10"><Filter className="mr-2 size-4" /> Filters</Button>
        </div>
      </div>

      <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50/50">
              <TableHead className="pl-6">Document Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confirmed At</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !documents || documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-stone-400 font-medium">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 opacity-20" />
                    <p>No confirmed documents found.</p>
                    <p className="text-xs font-normal text-muted-foreground">Upload and finalize documents in an Export Order to see them here.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id} className="group hover:bg-stone-50/50 transition-colors">
                  <TableCell className="pl-6 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          doc.status === 'finalized' ? "bg-emerald-50 text-emerald-600" : "bg-primary/5 text-primary"
                        )}>
                            {doc.status === 'finalized' ? <FileCheck className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <span 
                          className="truncate max-w-[250px] hover:underline cursor-pointer" 
                          onClick={() => handleViewPdf(doc.fileUrl)}
                        >
                          {doc.name}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-stone-100 text-stone-600 border-none capitalize text-[10px] font-bold">
                        {doc.type.replace(/([A-Z])/g, ' $1').trim()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "px-2 rounded-lg capitalize text-[10px]",
                        doc.status === 'finalized' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-sky-50 text-sky-700 border-sky-100'
                      )}
                    >
                      {doc.status === 'finalized' ? 'Confirmed' : doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-stone-500 text-[11px] font-semibold">
                    {format(toDate(doc.uploadedAt), 'PPp')}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="icon" title="View PDF" onClick={() => handleViewPdf(doc.fileUrl)} className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg">
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download" onClick={() => handleViewPdf(doc.fileUrl)} className="h-8 w-8 rounded-lg">
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
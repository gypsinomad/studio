'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Document as DocumentType } from '@/lib/types';
import { format } from 'date-fns';
import { useCurrentCompany } from '@/hooks/use-current-company';

function DocumentsTable({ data }: { data: DocumentType[] }) {
   if (data.length === 0) {
    return <p className="text-muted-foreground">You have not uploaded any documents.</p>;
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
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uploaded At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium hover:underline">
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">{doc.name}</a>
              </TableCell>
              <TableCell className="capitalize">{doc.type}</TableCell>
              <TableCell className="capitalize">{doc.status}</TableCell>
              <TableCell>{format(toDate(doc.uploadedAt), 'PPp')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


export default function DocumentsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { companyId, isLoading: isCompanyLoading } = useCurrentCompany();

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !companyId) return null;
    return query(
      collection(firestore, 'companies', companyId, 'documents'), 
      where('uploadedBy', '==', user.uid)
    );
  }, [firestore, user, companyId]);

  const { data: documents, isLoading: areDocumentsLoading } = useCollection(documentsQuery);

  const isLoading = isCompanyLoading || areDocumentsLoading;

  return (
    <>
      <PageHeader
        title="Documents"
        description="Manage all documents related to your leads and orders."
      >
        <Button>
          <Upload className="mr-2" />
          Upload Document
        </Button>
      </PageHeader>

      {isLoading && (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && documents && <DocumentsTable data={documents} />}
    </>
  );
}

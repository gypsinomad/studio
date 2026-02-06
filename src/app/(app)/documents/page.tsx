'use client';
import { useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UploadDocumentForm } from './components/upload-document-form';

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
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { companyId, isLoading: isCompanyLoading } = useCurrentCompany();

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !companyId) return null;
    // For admins, show all docs in the company. For others, only their own.
    const docsCollection = collection(firestore, 'companies', companyId, 'documents');
    const userProfile = user; // Assuming useUser provides the profile
    if (userProfile?.role === 'admin') {
      return query(docsCollection);
    }
    return query(
      docsCollection,
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
        <Button onClick={() => setIsUploadOpen(true)} disabled={!companyId}>
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

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload a New Document</DialogTitle>
            <DialogDescription>
              The file will be stored securely and linked to your company.
            </DialogDescription>
          </DialogHeader>
          <UploadDocumentForm onSuccess={() => setIsUploadOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

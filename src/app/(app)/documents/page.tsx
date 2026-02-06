'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Upload, Info } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useCurrentUser } from '@/hooks/use-current-user';
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  const { user, userProfile, isAdmin, isAuthenticated, isLoading: isUserLoading } = useCurrentUser();
  const { companyId, companyIds, isLoading: isCompanyLoading } = useCurrentCompany();

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !companyId || !userProfile) return null;
    
    const docsCollection = collection(firestore, 'companies', companyId, 'documents');
    
    // Admins can see all documents in the company
    if (isAdmin) {
      return query(docsCollection);
    }
    // Other roles see only the documents they uploaded
    return query(
      docsCollection,
      where('uploadedBy', '==', user.uid)
    );
  }, [firestore, user, userProfile, companyId, isAdmin]);

  const { data: documents, isLoading: areDocumentsLoading } = useCollection(documentsQuery);

  const isLoading = isCompanyLoading || isUserLoading || areDocumentsLoading;
  const canCreate = !!companyId && isAuthenticated;

  return (
    <>
      <PageHeader
        title="Documents"
        description="Manage all documents related to your leads and orders."
      >
        <Button onClick={() => setIsUploadOpen(true)} disabled={!canCreate}>
          <Upload className="mr-2" />
          Upload Document
        </Button>
      </PageHeader>

       {!isLoading && companyIds.length === 0 && isAuthenticated && (
         <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Create a Company to Get Started</AlertTitle>
            <AlertDescription>
                You need to create or be added to a company before you can manage documents.
                Go to the <Link href="/companies" className="font-bold hover:underline">Companies page</Link> to create your first one.
            </AlertDescription>
         </Alert>
      )}

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

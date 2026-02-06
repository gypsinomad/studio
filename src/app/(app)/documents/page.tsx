'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { collection, query, where, orderBy } from 'firebase/firestore';
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
              <TableCell className="capitalize">{doc.type.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
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

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !userProfile) return null;
    
    const docsCollection = collection(firestore, 'documents');
    
    // Admins can see all documents
    if (isAdmin) {
      return query(docsCollection, orderBy('uploadedAt', 'desc'));
    }
    // Other roles see only the documents they uploaded
    return query(
      docsCollection,
      where('uploadedBy', '==', user.uid),
      orderBy('uploadedAt', 'desc')
    );
  }, [firestore, user, userProfile, isAdmin]);

  const { data: documents, isLoading: areDocumentsLoading } = useCollection(documentsQuery);

  const isLoading = isUserLoading || areDocumentsLoading;

  return (
    <>
      <PageHeader
        title="Documents"
        description="Manage all documents related to your leads and orders."
      >
        <Button onClick={() => setIsUploadOpen(true)} disabled={!isAuthenticated || isLoading}>
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

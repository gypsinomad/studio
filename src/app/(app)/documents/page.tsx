'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Upload, MoreHorizontal } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { collection, query, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Document as DocumentType } from '@/lib/types';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UploadDocumentForm } from './components/upload-document-form';
import { logActivity } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

function DocumentsTable({ data, onDelete }: { data: DocumentType[], onDelete: (docId: string) => void }) {
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
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((docItem) => (
            <TableRow key={docItem.id}>
              <TableCell className="font-medium hover:underline">
                <a href={docItem.fileUrl} target="_blank" rel="noopener noreferrer">{docItem.name}</a>
              </TableCell>
              <TableCell className="capitalize">{docItem.type.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
              <TableCell className="capitalize">{docItem.status}</TableCell>
              <TableCell>{format(toDate(docItem.uploadedAt), 'PPp')}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={() => onDelete(docItem.id!)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


export default function DocumentsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: isUserLoading } = useCurrentUser();

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'documents'), orderBy('uploadedAt', 'desc'));
  }, [firestore]);

  const { data: documents, isLoading: areDocumentsLoading } = useCollection<DocumentType>(documentsQuery);

  const isLoading = isUserLoading || areDocumentsLoading;

  const handleDeleteRequest = (docId: string) => {
    setSelectedDocId(docId);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocId || !firestore || !user) return;

    const docRef = doc(firestore, 'documents', selectedDocId);
    try {
      const beforeSnap = await getDoc(docRef);
      if (beforeSnap.exists()) {
        await logActivity(firestore, user, 'delete', 'documents', selectedDocId, beforeSnap.data(), null);
        await deleteDoc(docRef);
        toast({ title: 'Success', description: 'Document deleted.' });
      }
    } catch (error) {
      console.error("Failed to delete document: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete document.' });
    }
    
    setIsDeleteAlertOpen(false);
    setSelectedDocId(null);
  };

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

      {!isLoading && documents && <DocumentsTable data={documents} onDelete={handleDeleteRequest} />}

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

       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

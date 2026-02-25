'use client';
import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStorage } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { DocumentChecklistItem, DocumentChecklistStatus, Document as DocumentData } from '@/lib/types';
import { Upload, Link as LinkIcon, LoaderCircle, Eye, FileWarning, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DOCUMENT_TYPES } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';

interface DocumentChecklistProps {
  orderId: string;
}

const statusColors: Record<DocumentChecklistStatus, string> = {
  notStarted: 'bg-stone-100 text-stone-600 border-stone-200',
  inProgress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const getDocumentLabel = (type: string) => {
    const label = DOCUMENT_TYPES.find(t => t === type);
    if (!label) return type;
    return label.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}


export function DocumentChecklist({ orderId }: DocumentChecklistProps) {
  const { idToken, user } = useCurrentUser();
  const { toast } = useToast();
  const storage = useStorage();
  const firestore = useFirestore();

  const [checklist, setChecklist] = useState<DocumentChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const fetchChecklist = async () => {
    if (!idToken) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/export-orders/${orderId}/documents`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch checklist');
      const data = await response.json();
      setChecklist(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load document checklist.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, [idToken, orderId]);

  const updateChecklistItem = async (checklistItemId: string, payload: Partial<DocumentChecklistItem>) => {
    if (!idToken) return;
    try {
      const response = await fetch(`/api/export-orders/${orderId}/documents`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklistItemId, ...payload }),
      });
      if (!response.ok) throw new Error('Failed to update item');
      
      // Update local state for counts
      const updatedChecklist = checklist.map(item => 
        item.id === checklistItemId ? { ...item, ...payload } : item
      );
      setChecklist(updatedChecklist);

      // Update parent order summary counts
      if (firestore) {
        const completed = updatedChecklist.filter(i => i.status === 'completed').length;
        const total = updatedChecklist.length;
        updateDoc(doc(firestore, 'exportOrders', orderId), {
            docsCompleted: completed,
            docsTotal: total
        });
      }

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update checklist item.' });
    }
  };

  const handleStatusChange = (itemId: string, status: DocumentChecklistStatus) => {
    updateChecklistItem(itemId, { status });
  };

  const handleFinalizeDocument = async (item: DocumentChecklistItem) => {
    if (!item.fileRef || !firestore) return;
    
    try {
      // Update the document metadata to 'finalized'
      await updateDoc(doc(firestore, 'documents', item.fileRef), {
        status: 'finalized',
        finalizedAt: serverTimestamp(),
        finalizedBy: user?.uid
      });
      
      toast({ title: 'Document Confirmed', description: 'This document is now marked as finalized.' });
      fetchChecklist(); // Refresh to update UI
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not finalize document.' });
    }
  }
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, item: DocumentChecklistItem) => {
    const file = event.target.files?.[0];
    if (!file || !storage || !firestore || !user) return;
    
    setUploadingItemId(item.id!);
    setUploadProgress(0);
    
    try {
        const storagePath = `documents/${orderId}/${item.type}_${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            }, 
            (error) => {
                toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
                setUploadingItemId(null);
            }, 
            async () => {
                const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);

                // Create document metadata
                const docPayload: Omit<DocumentData, 'id'> = {
                    name: file.name,
                    type: item.type as DocumentData['type'],
                    fileUrl,
                    status: 'uploaded',
                    relatedOrderId: orderId,
                    uploadedBy: user.uid,
                    uploadedAt: serverTimestamp(),
                    fileSize: file.size,
                    mimeType: file.type,
                    storagePath: storagePath
                };
                const newDocRef = await addDoc(collection(firestore, 'documents'), docPayload);

                // Link to checklist
                await updateChecklistItem(item.id!, {
                    status: 'completed',
                    fileRef: newDocRef.id,
                    fileUrl: fileUrl,
                    fileSize: file.size,
                    mimeType: file.type
                });

                toast({ title: 'Success', description: `${getDocumentLabel(item.type)} uploaded.`});
                setUploadingItemId(null);
                setUploadProgress(0);
            }
        );

    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
        setUploadingItemId(null);
    }
  };

  const handleViewFile = async (item: DocumentChecklistItem) => {
    if (item.fileUrl) {
        window.open(item.fileUrl, '_blank');
        return;
    }

    if (item.fileRef && firestore) {
        try {
            const docSnap = await getDoc(doc(firestore, 'documents', item.fileRef));
            if (docSnap.exists()) {
                const data = docSnap.data() as DocumentData;
                window.open(data.fileUrl, '_blank');
            } else {
                throw new Error("Document link not found.");
            }
        } catch (e) {
            toast({ variant: 'destructive', title: "Error", description: "Could not open document." });
        }
    } else {
        toast({ variant: 'warning', title: "No File", description: "No file has been uploaded for this item." });
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (checklist.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl bg-stone-50/50">
              <FileWarning className="h-12 w-12 text-stone-300 mb-4" />
              <h3 className="text-lg font-semibold text-stone-900">Getting Started</h3>
              <p className="text-sm text-stone-500 max-w-xs text-center mt-1">
                  No documents uploaded yet. Start by adding the Commercial Invoice and Packing List.
              </p>
          </div>
      )
  }
  
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-stone-50/50">
            <TableHead>Document Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checklist.map((item) => (
            <TableRow key={item.id} className="group transition-colors">
              <TableCell className="font-medium text-stone-900">
                  <div className="flex items-center gap-2">
                    {getDocumentLabel(item.type)}
                    {item.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                  </div>
                  {item.mimeType && (
                      <span className="ml-2 text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                          {item.mimeType.split('/')[1] || 'FILE'}
                      </span>
                  )}
              </TableCell>
              <TableCell>
                  {item.required ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-100 bg-amber-50">Required</Badge>
                  ) : (
                      <span className="text-stone-400 text-xs">Optional</span>
                  )}
              </TableCell>
              <TableCell>
                <Select
                  value={item.status}
                  onValueChange={(value: DocumentChecklistStatus) => handleStatusChange(item.id!, value)}
                >
                  <SelectTrigger className={cn("w-32 h-8 text-xs font-semibold rounded-lg", statusColors[item.status])}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notStarted">Not Started</SelectItem>
                    <SelectItem value="inProgress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    {uploadingItemId === item.id ? (
                        <div className="flex flex-col items-end gap-1 w-24">
                            <span className="text-[10px] font-bold text-primary animate-pulse">
                                {Math.round(uploadProgress)}%
                            </span>
                            <Progress value={uploadProgress} className="h-1.5 w-full" />
                        </div>
                    ) : (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.onchange = (e) => handleFileUpload(e as any, item);
                                    input.click();
                                }}
                            >
                                <Upload className="mr-2 h-3.5 w-3.5" />
                                {item.status === 'completed' ? 'Replace' : 'Upload'}
                            </Button>
                            
                            {item.status === 'completed' && (
                                <>
                                  <Button size="sm" variant="ghost" title="View PDF" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleViewFile(item)}>
                                      <Eye className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button size="sm" variant="ghost" title="Mark as Finalized" className="h-8 w-8 p-0 rounded-lg text-emerald-600" onClick={() => handleFinalizeDocument(item)}>
                                      <FileCheck className="h-4 w-4" />
                                  </Button>
                                </>
                            )}
                        </>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
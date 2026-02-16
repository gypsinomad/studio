
'use client';
import { useState, useEffect, useRef } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { DocumentChecklistItem, DocumentChecklistStatus, Document as DocumentData } from '@/lib/types';
import { Upload, Link as LinkIcon, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DOCUMENT_TYPES } from '@/lib/constants';

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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await fetchChecklist(); // Refresh data
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update checklist item.' });
    }
  };

  const handleStatusChange = (itemId: string, status: DocumentChecklistStatus) => {
    updateChecklistItem(itemId, { status });
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, item: DocumentChecklistItem) => {
    const file = event.target.files?.[0];
    if (!file || !storage || !firestore || !user) return;
    
    setUploadingItemId(item.id!);
    
    try {
        // 1. Upload to storage
        const storagePath = `documents/${orderId}/${item.type}_${Date.now()}`;
        const storageRef = ref(storage, storagePath);
        const uploadResult = await uploadBytes(storageRef, file);
        const fileUrl = await getDownloadURL(uploadResult.ref);

        // 2. Create root document entry
        const docPayload: Omit<DocumentData, 'id'> = {
            name: file.name,
            type: item.type as DocumentData['type'],
            fileUrl,
            status: 'uploaded',
            relatedOrderId: orderId,
            uploadedBy: user.uid,
            uploadedAt: serverTimestamp(),
        };
        const newDocRef = await addDoc(collection(firestore, 'documents'), docPayload);

        // 3. Update checklist item to link it
        await updateChecklistItem(item.id!, {
            status: 'completed',
            fileRef: newDocRef.id,
        });

        toast({ title: 'Success', description: `${getDocumentLabel(item.type)} uploaded and linked.`});

    } catch (error) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload and link the document.' });
        console.error(error);
    } finally {
        setUploadingItemId(null);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg">
      <input type="file" ref={fileInputRef} className="hidden" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Required</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checklist.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{getDocumentLabel(item.type)}</TableCell>
              <TableCell>{item.required ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Select
                  value={item.status}
                  onValueChange={(value: DocumentChecklistStatus) => handleStatusChange(item.id!, value)}
                >
                  <SelectTrigger className={cn("w-32 h-8 text-xs", statusColors[item.status])}>
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
                {item.status !== 'completed' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={uploadingItemId === item.id}
                    onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = (e) => handleFileUpload(e as any, item);
                        input.click();
                    }}
                  >
                    {uploadingItemId === item.id ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                    Upload
                  </Button>
                ) : (
                   <Button size="sm" variant="ghost" asChild>
                       <a href="#" onClick={(e) => { e.preventDefault(); toast({title: "Info", description: "Viewing linked documents is not yet implemented."})}}>
                         <LinkIcon className="mr-2 h-4 w-4" /> View
                       </a>
                   </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

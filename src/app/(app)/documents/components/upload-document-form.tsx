'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, useStorage } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import type { DocumentType } from '@/lib/types';

const DOCUMENT_TYPES: DocumentType[] = ["proformaInvoice", "contract", "packingList", "billOfLading", "coo", "fssai", "apeda", "phytoCertificate", "shippingBill", "other"];

const formSchema = z.object({
  name: z.string().min(3, 'Document name must be at least 3 characters.'),
  type: z.enum(DOCUMENT_TYPES),
  file: z.instanceof(File).refine(file => file.size > 0, 'Please select a file.'),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadDocumentFormProps {
  onSuccess: () => void;
}

export function UploadDocumentForm({ onSuccess }: UploadDocumentFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'other',
    },
  });

  async function onSubmit(values: FormValues) {
    if (!firestore || !storage || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to upload documents.' });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload file to Cloud Storage
      const storagePath = `documents/${Date.now()}_${values.file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, values.file);
      const fileUrl = await getDownloadURL(uploadResult.ref);

      // 2. Create document metadata in Firestore
      const docPayload = {
        name: values.name,
        type: values.type,
        fileUrl: fileUrl,
        status: 'uploaded',
        uploadedBy: user.uid,
        uploadedAt: serverTimestamp(),
      };
      
      const docsCollection = collection(firestore, 'documents');
      await addDoc(docsCollection, docPayload);

      toast({
        title: 'Document Uploaded',
        description: `${values.name} has been successfully uploaded.`,
      });
      onSuccess();

    } catch (error) {
      console.error("Upload failed: ", error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'An unexpected error occurred while uploading the file.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Commercial Invoice #123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a document type" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {DOCUMENT_TYPES.map(type => (
                            <SelectItem key={type} value={type} className="capitalize">
                                {type.replace(/([A-Z])/g, ' $1').trim()}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                <Input 
                    type="file" 
                    {...fieldProps} 
                    onChange={(e) => onChange(e.target.files?.[0])}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="animate-spin mr-2" />}
            Upload and Save
          </Button>
        </div>
      </form>
    </Form>
  );
}

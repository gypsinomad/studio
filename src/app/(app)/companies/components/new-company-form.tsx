'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { INDUSTRY_TYPES, RELATIONSHIP_STATUSES, PAYMENT_TERMS, INCOTERMS } from '@/lib/constants';

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
import type { Company, IndustryType, RelationshipStatus, PaymentTerms } from '@/lib/types';
import { logActivity } from '@/lib/logger';

const formSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.'),
  country: z.string().min(2, 'Country is required.'),
  website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  industryType: z.custom<IndustryType>().optional(),
  paymentTerms: z.custom<PaymentTerms>().optional(),
  relationshipStatus: z.custom<RelationshipStatus>().optional(),
  taxId: z.string().optional(),
  importLicense: z.string().optional(),
  preferredIncoterms: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewCompanyFormProps {
  onSuccess: () => void;
}

export function NewCompanyForm({ onSuccess }: NewCompanyFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      country: '',
      website: '',
      taxId: '',
      importLicense: '',
      preferredIncoterms: '',
    },
  });

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a company.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const newCompanyPayload: Omit<Company, 'id'> = {
        ...values,
        createdAt: serverTimestamp(),
      };
      
      const docRef = doc(collection(firestore, 'companies'));
      await setDoc(docRef, newCompanyPayload);
      await logActivity(firestore, user, 'create', 'companies', docRef.id, null, values);

      toast({
        title: 'Customer Created',
        description: `${values.name} has been added to your customer list.`,
      });
      onSuccess();

    } catch (error) {
      console.error("Failed to create company: ", error);
      toast({
        variant: 'destructive',
        title: 'Failed to create company',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="e.g., Global Spice Importers Inc." {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="country" render={({ field }) => (
            <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="e.g., United Kingdom" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="website" render={({ field }) => (
            <FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="e.g., https://www.globalspice.co.uk" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="industryType" render={({ field }) => (
                <FormItem><FormLabel>Industry Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select industry..." /></SelectTrigger></FormControl><SelectContent>{INDUSTRY_TYPES.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="relationshipStatus" render={({ field }) => (
                <FormItem><FormLabel>Relationship Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl><SelectContent>{RELATIONSHIP_STATUSES.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                <FormItem><FormLabel>Default Payment Terms</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select terms..." /></SelectTrigger></FormControl><SelectContent>{PAYMENT_TERMS.map(term => (<SelectItem key={term} value={term}>{term}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="preferredIncoterms" render={({ field }) => (
                <FormItem><FormLabel>Preferred INCOTERMS</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select INCOTERMS..." /></SelectTrigger></FormControl><SelectContent>{INCOTERMS.map(term => (<SelectItem key={term} value={term}>{term}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="taxId" render={({ field }) => (
                <FormItem><FormLabel>Tax ID / VAT Number</FormLabel><FormControl><Input placeholder="Enter Tax ID" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="importLicense" render={({ field }) => (
                <FormItem><FormLabel>Import License</FormLabel><FormControl><Input placeholder="Enter Import License" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="animate-spin mr-2" />}
            Create Customer
          </Button>
        </div>
      </form>
    </Form>
  );
}

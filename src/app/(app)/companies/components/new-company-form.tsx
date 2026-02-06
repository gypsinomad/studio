'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import type { Company } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.'),
  country: z.string().min(2, 'Country is required.'),
  website: z.string().optional(),
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
      
      const companiesCollection = collection(firestore, 'companies');
      await addDoc(companiesCollection, newCompanyPayload);

      toast({
        title: 'Company Created',
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
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Global Spice Importers Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input placeholder="e.g., United Kingdom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., www.globalspice.co.uk" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="animate-spin mr-2" />}
            Create Company
          </Button>
        </div>
      </form>
    </Form>
  );
}

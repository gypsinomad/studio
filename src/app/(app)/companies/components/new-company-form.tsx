'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { runTransaction, doc, collection, serverTimestamp, arrayUnion } from 'firebase/firestore';

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

const formSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.'),
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
      website: '',
    },
  });

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    setIsSubmitting(true);

    try {
      await runTransaction(firestore, async (transaction) => {
        const newCompanyRef = doc(collection(firestore, 'companies'));
        
        // 1. Create the new company document
        transaction.set(newCompanyRef, {
          ...values,
          id: newCompanyRef.id,
          createdAt: serverTimestamp(),
        });
        
        // 2. Add the new company ID to the user's profile
        const userRef = doc(firestore, 'users', user.uid);
        transaction.update(userRef, {
          companyIds: arrayUnion(newCompanyRef.id)
        });
      });

      toast({
        title: 'Company Created',
        description: `${values.name} has been successfully created.`,
      });
      onSuccess();
    } catch (error) {
      console.error("Transaction failed: ", error);
      toast({
        variant: 'destructive',
        title: 'Failed to create company',
        description: 'An unexpected error occurred during the transaction.',
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
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Spice Exports Inc." {...field} />
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
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="animate-spin mr-2" />}
            Create Company
          </Button>
        </div>
      </form>
    </Form>
  );
}

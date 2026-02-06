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
import type { Lead } from '@/lib/types';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(10, 'Please enter a valid phone number.'),
  productInterest: z.string().min(2, 'Product interest is required.'),
  destinationCountry: z.string().min(2, 'Destination country is required.'),
});

type FormValues = z.infer<typeof formSchema>;

interface NewLeadFormProps {
  onSuccess: () => void;
}

export function NewLeadForm({ onSuccess }: NewLeadFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      companyName: '',
      email: '',
      phone: '',
      productInterest: '',
      destinationCountry: '',
    },
  });

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a lead.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const newLeadPayload: Omit<Lead, 'id'> = {
        ...values,
        status: 'new',
        source: 'manual',
        assignedUserId: user.uid,
        createdAt: serverTimestamp(),
        incotermsPreference: 'CIF', // Default value
      };
      
      const leadsCollection = collection(firestore, 'leads');
      await addDoc(leadsCollection, newLeadPayload);

      toast({
        title: 'Lead Created',
        description: `${values.fullName} has been added to your leads.`,
      });
      onSuccess();

    } catch (error) {
      console.error("Failed to create lead: ", error);
      toast({
        variant: 'destructive',
        title: 'Failed to create lead',
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
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Global Spice Traders" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="e.g., jane.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1 555-123-4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="productInterest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Interest</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Black Pepper, Cardamom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="destinationCountry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination Country</FormLabel>
              <FormControl>
                <Input placeholder="e.g., USA, Germany" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="animate-spin mr-2" />}
            Create Lead
          </Button>
        </div>
      </form>
    </Form>
  );
}

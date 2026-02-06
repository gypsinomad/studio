'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query } from 'firebase/firestore';
import { COMMUNICATION_METHODS } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import type { Contact, Company, CommunicationMethod } from '@/lib/types';
import { logActivity } from '@/lib/logger';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  jobTitle: z.string().optional(),
  contactRole: z.string().optional(),
  preferredCommunicationMethod: z.custom<CommunicationMethod>().optional(),
  companyId: z.string().optional(),
  decisionMaker: z.boolean().default(false),
  contactSource: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewContactFormProps {
  onSuccess: () => void;
}

export function NewContactForm({ onSuccess }: NewContactFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const companiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'companies'));
  }, [firestore]);
  const { data: companies, isLoading: areCompaniesLoading } = useCollection<Company>(companiesQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      companyId: '',
      decisionMaker: false,
      contactSource: '',
    },
  });

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a contact.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const newContactPayload: Omit<Contact, 'id'> = {
        ...values,
        createdAt: serverTimestamp(),
      };
      
      const docRef = doc(collection(firestore, 'contacts'));
      await setDoc(docRef, newContactPayload);
      await logActivity(firestore, user, 'create', 'contacts', docRef.id, null, values);

      toast({
        title: 'Contact Created',
        description: `${values.firstName} ${values.lastName} has been added to your contacts.`,
      });
      onSuccess();

    } catch (error) {
      console.error("Failed to create contact: ", error);
      toast({
        variant: 'destructive',
        title: 'Failed to create contact',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="e.g., Jane" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="e.g., Doe" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        </div>
         <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="e.g., jane.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="+1 555-123-4567" {...field} /></FormControl><FormMessage /></FormItem>)}/>
          <FormField control={form.control} name="whatsappNumber" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input placeholder="+1 555-123-4567" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
         <FormField control={form.control} name="jobTitle" render={({ field }) => (<FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="e.g., Purchasing Manager" {...field} /></FormControl><FormMessage /></FormItem>)}/>
         <FormField control={form.control} name="contactRole" render={({ field }) => (<FormItem><FormLabel>Role in Buying</FormLabel><FormControl><Input placeholder="e.g., Influencer" {...field} /></FormControl><FormMessage /></FormItem>)}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="contactSource" render={({ field }) => (<FormItem><FormLabel>Contact Source</FormLabel><FormControl><Input placeholder="e.g., Trade Show" {...field} /></FormControl><FormMessage /></FormItem>)}/>
          <FormField control={form.control} name="preferredCommunicationMethod" render={({ field }) => (<FormItem><FormLabel>Preferred Communication</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select method..." /></SelectTrigger></FormControl><SelectContent>{COMMUNICATION_METHODS.map(method => (<SelectItem key={method} value={method} className="capitalize">{method}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
        </div>
        <FormField control={form.control} name="companyId" render={({ field }) => (<FormItem><FormLabel>Customer</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={areCompaniesLoading}><FormControl><SelectTrigger><SelectValue placeholder={areCompaniesLoading ? "Loading customers..." : "Assign to a customer"} /></SelectTrigger></FormControl><SelectContent>{companies?.map(company => (<SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
        <FormField
          control={form.control}
          name="decisionMaker"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Decision Maker</FormLabel>
                <FormDescription>Is this contact a key decision maker?</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="animate-spin mr-2" />}
            Create Contact
          </Button>
        </div>
      </form>
    </Form>
  );
}

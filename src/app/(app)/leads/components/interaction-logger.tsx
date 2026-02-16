'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { InteractionType, InteractionDirection } from '@/lib/types';


const interactionSchema = z.object({
  type: z.enum(['call', 'whatsapp', 'email', 'meeting', 'other']),
  direction: z.enum(['inbound', 'outbound']),
  summary: z.string().min(1, "Summary is required.").max(500),
});

interface InteractionLoggerProps {
  leadId: string;
}

export function InteractionLogger({ leadId }: InteractionLoggerProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof interactionSchema>>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      type: 'call',
      direction: 'outbound',
      summary: '',
    },
  });

  async function onSubmit(values: z.infer<typeof interactionSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, leadId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log interaction.');
      }
      toast({ title: "Success", description: "Interaction logged." });
      form.reset();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: error instanceof Error ? error.message : "An unknown error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-1">
            <p className="font-medium text-sm">Log an Interaction</p>
            <p className="text-xs text-muted-foreground">Record a call, email, or meeting.</p>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="call">Call</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="meeting">Meeting</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></FormItem>
                )} />
                 <FormField control={form.control} name="direction" render={({ field }) => (
                    <FormItem><FormLabel>Direction</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="outbound">Outbound</SelectItem><SelectItem value="inbound">Inbound</SelectItem></SelectContent></Select></FormItem>
                )} />
            </div>
            <FormField control={form.control} name="summary" render={({ field }) => (
                <FormItem><FormLabel>Summary</FormLabel><FormControl><Textarea placeholder="e.g., Discussed pricing for black pepper..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" size="sm" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="animate-spin mr-2" />}
                Log Interaction
            </Button>
            </form>
        </Form>
    </div>
  );
}

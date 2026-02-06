'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query } from 'firebase/firestore';
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import type { Task, TaskStatus, Lead, ExportOrder } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { logActivity } from '@/lib/logger';

const TASK_STATUSES: TaskStatus[] = ['open', 'inProgress', 'done'];

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  status: z.enum(TASK_STATUSES),
  dueDate: z.date({
    required_error: "A due date is required.",
  }),
  relatedLeadId: z.string().optional(),
  relatedOrderId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewTaskFormProps {
  onSuccess: () => void;
}

export function NewTaskForm({ onSuccess }: NewTaskFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leadsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'leads')) : null, [firestore]);
  const { data: leads, isLoading: areLeadsLoading } = useCollection<Lead>(leadsQuery);

  const ordersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'exportOrders')) : null, [firestore]);
  const { data: orders, isLoading: areOrdersLoading } = useCollection<ExportOrder>(ordersQuery);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'open',
    },
  });

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a task.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const newTaskPayload: Omit<Task, 'id'> = {
        ...values,
        assigneeId: user.uid, // Assign to current user by default
        createdAt: serverTimestamp(),
      };
      
      const docRef = doc(collection(firestore, 'tasks'));
      await setDoc(docRef, newTaskPayload);
      await logActivity(firestore, user, 'create', 'tasks', docRef.id, null, newTaskPayload);

      toast({
        title: 'Task Created',
        description: `The task "${values.title}" has been created.`,
      });
      onSuccess();

    } catch (error) {
      console.error("Failed to create task: ", error);
      toast({
        variant: 'destructive',
        title: 'Failed to create task',
        description: 'An unexpected error occurred.',
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Follow up with new client" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add more details about the task..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                                date < new Date(new Date().setHours(0,0,0,0))
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {TASK_STATUSES.map(status => (
                            <SelectItem key={status} value={status} className="capitalize">
                               {status.replace(/([A-Z])/g, ' $1')}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>
         <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="relatedLeadId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Link to Lead (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={areLeadsLoading}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a lead" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {leads?.map(lead => <SelectItem key={lead.id} value={lead.id}>{lead.fullName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />
             <FormField
                control={form.control}
                name="relatedOrderId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Link to Order (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={areOrdersLoading}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select an order" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {orders?.map(order => <SelectItem key={order.id} value={order.id}>{order.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="animate-spin mr-2" />}
            Create Task
          </Button>
        </div>
      </form>
    </Form>
  );
}

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ExportOrder, LineItem } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { collection, writeBatch, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Textarea } from '@/components/ui/textarea';
import { logActivity } from '@/lib/logger';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

const lineItemSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  productType: z.string().optional(),
  hsCode: z.string().min(1, 'HS Code is required'),
  unitPrice: z.coerce.number().positive('Price must be > 0'),
  quantity: z.coerce.number().positive('Quantity must be > 0'),
  boxes: z.coerce.number().positive('Boxes must be > 0'),
  packing: z.string().optional(),
  grossWeightPerBox: z.coerce.number().positive('Gross Wt must be > 0'),
  netWeightPerBox: z.coerce.number().positive('Net Wt must be > 0'),
});

const formSchema = z.object({
  title: z.string().min(1, 'Order title is required.'),
  destinationCountry: z.string().min(1, 'Destination is required.'),
  destinationPort: z.string().optional(),
  incoterms: z.string().min(1, 'Incoterms are required.'),
  paymentTerms: z.string().min(1, 'Payment terms are required.'),
  contactId: z.string().min(1, 'A contact must be selected.'), // This will need a selector UI
  lineItems: z.array(lineItemSchema).min(1, 'At least one product is required.'),
  // New export-specific fields
  expectedShipmentDate: z.date().optional(),
  portOfLoading: z.string().optional(),
  containerType: z.string().optional(),
  fssaiLicenseNumber: z.string().optional(),
  certificateRequirements: z.string().optional(), // Using a single string for comma-separated values
});

type FormValues = z.infer<typeof formSchema>;

export default function NewExportOrderPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      destinationCountry: '',
      destinationPort: '',
      incoterms: 'CIF',
      paymentTerms: '100% LC at Sight',
      contactId: 'contact-placeholder-01', // Placeholder
      lineItems: [],
      portOfLoading: '',
      containerType: '',
      fssaiLicenseNumber: '',
      certificateRequirements: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });
  
  const lineItems = form.watch('lineItems');
  const totalValue = lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'Please log in again.' });
        return;
    }
    setIsSubmitting(true);

    try {
        const orderRef = doc(collection(firestore, 'exportOrders'));
        const newOrderPayload: Omit<ExportOrder, 'id'> = {
            ...values,
            certificateRequirements: values.certificateRequirements?.split(',').map(s => s.trim()).filter(Boolean),
            totalValue: totalValue,
            assignedUserId: user.uid,
            stage: 'enquiry',
            createdAt: serverTimestamp(),
        };
        
        await setDoc(orderRef, newOrderPayload);
        await logActivity(firestore, user, 'create', 'exportOrders', orderRef.id, null, newOrderPayload);

        // Batch write for line items is fine as they are sub-collection and less critical to log individually.
        const batch = writeBatch(firestore);
        values.lineItems.forEach(item => {
            const lineItemRef = doc(collection(firestore, `exportOrders/${orderRef.id}/lineItems`));
            batch.set(lineItemRef, item as Omit<LineItem, 'id'>);
        });
        await batch.commit();
        
        toast({ title: 'Success', description: 'New export order and all line items created.' });
        router.push('/export-orders');

    } catch (error) {
        console.error("Failed to save order: ", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An error occurred while saving the order.' });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <>
    <PageHeader title="New Export Order" description="Create a new export order with all necessary details." />
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Card>
            <CardHeader>
                <CardTitle>Shipment Details</CardTitle>
                <CardDescription>Fill in the main shipment and contact details for this export order.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem className="lg:col-span-3">
                        <FormLabel>Order Title</FormLabel>
                        <FormControl><Input placeholder="e.g., Spices to Dubai" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="contactId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contact</FormLabel>
                        <FormControl><Input placeholder="Select a contact..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="destinationCountry" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Destination Country</FormLabel>
                        <FormControl><Input placeholder="e.g., UAE" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="destinationPort" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Destination Port</FormLabel>
                        <FormControl><Input placeholder="e.g., Jebel Ali" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="portOfLoading" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Port of Loading</FormLabel>
                        <FormControl><Input placeholder="e.g., Cochin" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="containerType" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Container Type</FormLabel>
                        <FormControl><Input placeholder="e.g., 40ft HC" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="expectedShipmentDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Expected Shipment Date</FormLabel>
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
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Financial & Legal</CardTitle>
            </CardHeader>
             <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <FormField control={form.control} name="incoterms" render={({ field }) => (
                    <FormItem>
                        <FormLabel>INCOTERMS</FormLabel>
                        <FormControl><Input placeholder="e.g., CIF, FOB" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl><Textarea placeholder="e.g., 50% Advance, 50% on BL" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="fssaiLicenseNumber" render={({ field }) => (
                    <FormItem>
                        <FormLabel>FSSAI License No.</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                  <FormField control={form.control} name="certificateRequirements" render={({ field }) => (
                    <FormItem className="lg:col-span-3">
                        <FormLabel>Certificate Requirements</FormLabel>
                        <FormControl><Textarea placeholder="e.g., Certificate of Origin, Phyto-sanitary Certificate" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
             </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Add the products for this order. All weights are in KG and prices are in USD.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[20%]">Product Name</TableHead>
                            <TableHead>HS Code</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Quantity (kg)</TableHead>
                            <TableHead>Boxes</TableHead>
                            <TableHead>Gross Wt/Box</TableHead>
                            <TableHead>Net Wt/Box</TableHead>
                            <TableHead className="w-[5%]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                               <TableCell><Input placeholder="e.g. Black Pepper" {...form.register(`lineItems.${index}.productName`)} /></TableCell>
                               <TableCell><Input placeholder="090411" {...form.register(`lineItems.${index}.hsCode`)} /></TableCell>
                               <TableCell><Input type="number" step="0.01" placeholder="6.50" {...form.register(`lineItems.${index}.unitPrice`)} /></TableCell>
                               <TableCell><Input type="number" step="1" placeholder="1000" {...form.register(`lineItems.${index}.quantity`)} /></TableCell>
                               <TableCell><Input type="number" step="1" placeholder="200" {...form.register(`lineItems.${index}.boxes`)} /></TableCell>
                               <TableCell><Input type="number" step="0.1" placeholder="5.2" {...form.register(`lineItems.${index}.grossWeightPerBox`)} /></TableCell>
                               <TableCell><Input type="number" step="0.1" placeholder="5.0" {...form.register(`lineItems.${index}.netWeightPerBox`)} /></TableCell>
                               <TableCell>
                                   <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                       <Trash2 className="text-destructive" />
                                   </Button>
                               </TableCell>
                            </TableRow>
                        ))}
                         {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground">
                                    No products added yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                 <div className="mt-4 text-right font-bold text-lg">
                    Total Order Value: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </CardContent>
            <CardFooter className="justify-between">
                <Button type="button" variant="outline" onClick={() => append({ productName: '', hsCode: '', unitPrice: 0, quantity: 0, boxes: 0, grossWeightPerBox: 0, netWeightPerBox: 0 })}>Add Item</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <LoaderCircle className="animate-spin mr-2" />}
                    Create Order
                </Button>
            </CardFooter>
        </Card>

      </form>
    </Form>
    </>
  );
}

    
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ExportOrder, LineItem, Company, Contact, Task, OrderActivityLog } from '@/lib/types';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc, serverTimestamp, query } from 'firebase/firestore';
import { format, addDays } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { PRODUCT_TYPES, INCOTERMS, PAYMENT_TERMS, CONTAINER_TYPES, CURRENCIES, UNITS, APEDA_STATUSES, ICEGATE_STATUSES as ICEGATE_STATUSES_UPDATED } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { logActivity } from '@/lib/logger';
import { logUserActivity } from '@/lib/user-activity';


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
  companyId: z.string().min(1, 'A customer company must be selected.'),
  contactId: z.string().min(1, 'A contact must be selected.'),
  
  // Product
  productType: z.string().min(1, 'Product type is required'),
  quantity: z.coerce.number().optional(),
  unit: z.string().optional(),

  // Trade Terms
  incoterms: z.string().min(1, 'Incoterms are required.'),
  currency: z.string().default('USD'),
  paymentTerms: z.string().min(1, 'Payment terms are required.'),

  // Logistics
  destinationCountry: z.string().min(1, 'Destination is required.'),
  destinationPort: z.string().optional(),
  portOfLoading: z.string().default('Cochin Port'),
  containerType: z.string().optional(),
  estimatedShipDate: z.date().optional(),
  shippingLine: z.string().optional(),
  containerNumber: z.string().optional(),
  
  // Compliance
  hsCode: z.string().optional(),
  fssaiNumber: z.string().min(14, { message: "FSSAI must be 14 digits."}).max(14, { message: "FSSAI must be 14 digits."}),
  apedaStatus: z.string().optional(),
  iceGateStatus: z.string().optional(),
  phytosanitaryCert: z.boolean().default(false),
  certificateOfOrigin: z.boolean().default(false),
  certificateRequirements: z.string().optional(), 
  
  lineItems: z.array(lineItemSchema).min(1, 'At least one product is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewExportOrderPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data fetching for selectors
  const companiesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'companies')) : null, [firestore]);
  const { data: companies, isLoading: areCompaniesLoading } = useCollection<Company>(companiesQuery);
  const contactsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'contacts')) : null, [firestore]);
  const { data: contacts, isLoading: areContactsLoading } = useCollection<Contact>(contactsQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      portOfLoading: 'Cochin Port',
      lineItems: [],
      phytosanitaryCert: false,
      certificateOfOrigin: false,
      currency: 'USD',
      apedaStatus: 'Not Applied',
      iceGateStatus: 'Not Started',
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lineItems' });
  const totalValue = form.watch('lineItems').reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'Please log in again.' });
        return;
    }
    setIsSubmitting(true);

    try {
        const batch = writeBatch(firestore);

        // 1. Create Export Order
        const orderRef = doc(collection(firestore, 'exportOrders'));
        
        const initialLog: OrderActivityLog = {
          action: 'Order Created',
          details: `New export order "${values.title}" was created.`,
          timestamp: serverTimestamp(),
          userId: user.uid,
          userEmail: user.email || 'unknown',
        };

        const newOrderPayload: Omit<ExportOrder, 'id'> = {
            ...values,
            certificateRequirements: values.certificateRequirements?.split(',').map(s => s.trim()).filter(Boolean),
            totalValue: totalValue,
            assignedUserId: user.uid,
            stage: 'leadReceived',
            createdAt: serverTimestamp(),
            activityLog: [initialLog]
        };
        batch.set(orderRef, newOrderPayload);

        // 2. Create Line Items
        values.lineItems.forEach(item => {
            const lineItemRef = doc(collection(firestore, `exportOrders/${orderRef.id}/lineItems`));
            batch.set(lineItemRef, item as Omit<LineItem, 'id'>);
        });

        // 3. Create Follow-up Task (Automation)
        const taskRef = doc(collection(firestore, 'tasks'));
        const taskPayload: Omit<Task, 'id'> = {
            title: `Follow up on new inquiry: ${values.title}`,
            status: 'open',
            dueDate: addDays(new Date(), 2), // Due in 2 days
            assigneeId: user.uid,
            relatedOrderId: orderRef.id,
            createdAt: serverTimestamp()
        };
        batch.set(taskRef, taskPayload);

        // 4. Create Audit Log Entry
        await logActivity(firestore, user, 'create', 'exportOrders', orderRef.id, null, newOrderPayload);
        
        // 5. Create User-facing Activity Log
        await logUserActivity(firestore, 'Sprout', 'New Export Inquiry', `Order for "${values.title}" created.`);

        // 6. Commit all writes at once
        await batch.commit();
        
        toast({ title: 'Success', description: 'New export order, task, and logs created.' });
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
            <CardHeader><CardTitle>Basic Details</CardTitle><CardDescription>Fill in the main details for this export order.</CardDescription></CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem className="lg:col-span-3"><FormLabel>Order Title</FormLabel><FormControl><Input placeholder="e.g., Cardamom to Dubai" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="companyId" render={({ field }) => (<FormItem><FormLabel>Customer Company</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={areCompaniesLoading}><FormControl><SelectTrigger><SelectValue placeholder="Select a customer..." /></SelectTrigger></FormControl><SelectContent>{companies?.map(c => <SelectItem key={c.id} value={c.id!}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contactId" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={areContactsLoading}><FormControl><SelectTrigger><SelectValue placeholder="Select a contact..." /></SelectTrigger></FormControl><SelectContent>{contacts?.map(c => <SelectItem key={c.id} value={c.id!}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="productType" render={({ field }) => (<FormItem><FormLabel>Primary Product</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select product type..." /></SelectTrigger></FormControl><SelectContent>{PRODUCT_TYPES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>Total Quantity</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unit</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select unit..." /></SelectTrigger></FormControl><SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></FormItem>)} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Trade & Financial Terms</CardTitle></CardHeader>
             <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="incoterms" render={({ field }) => (<FormItem><FormLabel>INCOTERMS</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select INCOTERMS..." /></SelectTrigger></FormControl><SelectContent>{INCOTERMS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="paymentTerms" render={({ field }) => (<FormItem><FormLabel>Payment Terms</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select terms..." /></SelectTrigger></FormControl><SelectContent>{PAYMENT_TERMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="currency" render={({ field }) => (<FormItem><FormLabel>Currency</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select currency..." /></SelectTrigger></FormControl><SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>)} />
             </CardContent>
        </Card>

         <Card>
            <CardHeader><CardTitle>Logistics & Shipment</CardTitle></CardHeader>
             <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="destinationCountry" render={({ field }) => (<FormItem><FormLabel>Destination Country</FormLabel><FormControl><Input placeholder="e.g., UAE" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="destinationPort" render={({ field }) => (<FormItem><FormLabel>Destination Port</FormLabel><FormControl><Input placeholder="e.g., Jebel Ali" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="portOfLoading" render={({ field }) => (<FormItem><FormLabel>Port of Loading</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="containerType" render={({ field }) => (<FormItem><FormLabel>Container Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select container..." /></SelectTrigger></FormControl><SelectContent>{CONTAINER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="shippingLine" render={({ field }) => (<FormItem><FormLabel>Shipping Line</FormLabel><FormControl><Input placeholder="e.g. Maersk" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="estimatedShipDate" render={({ field }) => (<FormItem className="flex flex-col pt-2"><FormLabel>Estimated Shipment Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
             </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Indian Export Compliance</CardTitle></CardHeader>
             <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <FormField control={form.control} name="hsCode" render={({ field }) => (<FormItem><FormLabel>Overall HS Code</FormLabel><FormControl><Input placeholder="8-digit code" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fssaiNumber" render={({ field }) => (<FormItem><FormLabel>FSSAI License No.</FormLabel><FormControl><Input placeholder="14-digit number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="apedaStatus" render={({ field }) => (<FormItem><FormLabel>APEDA Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl><SelectContent>{APEDA_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                <FormField control={form.control} name="iceGateStatus" render={({ field }) => (<FormItem><FormLabel>ICEGATE Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger></FormControl><SelectContent>{ICEGATE_STATUSES_UPDATED.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                <div className="space-y-4 pt-2">
                    <FormField control={form.control} name="phytosanitaryCert" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Phytosanitary Cert Required?</FormLabel></div></FormItem>)} />
                    <FormField control={form.control} name="certificateOfOrigin" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Certificate of Origin Required?</FormLabel></div></FormItem>)} />
                </div>
                <FormField control={form.control} name="certificateRequirements" render={({ field }) => (<FormItem className="lg:col-span-3"><FormLabel>Other Certificate Requirements</FormLabel><FormControl><Textarea placeholder="e.g., Organic, Halal, Kosher" {...field} /></FormControl><FormMessage /></FormItem>)} />
             </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Line Items</CardTitle><CardDescription>Add the products for this order. All weights are in KG and prices are in USD.</CardDescription></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead className="w-[20%]">Product Name</TableHead><TableHead>HS Code</TableHead><TableHead>Unit Price</TableHead><TableHead>Quantity (kg)</TableHead><TableHead>Boxes</TableHead><TableHead>Gross Wt/Box</TableHead><TableHead>Net Wt/Box</TableHead><TableHead className="w-[5%]"></TableHead></TableRow></TableHeader>
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
                               <TableCell><Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="text-destructive" /></Button></TableCell>
                            </TableRow>
                        ))}
                         {fields.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No products added yet.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
                 <div className="mt-4 text-right font-bold text-lg">Total Order Value: {form.watch('currency')} {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
            <CardFooter className="justify-between">
                <Button type="button" variant="outline" onClick={() => append({ productName: '', hsCode: '', unitPrice: 0, quantity: 0, boxes: 0, grossWeightPerBox: 0, netWeightPerBox: 0 })}>Add Item</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting && <LoaderCircle className="animate-spin mr-2" />} Create Order</Button>
            </CardFooter>
        </Card>

      </form>
    </Form>
    </>
  );
}

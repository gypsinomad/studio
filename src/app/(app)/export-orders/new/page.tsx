'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  generateQuotationFromImage,
  type GenerateQuotationInput,
} from '@/ai/flows/generate-quotation-flow';
import type { LineItem, ExportOrder } from '@/lib/types';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';


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
  FormDescription,
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
import { LoaderCircle, Sparkles, Upload, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const lineItemSchema = z.object({
  productName: z.string(),
  quantity: z.coerce.number().min(0),
  boxes: z.coerce.number().min(0),
  grossWeightPerBox: z.coerce.number().min(0),
  netWeightPerBox: z.coerce.number().min(0),
});

const formSchema = z.object({
  title: z.string().min(1, 'Order title is required.'),
  destinationCountry: z.string().min(1, 'Destination is required.'),
  incoterms: z.string().min(1, 'Incoterms are required.'),
  totalValue: z.coerce.number().positive('Total value is required.'),
  paymentTerms: z.string().min(1, 'Payment terms are required.'),
  contactId: z.string().min(1, 'A contact must be assigned.'), // Assuming a contact selection UI exists
  lineItems: z.array(lineItemSchema).min(1, 'At least one product is required.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewExportOrderPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      destinationCountry: '',
      incoterms: 'CIF',
      totalValue: 12000,
      paymentTerms: '100% LC at Sight',
      contactId: 'contact-placeholder-01',
      lineItems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleGenerateFromImage = async () => {
    if (!imagePreview) {
        toast({ variant: 'destructive', title: 'Please select an image first.' });
        return;
    }
    setIsAiProcessing(true);
    try {
        const input: GenerateQuotationInput = {
            buyerListImage: imagePreview,
            totalWeightKg: 1200, // Example value
            grossWeightPerBoxKg: 5, // Example value
        };
        const result = await generateQuotationFromImage(input);
        
        // Clear existing line items and append new ones
        remove();
        result.lineItems.forEach(item => append(item));

        if(result.notes) {
            toast({ title: 'AI Processing Notes', description: result.notes });
        }

    } catch (error) {
        toast({ variant: 'destructive', title: 'AI Processing Failed', description: 'Could not parse the image.' });
    } finally {
        setIsAiProcessing(false);
    }
  };

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'Please log in again.' });
        return;
    }
    setIsSubmitting(true);

    try {
        const batch = writeBatch(firestore);

        // 1. Create the main order document
        const orderRef = doc(collection(firestore, 'exportOrders'));
        const newOrder: Omit<ExportOrder, 'id'> = {
            title: values.title,
            destinationCountry: values.destinationCountry,
            incoterms: values.incoterms,
            totalValue: values.totalValue,
            paymentTerms: values.paymentTerms,
            contactId: values.contactId,
            assignedUserId: user.uid,
            stage: 'quotationSent',
            createdAt: serverTimestamp(),
        };
        batch.set(orderRef, newOrder);

        // 2. Create each line item in the subcollection
        values.lineItems.forEach(item => {
            const lineItemRef = doc(collection(firestore, `exportOrders/${orderRef.id}/lineItems`));
            batch.set(lineItemRef, item);
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
    <PageHeader title="New Export Order" description="Generate a quotation from a buyer's list." />
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Card>
            <CardHeader>
                <CardTitle>AI Quotation Generator</CardTitle>
                <CardDescription>Upload an image of the buyer's product list to get started.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                     <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Buyer's List Image</FormLabel>
                                <FormControl>
                                    <div className="flex items-center gap-4">
                                        <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} className="flex-1" />
                                        <Button type="button" onClick={handleGenerateFromImage} disabled={isAiProcessing || !imagePreview}>
                                            {isAiProcessing ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                                            Generate
                                        </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />

                    {imagePreview && (
                        <div className="border rounded-md p-2">
                            <img src={imagePreview} alt="Buyer list preview" className="max-h-64 w-auto rounded-md" />
                        </div>
                    )}
                </div>
                 <div className="space-y-4">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Order Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Vegetable Mix to Dubai" {...field} />
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
                            <Input placeholder="e.g., UAE" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="totalValue"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Total Estimated Value (USD)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Review and edit the products parsed by the AI. All weights are in KG.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Product Name</TableHead>
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
                               <TableCell><Input {...form.register(`lineItems.${index}.productName`)} /></TableCell>
                               <TableCell><Input type="number" {...form.register(`lineItems.${index}.quantity`)} /></TableCell>
                               <TableCell><Input type="number" {...form.register(`lineItems.${index}.boxes`)} /></TableCell>
                               <TableCell><Input type="number" step="0.1" {...form.register(`lineItems.${index}.grossWeightPerBox`)} /></TableCell>
                               <TableCell><Input type="number" step="0.1" {...form.register(`lineItems.${index}.netWeightPerBox`)} /></TableCell>
                               <TableCell>
                                   <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                       <Trash2 className="text-destructive" />
                                   </Button>
                               </TableCell>
                            </TableRow>
                        ))}
                         {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    Generate line items from an image or add them manually.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="justify-between">
                <Button type="button" variant="outline" onClick={() => append({ productName: '', quantity: 0, boxes: 0, grossWeightPerBox: 5, netWeightPerBox: 4.5 })}>Add Item</Button>
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

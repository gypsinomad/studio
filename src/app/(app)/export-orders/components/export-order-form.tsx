'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  checkExportOrderCompliance,
  type CheckExportOrderComplianceInput,
} from '@/ai/flows/check-export-order-compliance';
import type { AISettings, AIGuardResult, CheckExportOrderComplianceOutput } from '@/lib/types';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';


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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Wand2, LoaderCircle, Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  stage: z.string().default('leadReceived'),
  companyId: z.string().min(1, 'Company is required.'),
  contactId: z.string().min(1, 'Contact is required.'),
  productType: z.string().min(1, 'Product type is required.'),
  destinationCountry: z.string().min(1, 'Destination country is required.'),
  incoterms: z.string().min(1, 'Incoterms are required.'),
  hsCode: z.string().optional(),
  quantity: z.coerce.number().positive('Quantity must be positive.'),
  unitPrice: z.coerce.number().positive('Unit price must be positive.'),
  paymentTerms: z.string().optional(),
  containerType: z.string().optional(),
  portOfLoading: z.string().optional(),
  expectedShipmentDate: z.string().min(1, 'Shipment date is required.'),
  fssaiLicenseNumber: z.string().optional(),
  icegateStatus: z.string().optional(),
  certificateRequirements: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExportOrderFormProps {
  aiSettings: AISettings;
}

export function ExportOrderForm({ aiSettings }: ExportOrderFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [aiResult, setAiResult] = useState<AIGuardResult<CheckExportOrderComplianceOutput> | null>(null);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      stage: 'leadReceived',
      companyId: 'comp-01', // Mock
      contactId: 'cont-01', // Mock
      productType: '',
      destinationCountry: '',
      incoterms: 'FOB',
      hsCode: '',
      quantity: 1000,
      unitPrice: 1,
      paymentTerms: '100% LC at Sight',
      containerType: '20ft',
      portOfLoading: '',
      expectedShipmentDate: new Date().toISOString().split('T')[0],
      fssaiLicenseNumber: '',
      icegateStatus: '',
      certificateRequirements: '',
    },
  });

  const runAiCheck = async () => {
    const values = form.getValues();
    const validation = formSchema.safeParse(values);

    if (!validation.success) {
      toast({
        variant: 'destructive',
        title: 'Please fill out all required fields before running the AI check.',
      });
      form.trigger();
      return;
    }

    setIsChecking(true);
    setAiResult(null);

    try {
      const input: CheckExportOrderComplianceInput = {
        ...values,
        certificateRequirements: values.certificateRequirements
          ? values.certificateRequirements.split(',').map((s) => s.trim())
          : [],
        expectedShipmentDate: new Date(values.expectedShipmentDate).toISOString(),
      };
      const result = await checkExportOrderCompliance(input);
      setAiResult(result);
    } catch (error) {
      console.error('AI Compliance Check Error:', error);
      const reason = error instanceof Error ? error.message : 'An unknown error occurred.';
      setAiResult({ aiUsed: false, aiReason: 'error', aiData: null });
      toast({
        variant: 'destructive',
        title: 'AI Check Failed',
        description: reason,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleAiCheckClick = () => {
    if (aiSettings.aiMode === 'safe') {
      setShowBudgetWarning(true);
    } else {
      runAiCheck();
    }
  };

  async function onSubmit(values: FormValues) {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not authenticated.' });
      return;
    }

    setIsSubmitting(true);
    
    const newOrder = {
        ...values,
        assignedUserId: user.uid,
        createdAt: serverTimestamp(),
        aiValidation: aiResult?.aiData?.aiValidation || '',
        certificateRequirements: values.certificateRequirements?.split(',').map(s => s.trim()) || [],
        expectedShipmentDate: new Date(values.expectedShipmentDate),
    };

    try {
        const ordersCollection = collection(firestore, 'exportOrders');
        await addDocumentNonBlocking(ordersCollection, newOrder);
        
        toast({
            title: 'Order Created',
            description: `${values.title} has been successfully created.`,
        });
        form.reset();
        setAiResult(null);

    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Failed to create order',
            description: 'An unexpected error occurred.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const getAiResultMessage = () => {
    if (!aiResult) return null;
    if (aiResult.aiUsed && aiResult.aiData) {
      return (
        <div>
          <h4 className="font-semibold mb-2">AI Suggestions:</h4>
          <div className="prose prose-sm max-w-none text-foreground bg-primary/10 p-4 rounded-md">
            <p>{aiResult.aiData.aiValidation}</p>
          </div>
        </div>
      );
    }

    let message = "AI check was not performed.";
    if (aiResult.aiReason === 'aiDisabled') {
        message = "AI is disabled in settings. The check was skipped.";
    } else if (aiResult.aiReason === 'budgetOrQuotaExceeded') {
        message = "AI check was skipped due to budget or daily quota limits.";
    } else if (aiResult.aiReason === 'error') {
        message = "An error occurred while running the AI check.";
    }

    return (
        <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted/50 rounded-md">
            <Info className="h-5 w-5" />
            <span>{message}</span>
        </div>
    );
  };

  return (
    <>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>
                Fill in the details of the export order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Turmeric to USA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Turmeric Powder" {...field} />
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
                        <Input placeholder="e.g., United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="incoterms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incoterms</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Incoterms" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FOB">FOB (Free On Board)</SelectItem>
                          <SelectItem value="CIF">
                            CIF (Cost, Insurance, and Freight)
                          </SelectItem>
                          <SelectItem value="EXW">EXW (Ex Works)</SelectItem>
                          <SelectItem value="DAP">DAP (Delivered at Place)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedShipmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Shipment Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hsCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HS Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 0910.11.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="certificateRequirements"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>
                        Known Certificate Requirements (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Certificate of Origin, Phytosanitary Certificate"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a comma-separated list of required certificates.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* AI Section */}
              <Card className="bg-background/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    AI Compliance Check
                  </CardTitle>
                  <CardDescription>
                    Use AI to check your order details against common export
                    regulations and requirements.
                  </CardDescription>
                   {aiSettings.aiMode === 'unrestricted' && (
                       <p className="text-xs text-amber-600">AI calls may incur pay-as-you-go charges on Blaze.</p>
                   )}
                </CardHeader>
                <CardContent>
                  {isChecking && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LoaderCircle className="animate-spin" />
                      <span>Analyzing your order data...</span>
                    </div>
                  )}
                  {aiResult && getAiResultMessage()}
                </CardContent>
                <CardFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAiCheckClick}
                    disabled={isChecking || aiSettings.aiMode === 'off' || isSubmitting}
                    title={aiSettings.aiMode === 'off' ? 'AI is disabled in settings.' : 'Run AI Check'}
                  >
                    {isChecking ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Wand2 />
                    )}
                    Run AI Check
                  </Button>
                </CardFooter>
              </Card>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="animate-spin" />}
                Create Order
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <AlertDialog open={showBudgetWarning} onOpenChange={setShowBudgetWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>AI Budget Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              You are in &quot;Safe Mode&quot;. Using AI may bring you closer to your budget limit and could incur charges on your Blaze plan. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bypass AI (Manual)</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowBudgetWarning(false);
                runAiCheck();
              }}
            >
              Use AI
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

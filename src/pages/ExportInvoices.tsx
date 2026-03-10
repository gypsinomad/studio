'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Plus, 
  Search, 
  Download, 
  Eye, 
  FileText, 
  DollarSign, 
  Calendar, 
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Receipt,
  Printer,
  Mail
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, onSnapshot } from 'firebase/firestore';

import { useFirestore, useUser } from '@/firebase';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Form validation schema
const invoiceFormSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional()
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface Invoice {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerCompanyName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  totalAmount: number;
  taxAmount: number;
  finalAmount: number;
  notes?: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  orgId: string;
}

interface Order {
  id: string;
  orderNumber: string;
  buyerCompanyName: string;
  totalValue: number;
  status: string;
  lineItems: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number
  }>;
}

const INVOICE_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
const TAX_RATE = 0.1; // 10% tax rate

const ExportInvoices: React.FC = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  if (!isBrowser) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    );
  }
  
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  
  // For now, use user.uid as orgId if userProfile.orgId is not available
  // TODO: Fix orgId assignment in user profile creation
  const orgId = userProfile?.orgId || user?.uid;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      orderId: '',
      invoiceNumber: '',
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(new Date().setDate(new Date().getDate() + 30)), 'yyyy-MM-dd'),
      status: 'Draft',
      notes: ''
    }
  });

  // Fetch invoices and orders
  useEffect(() => {
    if (!orgId) return;

    const fetchInvoices = onSnapshot(
      query(
        collection(firestore, 'invoices'),
        where('orgId', '==', user.orgId),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const invoicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Invoice));
        setInvoices(invoicesData);
        setLoading(false);
      }
    );

    const fetchOrders = async () => {
      try {
        const ordersQuery = query(
          collection(firestore, 'exportOrders'),
          where('orgId', '==', user.orgId),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          orderNumber: doc.data().orderNumber || doc.id.slice(-6).toUpperCase(),
          buyerCompanyName: doc.data().buyer.companyName,
          totalValue: doc.data().totalValue,
          status: doc.data().status,
          lineItems: doc.data().lineItems || []
        } as Order));
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();

    return () => fetchInvoices();
  }, [orgId]);

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${year}${month}-${random}`;
  };

  // Form submission
  const onSubmit = async (data: InvoiceFormData) => {
    if (!orgId) return;

    try {
      const selectedOrder = orders.find(order => order.id === data.orderId);
      if (!selectedOrder) {
        toast.error('Please select a valid order');
        return;
      }

      const totalAmount = selectedOrder.totalValue;
      const taxAmount = totalAmount * TAX_RATE;
      const finalAmount = totalAmount + taxAmount;

      const invoiceData = {
        ...data,
        orderNumber: selectedOrder.orderNumber,
        buyerCompanyName: selectedOrder.buyerCompanyName,
        totalAmount,
        taxAmount,
        finalAmount,
        orgId: user.orgId,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(firestore, 'invoices'), invoiceData);
      toast.success('Invoice created successfully');
      setShowCreateDialog(false);
      form.reset();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };

  // Generate PDF (mock implementation)
  const generatePDF = async (invoice: Invoice) => {
    setGeneratingPDF(true);
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, you would use a PDF library like @react-pdf/renderer
    const pdfContent = `
      Invoice: ${invoice.invoiceNumber}
      Order: ${invoice.orderNumber}
      Company: ${invoice.buyerCompanyName}
      Amount: $${invoice.finalAmount.toFixed(2)}
      Due Date: ${invoice.dueDate}
    `;
    
    console.log('PDF Content:', pdfContent);
    
    toast.success('PDF generated successfully');
    setGeneratingPDF(false);
  };

  // Send invoice
  const sendInvoice = async (invoiceId: string) => {
    try {
      await updateDoc(doc(firestore, 'invoices', invoiceId), {
        status: 'Sent',
        updatedAt: new Date()
      });
      toast.success('Invoice sent successfully');
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
  };

  // Mark as paid
  const markAsPaid = async (invoiceId: string) => {
    try {
      await updateDoc(doc(firestore, 'invoices', invoiceId), {
        status: 'Paid',
        updatedAt: new Date()
      });
      toast.success('Invoice marked as paid');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.buyerCompanyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !selectedStatus || invoice.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Sent': return <Send className="h-4 w-4 text-blue-500" />;
      case 'Overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Draft': return <FileText className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const InvoiceCard: React.FC<{ invoice: Invoice }> = ({ invoice }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(invoice.status)}
              <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Order:</span>
                <div className="font-medium">{invoice.orderNumber}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <div className="font-medium">{invoice.buyerCompanyName}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Issue Date:</span>
                <div className="font-medium">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Due Date:</span>
                <div className="font-medium">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-xl font-bold">${invoice.finalAmount.toFixed(2)}</div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setShowPreviewDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generatePDF(invoice)}
                    disabled={generatingPDF}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {invoice.status === 'Draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendInvoice(invoice.id)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  {invoice.status === 'Sent' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsPaid(invoice.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Invoices & Documents</h1>
            <p className="text-muted-foreground">Manage invoices and export documentation</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices & Documents</h1>
          <p className="text-muted-foreground">Manage invoices and export documentation</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Order *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orders.map(order => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.orderNumber} - {order.buyerCompanyName} (${order.totalValue.toLocaleString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Number *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="INV-2024-001"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INVOICE_STATUSES.map(status => (
                              <SelectItem key={status} value={status}>
                                {status}
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
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional notes..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      form.setValue('invoiceNumber', generateInvoiceNumber());
                    }}
                  >
                    Generate Number
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Invoice
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {INVOICE_STATUSES.map(status => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold">
                  ${invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.finalAmount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">
                  ${invoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.finalAmount, 0).toLocaleString()}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid This Month</p>
                <p className="text-2xl font-bold">
                  ${invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.finalAmount, 0).toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Grid */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No invoices found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      )}

      {/* Invoice Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">INVOICE</h2>
                    <p className="text-lg text-muted-foreground">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge className={getStatusColor(selectedInvoice.status)}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-2">Bill To</h3>
                  <p className="font-medium">{selectedInvoice.buyerCompanyName}</p>
                  <p className="text-sm text-muted-foreground">Order: {selectedInvoice.orderNumber}</p>
                </div>
                <div className="text-right">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Issue Date:</span>
                      <div className="font-medium">{format(new Date(selectedInvoice.issueDate), 'MMM dd, yyyy')}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Due Date:</span>
                      <div className="font-medium">{format(new Date(selectedInvoice.dueDate), 'MMM dd, yyyy')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div>
                <h3 className="font-semibold mb-4">Invoice Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span>Subtotal</span>
                    <span>${selectedInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Tax (10%)</span>
                    <span>${selectedInvoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold text-lg">
                    <span>Total</span>
                    <span>${selectedInvoice.finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => generatePDF(selectedInvoice)} disabled={generatingPDF}>
                  <Printer className="h-4 w-4 mr-2" />
                  {generatingPDF ? 'Generating...' : 'Print PDF'}
                </Button>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExportInvoices;











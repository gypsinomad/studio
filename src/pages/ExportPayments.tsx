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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Building,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format, isPast, isToday, addDays } from 'date-fns';
import { toast } from 'sonner';

// Form validation schema
const paymentFormSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  amount: z.number().min(0, "Amount must be positive"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional()
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface Payment {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerCompanyName: string;
  amount: number;
  paymentMethod: string;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Partial' | 'Cancelled';
  paidAmount?: number;
  transactionId?: string;
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
}

const PAYMENT_METHODS = [
  'Wire Transfer', 'Letter of Credit', 'Documentary Collection', 
  'Credit Card', 'PayPal', 'Bank Transfer', 'Cash', 'Other'
];

const PAYMENT_STATUSES = ['Pending', 'Paid', 'Overdue', 'Partial', 'Cancelled'];

const ExportPayments: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      orderId: '',
      amount: 0,
      paymentMethod: '',
      dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      status: 'Pending',
      notes: ''
    }
  });

  // Fetch payments and orders
  useEffect(() => {
    if (!user?.orgId) return;

    const fetchPayments = onSnapshot(
      query(
        collection(db, 'payments'),
        where('orgId', '==', user.orgId),
        orderBy('dueDate', 'asc')
      ),
      (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Payment));
        setPayments(paymentsData);
        setLoading(false);
      }
    );

    const fetchOrders = async () => {
      try {
        const ordersQuery = query(
          collection(db, 'exportOrders'),
          where('orgId', '==', user.orgId),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          orderNumber: doc.data().orderNumber || doc.id.slice(-6).toUpperCase(),
          buyerCompanyName: doc.data().buyer.companyName,
          totalValue: doc.data().totalValue,
          status: doc.data().status
        } as Order));
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();

    return () => fetchPayments();
  }, [user?.orgId]);

  // Form submission
  const onSubmit = async (data: PaymentFormData) => {
    if (!user?.orgId) return;

    try {
      const selectedOrder = orders.find(order => order.id === data.orderId);
      if (!selectedOrder) {
        toast.error('Please select a valid order');
        return;
      }

      const paymentData = {
        ...data,
        orderNumber: selectedOrder.orderNumber,
        buyerCompanyName: selectedOrder.buyerCompanyName,
        orgId: user.orgId,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'payments'), paymentData);
      toast.success('Payment recorded successfully');
      setShowAddDialog(false);
      form.reset();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to record payment');
    }
  };

  // Mark as paid
  const markAsPaid = async (paymentId: string, amount?: number) => {
    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        status: 'Paid',
        paidAmount: amount,
        transactionId: `TXN${Date.now()}`,
        updatedAt: new Date()
      });
      toast.success('Payment marked as paid');
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    }
  };

  // Delete payment
  const deletePayment = async (paymentId: string) => {
    try {
      await deleteDoc(doc(db, 'payments', paymentId));
      toast.success('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.buyerCompanyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !selectedStatus || payment.status === selectedStatus;
    const matchesMethod = !selectedMethod || payment.paymentMethod === selectedMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Calculate statistics
  const totalReceivables = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.paidAmount || p.amount), 0);
  const pendingAmount = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = payments.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.amount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'Partial': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'Partial': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Wire Transfer':
      case 'Bank Transfer': return <Building className="h-4 w-4 text-blue-500" />;
      case 'Credit Card': return <CreditCard className="h-4 w-4 text-purple-500" />;
      case 'Cash': return <Banknote className="h-4 w-4 text-green-500" />;
      default: return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const PaymentCard: React.FC<{ payment: Payment }> = ({ payment }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            setSelectedPayment(payment);
            setShowDetailDialog(true);
          }}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(payment.status)}
            <h3 className="font-semibold">{payment.orderNumber}</h3>
            <Badge className={getStatusColor(payment.status)}>
              {payment.status}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">${payment.amount.toLocaleString()}</div>
            {payment.paidAmount && payment.paidAmount < payment.amount && (
              <div className="text-sm text-muted-foreground">
                Paid: ${payment.paidAmount.toLocaleString()}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Customer:</span>
            <span>{payment.buyerCompanyName}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {getMethodIcon(payment.paymentMethod)}
              <span className="text-muted-foreground">Method:</span>
            </div>
            <span>{payment.paymentMethod}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Due:</span>
            </div>
            <span className={payment.status === 'Overdue' ? 'text-red-600 font-medium' : ''}>
              {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
              {payment.status === 'Overdue' && (
                <span className="ml-1">({getDaysOverdue(payment.dueDate)} days overdue)</span>
              )}
            </span>
          </div>
          
          {payment.transactionId && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span className="font-mono text-xs">{payment.transactionId}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex space-x-2">
            {payment.status === 'Pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  markAsPaid(payment.id);
                }}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark Paid
              </Button>
            )}
            {payment.status === 'Partial' && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  markAsPaid(payment.id, payment.amount);
                }}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete Payment
              </Button>
            )}
          </div>
          
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
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
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Track and manage export payments</p>
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
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Track and manage export payments</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_METHODS.map(method => (
                              <SelectItem key={method} value={method}>
                                {method}
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
                            {PAYMENT_STATUSES.map(status => (
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any payment notes..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Record Payment
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
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {PAYMENT_STATUSES.map(status => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedMethod} onValueChange={setSelectedMethod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Methods</SelectItem>
            {PAYMENT_METHODS.map(method => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Receivables</p>
                <p className="text-2xl font-bold">${totalReceivables.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">${paidAmount.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">${overdueAmount.toLocaleString()}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Grid */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No payments found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPayments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      )}

      {/* Payment Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(selectedPayment.status)}
                  <div>
                    <h3 className="text-xl font-bold">{selectedPayment.orderNumber}</h3>
                    <p className="text-muted-foreground">{selectedPayment.buyerCompanyName}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(selectedPayment.status)}>
                  {selectedPayment.status}
                </Badge>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="transaction">Transaction</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                      <div className="text-2xl font-bold">${selectedPayment.amount.toLocaleString()}</div>
                      {selectedPayment.paidAmount && (
                        <div className="text-sm text-muted-foreground">
                          Paid: ${selectedPayment.paidAmount.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        {getMethodIcon(selectedPayment.paymentMethod)}
                        <span>{selectedPayment.paymentMethod}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                      <div className={selectedPayment.status === 'Overdue' ? 'text-red-600 font-medium' : ''}>
                        {format(new Date(selectedPayment.dueDate), 'MMM dd, yyyy')}
                        {selectedPayment.status === 'Overdue' && (
                          <div className="text-sm">{getDaysOverdue(selectedPayment.dueDate)} days overdue</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                      <div>{format(selectedPayment.createdAt.toDate(), 'MMM dd, yyyy')}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="transaction" className="space-y-4">
                  {selectedPayment.transactionId ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Transaction ID</Label>
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                          {selectedPayment.transactionId}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(selectedPayment.status)}
                          <span>{selectedPayment.status}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No transaction information available
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  {selectedPayment.notes ? (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                      <p className="text-sm mt-1">{selectedPayment.notes}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No notes added
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                {selectedPayment.status === 'Pending' && (
                  <Button onClick={() => markAsPaid(selectedPayment.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button variant="destructive" onClick={() => deletePayment(selectedPayment.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExportPayments;

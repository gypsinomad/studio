import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  Ship,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ORDER_STATUSES = [
  { value: 'Draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'Confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'Packed', label: 'Packed', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  { value: 'In-Transit', label: 'In-Transit', color: 'bg-orange-100 text-orange-800' },
  { value: 'Delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'Invoiced', label: 'Invoiced', color: 'bg-teal-100 text-teal-800' }
];

const INCOTERMS = ['EXW', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];

// Form validation schemas
const buyerFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  isNew: z.boolean().default(false)
});

const lineItemSchema = z.object({
  id: z.string(),
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1, "Product name is required"),
  hsCode: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  totalPrice: z.number().min(0, "Total price must be positive")
});

const shipmentFormSchema = z.object({
  portOfLoading: z.string().min(1, "Port of loading is required"),
  portOfDischarge: z.string().min(1, "Port of discharge is required"),
  incoterm: z.string().min(1, "Incoterm is required"),
  expectedShipmentDate: z.string().min(1, "Expected shipment date is required").or(z.literal("")).transform(val => val || ""),
  shippingInstructions: z.string().optional()
});

const orderFormSchema = z.object({
  buyer: buyerFormSchema,
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  shipment: shipmentFormSchema,
  notes: z.string().optional()
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface LineItem {
  id: string;
  productId: string;
  productName: string;
  hsCode?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface Buyer {
  id?: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  country: string;
  isNew?: boolean;
}

interface ShipmentInfo {
  portOfLoading: string;
  portOfDischarge: string;
  incoterm: string;
  expectedShipmentDate: string;
  shippingInstructions?: string;
}

interface ExportOrder {
  id: string;
  orderNumber: string;
  buyer: Buyer;
  lineItems: LineItem[];
  shipment: ShipmentInfo;
  totalValue: number;
  status: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  orgId: string;
}

const ExportOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ExportOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ExportOrder | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<Buyer[]>([]);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      buyer: {
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        country: '',
        isNew: false
      },
      lineItems: [{
        id: '1',
        productId: '',
        productName: '',
        hsCode: '',
        quantity: 1,
        unit: 'KG',
        unitPrice: 0,
        totalPrice: 0
      }],
      shipment: {
        portOfLoading: '',
        portOfDischarge: '',
        incoterm: 'FOB',
        expectedShipmentDate: '',
        shippingInstructions: ''
      },
      notes: ''
    }
  });

  // Fetch orders
  useEffect(() => {
    if (!user?.orgId) return;

    const q = query(
      collection(db, 'exportOrders'),
      where('orgId', '==', user.orgId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ExportOrder));
      setOrders(ordersData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.orgId]);

  // Fetch available products
  useEffect(() => {
    if (!user?.orgId) return;

    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, 'items'),
          where('orgId', '==', user.orgId)
        );
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAvailableProducts(products);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [user?.orgId]);

  // Fetch existing customers
  useEffect(() => {
    if (!user?.orgId) return;

    const fetchCustomers = async () => {
      try {
        const q = query(
          collection(db, 'companies'),
          where('orgId', '==', user.orgId)
        );
        const querySnapshot = await getDocs(q);
        const customers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Buyer));
        setExistingCustomers(customers);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, [user?.orgId]);

  // Generate order number
  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EXP-${year}${month}-${random}`;
  };

  // Add line item
  const addLineItem = () => {
    const currentItems = form.getValues('lineItems');
    const newId = (currentItems.length + 1).toString();
    form.setValue('lineItems', [
      ...currentItems,
      {
        id: newId,
        productId: '',
        productName: '',
        hsCode: '',
        quantity: 1,
        unit: 'KG',
        unitPrice: 0,
        totalPrice: 0
      }
    ]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    const currentItems = form.getValues('lineItems');
    if (currentItems.length > 1) {
      form.setValue('lineItems', currentItems.filter((_, i) => i !== index));
    }
  };

  // Update line item total
  const updateLineItemTotal = (index: number) => {
    const currentItems = form.getValues('lineItems');
    const item = currentItems[index];
    const total = item.quantity * item.unitPrice;
    form.setValue(`lineItems.${index}.totalPrice`, total);
  };

  // Calculate order total
  const calculateOrderTotal = () => {
    const lineItems = form.getValues('lineItems');
    return lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  // Form submission
  const onSubmit = async (data: OrderFormData) => {
    if (!user?.orgId) return;

    try {
      const orderData = {
        orderNumber: generateOrderNumber(),
        buyer: data.buyer,
        lineItems: data.lineItems,
        shipment: data.shipment,
        totalValue: calculateOrderTotal(),
        status: 'Draft',
        notes: data.notes,
        orgId: user.orgId,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'exportOrders'), orderData);
      toast.success('Order created successfully');
      setShowAddDialog(false);
      form.reset();
      setCurrentStep(1);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    }
  };

  // Status change
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'exportOrders', orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !selectedStatus || order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FileText className="h-4 w-4" />;
      case 'Confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'Packed': return <Package className="h-4 w-4" />;
      case 'Shipped': return <Ship className="h-4 w-4" />;
      case 'In-Transit': return <Clock className="h-4 w-4" />;
      case 'Delivered': return <CheckCircle className="h-4 w-4" />;
      case 'Invoiced': return <DollarSign className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Export Orders</h1>
          <p className="text-muted-foreground">Manage your export orders and shipments</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Export Order</DialogTitle>
            </DialogHeader>
            
            <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="1">Buyer Details</TabsTrigger>
                <TabsTrigger value="2">Line Items</TabsTrigger>
                <TabsTrigger value="3">Shipment Info</TabsTrigger>
                <TabsTrigger value="4">Review & Save</TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Step 1: Buyer Details */}
                  <TabsContent value="1" className="space-y-4">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="buyer.isNew"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="rounded"
                                />
                                <Label>New Customer</Label>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {!form.watch('buyer.isNew') && (
                        <FormField
                          control={form.control}
                          name="buyer.companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Existing Customer</FormLabel>
                              <Select onValueChange={(value) => {
                                const customer = existingCustomers.find(c => c.id === value);
                                if (customer) {
                                  form.setValue('buyer.companyName', customer.companyName);
                                  form.setValue('buyer.contactPerson', customer.contactPerson);
                                  form.setValue('buyer.email', customer.email);
                                  form.setValue('buyer.phone', customer.phone);
                                  form.setValue('buyer.address', customer.address);
                                  form.setValue('buyer.country', customer.country);
                                }
                              }}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select customer" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {existingCustomers.map(customer => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                      {customer.companyName} - {customer.contactPerson}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="buyer.companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Imports" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="buyer.contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Person *</FormLabel>
                              <FormControl>
                                <Input placeholder="John Smith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="buyer.email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@acme.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="buyer.phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="buyer.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="123 Business St, City, Country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="buyer.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country *</FormLabel>
                            <FormControl>
                              <Input placeholder="United States" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="button" onClick={() => setCurrentStep(2)}>
                        Next: Line Items
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Step 2: Line Items */}
                  <TabsContent value="2" className="space-y-4">
                    <div className="space-y-4">
                      {form.watch('lineItems').map((item, index) => (
                        <Card key={item.id}>
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`lineItems.${index}.productId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Product *</FormLabel>
                                    <Select onValueChange={(value) => {
                                      field.onChange(value);
                                      const product = availableProducts.find(p => p.id === value);
                                      if (product) {
                                        form.setValue(`lineItems.${index}.productName`, product.name);
                                        form.setValue(`lineItems.${index}.hsCode`, product.hsCode);
                                        form.setValue(`lineItems.${index}.unit`, product.unit);
                                        form.setValue(`lineItems.${index}.unitPrice`, product.currentPrice || 0);
                                        updateLineItemTotal(index);
                                      }
                                    }}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {availableProducts.map(product => (
                                          <SelectItem key={product.id} value={product.id}>
                                            {product.name} - ${product.currentPrice || 0}/{product.unit}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`lineItems.${index}.productName`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Product Name *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Product description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`lineItems.${index}.hsCode`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>HS Code</FormLabel>
                                    <FormControl>
                                      <Input placeholder="1234.56.78" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-3 gap-2">
                                <FormField
                                  control={form.control}
                                  name={`lineItems.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Quantity *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          placeholder="100"
                                          {...field}
                                          onChange={(e) => {
                                            field.onChange(parseFloat(e.target.value) || 0);
                                            updateLineItemTotal(index);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`lineItems.${index}.unit`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Unit *</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="KG">KG</SelectItem>
                                          <SelectItem value="MT">MT</SelectItem>
                                          <SelectItem value="LB">LB</SelectItem>
                                          <SelectItem value="PCS">PCS</SelectItem>
                                          <SelectItem value="BOX">BOX</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`lineItems.${index}.unitPrice`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Unit Price *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number"
                                          placeholder="10.00"
                                          {...field}
                                          onChange={(e) => {
                                            field.onChange(parseFloat(e.target.value) || 0);
                                            updateLineItemTotal(index);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="flex justify-between items-center">
                                <div className="text-sm font-medium">
                                  Total: ${form.watch(`lineItems.${index}.totalPrice`)?.toFixed(2) || '0.00'}
                                </div>
                                {form.watch('lineItems').length > 1 && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeLineItem(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addLineItem}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Line Item
                      </Button>

                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          Order Total: ${calculateOrderTotal().toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                        Back
                      </Button>
                      <Button type="button" onClick={() => setCurrentStep(3)}>
                        Next: Shipment Info
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Step 3: Shipment Info */}
                  <TabsContent value="3" className="space-y-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="shipment.portOfLoading"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Port of Loading *</FormLabel>
                              <FormControl>
                                <Input placeholder="Nhava Sheva, India" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="shipment.portOfDischarge"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Port of Discharge *</FormLabel>
                              <FormControl>
                                <Input placeholder="Port of New York, USA" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="shipment.incoterm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Incoterm *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select incoterm" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {INCOTERMS.map(term => (
                                    <SelectItem key={term} value={term}>
                                      {term}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="shipment.expectedShipmentDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Shipment Date *</FormLabel>
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
                        name="shipment.shippingInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shipping Instructions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any special shipping requirements..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                        Back
                      </Button>
                      <Button type="button" onClick={() => setCurrentStep(4)}>
                        Next: Review & Save
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Step 4: Review & Save */}
                  <TabsContent value="4" className="space-y-4">
                    <div className="space-y-6">
                      {/* Order Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold">Buyer Information</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>Company: {form.watch('buyer.companyName')}</div>
                              <div>Contact: {form.watch('buyer.contactPerson')}</div>
                              <div>Email: {form.watch('buyer.email')}</div>
                              <div>Phone: {form.watch('buyer.phone') || '-'}</div>
                              <div>Country: {form.watch('buyer.country')}</div>
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-semibold">Line Items</h4>
                            <div className="space-y-2">
                              {form.watch('lineItems').map((item, index) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <div>
                                    {item.productName} - {item.quantity} {item.unit} @ ${item.unitPrice}
                                  </div>
                                  <div>${item.totalPrice.toFixed(2)}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-semibold">Shipment Information</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>Loading: {form.watch('shipment.portOfLoading')}</div>
                              <div>Discharge: {form.watch('shipment.portOfDischarge')}</div>
                              <div>Incoterm: {form.watch('shipment.incoterm')}</div>
                              <div>Expected: {form.watch('shipment.expectedShipmentDate')}</div>
                            </div>
                          </div>

                          <Separator />

                          <div className="flex justify-between text-lg font-semibold">
                            <div>Total Order Value:</div>
                            <div>${calculateOrderTotal().toFixed(2)}</div>
                          </div>
                        </CardContent>
                      </Card>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Add any additional notes about this order..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
                        Back
                      </Button>
                      <Button type="submit">
                        Create Order
                      </Button>
                    </div>
                  </TabsContent>
                </form>
              </Form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
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
            {ORDER_STATUSES.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Destination Country</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Total Value (USD)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.buyer.companyName}</div>
                        <div className="text-sm text-muted-foreground">{order.buyer.contactPerson}</div>
                      </div>
                    </TableCell>
                    <TableCell>{order.buyer.country}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.lineItems.map(item => item.productName).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${order.totalValue.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1">{order.status}</span>
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(order.createdAt?.toDate() || new Date(), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailSheet(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-[800px] sm:w-[1200px]">
          <SheetHeader>
            <SheetTitle>Order Details - {selectedOrder?.orderNumber}</SheetTitle>
          </SheetHeader>
          {selectedOrder && (
            <div className="mt-6 space-y-6">
              {/* Order Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">Order Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Created on {format(selectedOrder.createdAt?.toDate() || new Date(), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </Button>
                </div>
              </div>

              {/* Buyer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Buyer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Company Name</div>
                      <div className="font-medium">{selectedOrder.buyer.companyName}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Contact Person</div>
                      <div className="font-medium">{selectedOrder.buyer.contactPerson}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Email</div>
                      <div className="font-medium">{selectedOrder.buyer.email}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Phone</div>
                      <div className="font-medium">{selectedOrder.buyer.phone || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Address</div>
                      <div className="font-medium">{selectedOrder.buyer.address || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Country</div>
                      <div className="font-medium">{selectedOrder.buyer.country}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>HS Code</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.hsCode || '-'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">
                            ${item.totalPrice.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 text-right">
                    <div className="text-lg font-semibold">
                      Total: ${selectedOrder.totalValue.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipment Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Port of Loading</div>
                      <div className="font-medium">{selectedOrder.shipment.portOfLoading}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Port of Discharge</div>
                      <div className="font-medium">{selectedOrder.shipment.portOfDischarge}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Incoterm</div>
                      <div className="font-medium">{selectedOrder.shipment.incoterm}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Expected Shipment Date</div>
                      <div className="font-medium">{selectedOrder.shipment.expectedShipmentDate}</div>
                    </div>
                  </div>
                  {selectedOrder.shipment.shippingInstructions && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-muted-foreground">Shipping Instructions</div>
                      <div className="mt-1">{selectedOrder.shipment.shippingInstructions}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-1">{selectedOrder.status}</span>
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Last updated: {format(selectedOrder.updatedAt?.toDate() || new Date(), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ExportOrders;

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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Building, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Upload,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, onSnapshot } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Country flag emojis (same as in LeadPipeline)
const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
  'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Switzerland': '🇨🇭', 'Austria': '🇦🇹',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Finland': '🇫🇮',
  'Poland': '🇵🇱', 'China': '🇨🇳', 'Japan': '🇯🇵', 'South Korea': '🇰🇷',
  'India': '🇮🇳', 'Singapore': '🇸🇬', 'Malaysia': '🇲🇾', 'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳', 'Indonesia': '🇮🇩', 'Philippines': '🇵🇭', 'Brazil': '🇧🇷',
  'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Peru': '🇵🇪', 'Colombia': '🇨🇴',
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'Egypt': '🇪🇬', 'Nigeria': '🇳🇬',
  'Kenya': '🇰🇪', 'Ghana': '🇬🇭', 'Morocco': '🇲🇦', 'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦', 'Israel': '🇮🇱', 'Turkey': '🇹🇷', 'Russia': '🇷🇺',
  'New Zealand': '🇳🇿', 'Pakistan': '🇵🇰', 'Bangladesh': '🇧🇩', 'Sri Lanka': '🇱🇰',
  'Nepal': '🇳🇵', 'Myanmar': '🇲🇲', 'Cambodia': '🇰🇭', 'Laos': '🇱🇦',
  'Mongolia': '🇲🇳', 'Kazakhstan': '🇰🇿', 'Uzbekistan': '🇺🇿', 'Afghanistan': '🇦🇫',
  'Iran': '🇮🇷', 'Iraq': '🇮🇶', 'Syria': '🇸🇾', 'Jordan': '🇯🇴',
  'Lebanon': '🇱🇧', 'Libya': '🇱🇾', 'Tunisia': '🇹🇳', 'Algeria': '🇩🇿',
  'Sudan': '🇸🇩', 'Ethiopia': '🇪🇹', 'Tanzania': '🇹🇿', 'Uganda': '🇺🇬',
  'Rwanda': '🇷🇼', 'DRC': '🇨🇩', 'Congo': '🇨🇬', 'Gabon': '🇬🇦',
  'Cameroon': '🇨🇲', 'Ivory Coast': '🇨🇮', 'Senegal': '🇸🇳', 'Mali': '🇲🇱',
  'Burkina Faso': '🇧🇫', 'Niger': '🇳🇪', 'Chad': '🇹🇩', 'Central African Republic': '🇨🇫',
  'South Sudan': '🇸🇸', 'Eritrea': '🇪🇷', 'Djibouti': '🇩🇯', 'Somalia': '🇸🇴',
  'Mozambique': '🇲🇿', 'Zimbabwe': '🇿🇼', 'Botswana': '🇧🇼', 'Namibia': '🇳🇦',
  'Lesotho': '🇱🇸', 'Eswatini': '🇸🇿', 'Madagascar': '🇲🇬', 'Mauritius': '🇲🇺',
  'Venezuela': '🇻🇪', 'Ecuador': '🇪🇨', 'Bolivia': '🇧🇴', 'Paraguay': '🇵🇾',
  'Uruguay': '🇺🇾', 'Guatemala': '🇬🇹', 'Belize': '🇧🇿', 'El Salvador': '🇸🇻',
  'Honduras': '🇭🇳', 'Nicaragua': '🇳🇮', 'Costa Rica': '🇨🇷', 'Panama': '🇵🇦',
  'Cuba': '🇨🇺', 'Jamaica': '🇯🇲', 'Haiti': '🇭🇹', 'Dominican Republic': '🇩🇴',
  'Puerto Rico': '🇵🇷', 'Trinidad and Tobago': '🇹🇹', 'Barbados': '🇧🇧', 'Bahamas': '🇧🇸',
  'Grenada': '🇬🇩', 'St. Lucia': '🇱🇨', 'St. Vincent': '🇻🇨', 'Dominica': '🇩🇲',
  'Fiji': '🇫🇯', 'Papua New Guinea': '🇵🇬', 'Solomon Islands': '🇸🇧', 'Vanuatu': '🇻🇺',
  'Samoa': '🇼🇸', 'Tonga': '🇹🇴', 'Kiribati': '🇰🇮', 'Tuvalu': '🇹🇻',
  'Nauru': '🇳🇷', 'Palau': '🇵🇼', 'Micronesia': '🇫🇲', 'Marshall Islands': '🇲🇭',
  'Cook Islands': '🇨🇰', 'Niue': '🇳🇺', 'Tokelau': '🇹🇰', 'American Samoa': '🇦🇸',
  'Guam': '🇬🇺', 'Northern Mariana': '🇲🇵', 'Wallis Futuna': '🇼🇫'
};

const INDUSTRIES = [
  'Agriculture', 'Manufacturing', 'Technology', 'Healthcare', 'Finance',
  'Education', 'Retail', 'Construction', 'Transportation', 'Energy',
  'Food & Beverage', 'Textiles', 'Chemicals', 'Pharmaceuticals', 'Automotive',
  'Electronics', 'Telecommunications', 'Media & Entertainment', 'Tourism', 'Other'
];

const COUNTRIES = Object.keys(COUNTRY_FLAGS);

// Form validation schema
const customerFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  industry: z.string().optional(),
  creditLimit: z.string().optional(),
  notes: z.string().optional()
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface Customer {
  id: string;
  companyName: string;
  address?: string;
  city?: string;
  country: string;
  website?: string;
  industry?: string;
  creditLimit?: number;
  notes?: string;
  totalOrders?: number;
  totalBusinessValue?: number;
  primaryContact?: string;
  lastOrderDate?: any;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  orgId: string;
}

interface Order {
  id: string;
  buyerCompanyName: string;
  totalValue: number;
  status: string;
  createdAt: any;
}

interface Contact {
  id: string;
  companyId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

const Customers: React.FC = () => {
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');

  // 5-second timeout fallback
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError(new Error('Permission denied or connection timeout'));
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerContacts, setCustomerContacts] = useState<Contact[]>([]);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      companyName: '',
      address: '',
      city: '',
      country: '',
      website: '',
      industry: '',
      creditLimit: '',
      notes: ''
    }
  });

  // Fetch customers
  useEffect(() => {
    if (!orgId) return;

    const q = query(
      collection(firestore, 'companies'),
      where('orgId', '==', orgId),
      orderBy('companyName', 'asc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          const customersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Customer));
          setCustomers(customersData);
          setLoading(false);
          setError(null);
        } catch (err) {
          setError(err as Error);
          setLoading(false);
        }
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId]);

  // Fetch customer details when selected
  useEffect(() => {
    if (!selectedCustomer || !orgId) return;

    const fetchCustomerDetails = async () => {
      try {
        // Fetch orders for this customer
        const ordersQuery = query(
          collection(firestore, 'exportOrders'),
          where('orgId', '==', orgId),
          where('buyer.companyName', '==', selectedCustomer.companyName),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          buyerCompanyName: doc.data().buyer.companyName,
          totalValue: doc.data().totalValue,
          status: doc.data().status,
          createdAt: doc.data().createdAt
        } as Order));
        setCustomerOrders(ordersData);

        // Fetch contacts for this customer
        const contactsQuery = query(
          collection(firestore, 'contacts'),
          where('orgId', '==', orgId),
          where('company', '==', selectedCustomer.companyName)
        );
        const contactsSnapshot = await getDocs(contactsQuery);
        const contactsData = contactsSnapshot.docs.map(doc => ({
          id: doc.id,
          companyId: doc.data().companyId || '',
          ...doc.data()
        } as Contact));
        setCustomerContacts(contactsData);
      } catch (error) {
        console.error('Error fetching customer details:', error);
      }
    };

    fetchCustomerDetails();
  }, [selectedCustomer, orgId]);

  // Form submission
  const onSubmit = async (data: CustomerFormData) => {
    if (!orgId) return;

    try {
      const customerData = {
        ...data,
        creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : undefined,
        orgId: orgId,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(firestore, 'companies'), customerData);
      toast.success('Customer created successfully');
      setShowAddDialog(false);
      form.reset();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  };

  // CSV Import
  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const customersToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 2) { // At least company name and country
          customersToImport.push({
            companyName: values[0],
            address: values[1] || '',
            country: values[2] || '',
            website: values[3] || '',
            industry: values[4] || '',
            orgId: orgId,
            createdBy: user?.uid,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      // Batch import
      for (const customer of customersToImport) {
        await addDoc(collection(firestore, 'companies'), customer);
      }

      toast.success(`Successfully imported ${customersToImport.length} customers`);
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import CSV');
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchTerm || 
      customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.primaryContact?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry = !selectedCountry || customer.country === selectedCountry;
    const matchesIndustry = !selectedIndustry || customer.industry === selectedIndustry;

    return matchesSearch && matchesCountry && matchesIndustry;
  });

  const getCountryFlag = (country: string) => {
    return COUNTRY_FLAGS[country] || '🌍';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const CustomerCard: React.FC<{ customer: Customer }> = ({ customer }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => {
        setSelectedCustomer(customer);
        setShowDetailSheet(true);
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-100 text-blue-800">
              {getInitials(customer.companyName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{customer.companyName}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
              <span>{getCountryFlag(customer.country)}</span>
              <span>{customer.country}</span>
            </div>
            {customer.industry && (
              <Badge variant="outline" className="mt-2 text-xs">
                {customer.industry}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Total Orders</div>
            <div className="font-medium">{customer.totalOrders || 0}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Total Value</div>
            <div className="font-medium">${(customer.totalBusinessValue || 0).toLocaleString()}</div>
          </div>
        </div>
        
        {customer.primaryContact && (
          <div className="mt-4 text-sm">
            <div className="text-muted-foreground">Primary Contact</div>
            <div className="font-medium">{customer.primaryContact}</div>
          </div>
        )}
        
        {customer.lastOrderDate && (
          <div className="mt-2 text-sm text-muted-foreground">
            Last order: {format(customer.lastOrderDate?.toDate() || new Date(), 'MMM dd, yyyy')}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CustomerListItem: React.FC<{ customer: Customer }> = ({ customer }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => {
        setSelectedCustomer(customer);
        setShowDetailSheet(true);
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-800 text-sm">
                {getInitials(customer.companyName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{customer.companyName}</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{getCountryFlag(customer.country)}</span>
                <span>{customer.country || 'N/A'}</span>
                {customer.industry && (
                  <Badge variant="outline" className="text-xs">
                    {customer.industry}
                  </Badge>
                )}
                {!customer.industry && (
                  <Badge variant="outline" className="text-xs">
                    N/A
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">${(customer.totalBusinessValue || 0).toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">{customer.totalOrders || 0} orders</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="font-medium text-gray-300">Could not load data</p>
          <p className="text-sm mt-1">Check your permissions or try refreshing.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground">Manage your customer database</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
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
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => document.getElementById('csv-import')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <input
            id="csv-import"
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Business St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNTRIES.map(country => (
                                <SelectItem key={country} value={country}>
                                  {getCountryFlag(country)} {country}
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
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INDUSTRIES.map(industry => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
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
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Limit (USD)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="10000" {...field} />
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
                            placeholder="Add any additional notes about this customer..."
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
                      Create Customer
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Countries</SelectItem>
            {COUNTRIES.map(country => (
              <SelectItem key={country} value={country}>
                {getCountryFlag(country)} {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Industries</SelectItem>
            {INDUSTRIES.map(industry => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Customers Display */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Building className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start building your customer database by adding your first customer. Track contacts, orders, and communication history.
          </p>
          <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
            <DialogTrigger asChild>
              <Button disabled={!user}>
                <Plus className="mr-2" />
                Add Your First Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <NewCustomerForm onSuccess={() => setShowNewCustomerDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomers.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <CustomerListItem key={customer.id} customer={customer} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Customer Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-[800px] sm:w-[1200px]">
          <SheetHeader>
            <SheetTitle>Customer Details</SheetTitle>
          </SheetHeader>
          {selectedCustomer && (
            <div className="mt-6 space-y-6">
              {/* Company Header */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-lg">
                    {getInitials(selectedCustomer.companyName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedCustomer.companyName}</h2>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <span>{getCountryFlag(selectedCustomer.country)}</span>
                    <span>{selectedCustomer.country || 'N/A'}</span>
                  </div>
                  {selectedCustomer.industry && (
                    <Badge variant="outline" className="mt-2">
                      {selectedCustomer.industry}
                    </Badge>
                  )}
                  {!selectedCustomer.industry && (
                    <Badge variant="outline" className="mt-2">
                      N/A
                    </Badge>
                  )}
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{selectedCustomer.totalOrders || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Orders</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                          ${(selectedCustomer.totalBusinessValue || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Value</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                          {selectedCustomer.totalOrders ? 
                            Math.round((selectedCustomer.totalBusinessValue || 0) / selectedCustomer.totalOrders).toLocaleString() : 
                            0
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Order Value</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                          {selectedCustomer.creditLimit ? 
                            `$${selectedCustomer.creditLimit.toLocaleString()}` : 
                            'Not Set'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">Credit Limit</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Company Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Company Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                          <div>{selectedCustomer.address || '-'}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">City</Label>
                          <div>{selectedCustomer.city || '-'}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                          <div>
                            {selectedCustomer.website ? (
                              <a href={selectedCustomer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {selectedCustomer.website}
                              </a>
                            ) : '-'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Industry</Label>
                          <div>{selectedCustomer.industry || '-'}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contacts" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Contacts ({customerContacts.length})</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>
                  {customerContacts.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        No contacts found for this customer
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {customerContacts.map((contact) => (
                        <Card key={contact.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-sm text-muted-foreground">{contact.role || '-'}</div>
                                <div className="flex items-center space-x-4 mt-2 text-sm">
                                  {contact.email && (
                                    <div className="flex items-center space-x-1">
                                      <Mail className="h-3 w-3" />
                                      <span>{contact.email}</span>
                                    </div>
                                  )}
                                  {contact.phone && (
                                    <div className="flex items-center space-x-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{contact.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {contact.isPrimary && (
                                <Badge variant="default">Primary</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Orders ({customerOrders.length})</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Order
                    </Button>
                  </div>
                  {customerOrders.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        No orders found for this customer
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {customerOrders.map((order) => (
                        <Card key={order.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Order #{order.id.slice(-6).toUpperCase()}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(order.createdAt?.toDate() || new Date(), 'MMM dd, yyyy')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">${order.totalValue.toLocaleString()}</div>
                                <Badge variant="outline">{order.status}</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedCustomer.notes ? (
                        <p className="text-sm">{selectedCustomer.notes}</p>
                      ) : (
                        <p className="text-muted-foreground">No notes added for this customer</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Customers;











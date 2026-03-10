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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Star,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, onSnapshot, limit } from 'firebase/firestore';

import { useFirestore, useUser } from '@/firebase';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Country flag emojis (same as in other modules)
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
  'Fiji': '🇫🇯', 'Papua New Guinea': '🇵🇬', 'Solomon Islands': '🇸🇨', 'Vanuatu': '🇻🇺',
  'Samoa': '🇼🇸', 'Tonga': '🇹🇴', 'Kiribati': '🇰🇮', 'Tuvalu': '🇹🇻',
  'Nauru': '🇳🇷', 'Palau': '🇵🇼', 'Micronesia': '🇫🇲', 'Marshall Islands': '🇲🇭',
  'Cook Islands': '🇨🇰', 'Niue': '🇳🇺', 'Tokelau': '🇹🇰', 'American Samoa': '🇦🇸',
  'Guam': '🇬🇺', 'Northern Mariana': '🇲🇵', 'Wallis Futuna': '🇼🇫'
};

const COUNTRIES = Object.keys(COUNTRY_FLAGS);

// Form validation schema
const buyerFormSchema = z.object({
  type: z.enum(['Buyer', 'Agent']),
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  specialization: z.string().optional(),
  commissionRate: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
});

type BuyerFormData = z.infer<typeof buyerFormSchema>;

interface Buyer {
  id: string;
  type: 'Buyer' | 'Agent';
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  website?: string;
  specialization?: string;
  commissionRate?: number;
  rating?: number;
  notes?: string;
  totalOrders?: number;
  totalValue?: number;
  lastOrderDate?: any;
  status: 'Active' | 'Inactive' | 'Prospect';
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  orgId: string;
}

const ExportBuyers: React.FC = () => {
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
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'Buyer' | 'Agent' | ''>('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const form = useForm<BuyerFormData>({
    resolver: zodResolver(buyerFormSchema),
    defaultValues: {
      type: 'Buyer',
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      website: '',
      specialization: '',
      commissionRate: '',
      rating: 5,
      notes: ''
    }
  });

  // Fetch buyers
  useEffect(() => {
    if (!orgId) return;

    const q = query(
      collection(firestore, 'buyers'),
      where('orgId', '==', user.orgId),
      orderBy('companyName', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const buyersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Buyer));
      setBuyers(buyersData);
      setLoading(false);
    });

    return unsubscribe;
  }, [orgId]);

  // Form submission
  const onSubmit = async (data: BuyerFormData) => {
    if (!orgId) return;

    try {
      const buyerData = {
        ...data,
        commissionRate: data.commissionRate ? parseFloat(data.commissionRate) : undefined,
        orgId: user.orgId,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'Active'
      };

      await addDoc(collection(firestore, 'buyers'), buyerData);
      toast.success(`${data.type} created successfully`);
      setShowAddDialog(false);
      form.reset();
    } catch (error) {
      console.error('Error creating buyer:', error);
      toast.error('Failed to create buyer');
    }
  };

  // Toggle status
  const toggleStatus = async (buyerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    
    try {
      await updateDoc(doc(firestore, 'buyers', buyerId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Delete buyer
  const deleteBuyer = async (buyerId: string) => {
    try {
      await deleteDoc(doc(firestore, 'buyers', buyerId));
      toast.success('Buyer deleted successfully');
    } catch (error) {
      console.error('Error deleting buyer:', error);
      toast.error('Failed to delete buyer');
    }
  };

  // Filter buyers
  const filteredBuyers = buyers.filter(buyer => {
    const matchesSearch = !searchTerm || 
      buyer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !selectedType || buyer.type === selectedType;
    const matchesCountry = !selectedCountry || buyer.country === selectedCountry;

    return matchesSearch && matchesType && matchesCountry;
  });

  const getCountryFlag = (country: string) => {
    return COUNTRY_FLAGS[country] || '🌍';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const BuyerCard: React.FC<{ buyer: Buyer }> = ({ buyer }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            setSelectedBuyer(buyer);
            setShowDetailDialog(true);
          }}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-100 text-blue-800">
              {getInitials(buyer.companyName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg truncate">{buyer.companyName}</h3>
              <Badge variant={buyer.type === 'Buyer' ? 'default' : 'secondary'}>
                {buyer.type}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-3 w-3 text-muted-foreground" />
                <span>{buyer.contactPerson}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span>{getCountryFlag(buyer.country)} {buyer.country}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-blue-600">{buyer.email}</span>
              </div>
              
              {buyer.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{buyer.phone}</span>
                </div>
              )}
            </div>
            
            {buyer.specialization && (
              <div className="mt-3">
                <Badge variant="outline" className="text-xs">
                  {buyer.specialization}
                </Badge>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                {renderStars(buyer.rating)}
                <Badge variant={buyer.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                  {buyer.status}
                </Badge>
              </div>
              
              {buyer.totalOrders && (
                <div className="text-right text-sm">
                  <div className="font-medium">{buyer.totalOrders} orders</div>
                  <div className="text-muted-foreground">
                    ${buyer.totalValue?.toLocaleString()}
                  </div>
                </div>
              )}
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
            <h1 className="text-3xl font-bold">Buyers & Agents</h1>
            <p className="text-muted-foreground">Manage your buyers and agents directory</p>
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
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
          <h1 className="text-3xl font-bold">Buyers & Agents</h1>
          <p className="text-muted-foreground">Manage your buyers and agents directory</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Buyer/Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Buyer/Agent</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Buyer">Buyer</SelectItem>
                          <SelectItem value="Agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
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
                </div>

                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input placeholder="Electronics, Textiles, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('type') === 'Agent' && (
                  <FormField
                    control={form.control}
                    name="commissionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Rate (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            placeholder="5.0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[5, 4, 3, 2, 1].map(rating => (
                            <SelectItem key={rating} value={rating.toString()}>
                              {renderStars(rating)} ({rating})
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
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create {form.watch('type')}
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
            placeholder="Search buyers and agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={(value: 'Buyer' | 'Agent' | '') => setSelectedType(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="Buyer">Buyers</SelectItem>
            <SelectItem value="Agent">Agents</SelectItem>
          </SelectContent>
        </Select>
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
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Buyers</p>
                <p className="text-2xl font-bold">{buyers.filter(b => b.type === 'Buyer').length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{buyers.filter(b => b.type === 'Agent').length}</p>
              </div>
              <Building className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{buyers.filter(b => b.status === 'Active').length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ${buyers.reduce((sum, b) => sum + (b.totalValue || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buyers Grid */}
      {filteredBuyers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No buyers or agents found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuyers.map((buyer) => (
            <BuyerCard key={buyer.id} buyer={buyer} />
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buyer/Agent Details</DialogTitle>
          </DialogHeader>
          {selectedBuyer && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-lg">
                    {getInitials(selectedBuyer.companyName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedBuyer.companyName}</h2>
                  <div className="flex items-center space-x-2">
                    <Badge variant={selectedBuyer.type === 'Buyer' ? 'default' : 'secondary'}>
                      {selectedBuyer.type}
                    </Badge>
                    <Badge variant={selectedBuyer.status === 'Active' ? 'default' : 'secondary'}>
                      {selectedBuyer.status}
                    </Badge>
                    {renderStars(selectedBuyer.rating)}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="contact">Contact Info</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Contact Person</Label>
                          <div>{selectedBuyer.contactPerson}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Country</Label>
                          <div className="flex items-center space-x-2">
                            <span>{getCountryFlag(selectedBuyer.country)}</span>
                            <span>{selectedBuyer.country}</span>
                          </div>
                        </div>
                        {selectedBuyer.specialization && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Specialization</Label>
                            <div>{selectedBuyer.specialization}</div>
                          </div>
                        )}
                        {selectedBuyer.type === 'Agent' && selectedBuyer.commissionRate && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Commission Rate</Label>
                            <div>{selectedBuyer.commissionRate}%</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Total Orders</Label>
                          <div className="text-2xl font-bold">{selectedBuyer.totalOrders || 0}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Total Value</Label>
                          <div className="text-2xl font-bold">
                            ${(selectedBuyer.totalValue || 0).toLocaleString()}
                          </div>
                        </div>
                        {selectedBuyer.lastOrderDate && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Last Order</Label>
                            <div>{format(selectedBuyer.lastOrderDate.toDate(), 'MMM dd, yyyy')}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <a href={`mailto:${selectedBuyer.email}`} className="text-blue-600 hover:underline">
                              {selectedBuyer.email}
                            </a>
                          </div>
                        </div>
                        {selectedBuyer.phone && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-green-500" />
                              <a href={`tel:${selectedBuyer.phone}`} className="text-green-600 hover:underline">
                                {selectedBuyer.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                          <div>{selectedBuyer.address || '-'}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">City</Label>
                          <div>{selectedBuyer.city || '-'}</div>
                        </div>
                      </div>
                      
                      {selectedBuyer.website && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                          <div>
                            <a href={selectedBuyer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {selectedBuyer.website}
                            </a>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        Performance charts and analytics would go here
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedBuyer.notes ? (
                        <p className="text-sm">{selectedBuyer.notes}</p>
                      ) : (
                        <p className="text-muted-foreground">No notes added</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => toggleStatus(selectedBuyer.id, selectedBuyer.status)}
                >
                  {selectedBuyer.status === 'Active' ? (
                    <><UserX className="h-4 w-4 mr-2" /> Deactivate</>
                  ) : (
                    <><UserCheck className="h-4 w-4 mr-2" /> Activate</>
                  )}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => deleteBuyer(selectedBuyer.id)}
                >
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

export default ExportBuyers;










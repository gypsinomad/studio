'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Archive, 
  UserPlus,
  Phone,
  Mail,
  Globe,
  Building,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckSquare
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, limit, startAfter, onSnapshot } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { format } from 'date-fns';
import { debounce } from 'lodash';
import { toast } from 'sonner';

// Country list for dropdown
const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Italy", "Spain", "Netherlands", "Belgium",
  "Switzerland", "Austria", "Sweden", "Norway", "Denmark", "Finland", "Poland", "Czech Republic", "Hungary", "Romania",
  "Russia", "China", "Japan", "South Korea", "India", "Singapore", "Malaysia", "Thailand", "Vietnam", "Indonesia",
  "Philippines", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Myanmar", "Cambodia", "Laos", "Brunei", "Mongolia",
  "Kazakhstan", "Uzbekistan", "Turkmenistan", "Kyrgyzstan", "Tajikistan", "Afghanistan", "Iran", "Iraq", "Syria", "Lebanon",
  "Jordan", "Israel", "Palestine", "Saudi Arabia", "Yemen", "Oman", "UAE", "Qatar", "Bahrain", "Kuwait",
  "Egypt", "Libya", "Tunisia", "Algeria", "Morocco", "Sudan", "Ethiopia", "Kenya", "Tanzania", "Uganda",
  "Rwanda", "Burundi", "DRC", "Congo", "Gabon", "Cameroon", "Nigeria", "Ghana", "Ivory Coast", "Senegal",
  "Mali", "Burkina Faso", "Niger", "Chad", "Central African Republic", "South Sudan", "Eritrea", "Djibouti", "Somalia", "Mozambique",
  "Zimbabwe", "Botswana", "Namibia", "South Africa", "Lesotho", "Eswatini", "Madagascar", "Mauritius", "Seychelles", "Comoros",
  "Brazil", "Argentina", "Chile", "Peru", "Colombia", "Venezuela", "Ecuador", "Bolivia", "Paraguay", "Uruguay",
  "Mexico", "Guatemala", "Belize", "El Salvador", "Honduras", "Nicaragua", "Costa Rica", "Panama", "Cuba", "Jamaica",
  "Haiti", "Dominican Republic", "Puerto Rico", "Trinidad and Tobago", "Barbados", "Bahamas", "Grenada", "St. Lucia", "St. Vincent", "Dominica",
  "New Zealand", "Fiji", "Papua New Guinea", "Solomon Islands", "Vanuatu", "Samoa", "Tonga", "Kiribati", "Tuvalu", "Nauru",
  "Palau", "Micronesia", "Marshall Islands", "Cook Islands", "Niue", "Tokelau", "American Samoa", "Guam", "Northern Mariana", "Wallis Futuna"
];

const LEAD_SOURCES = ["WhatsApp", "Email", "Direct", "Web", "Referral", "Other"];
const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];
const LEAD_PRIORITIES = ["High", "Medium", "Low"];

// Form validation schema
const leadFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  company: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  source: z.string().min(1, "Source is required"),
  status: z.string().min(1, "Status is required"),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  expectedValue: z.string().optional()
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface Lead {
  id: string;
  fullName: string;
  company?: string;
  country: string;
  phone?: string;
  email?: string;
  source: string;
  status: string;
  assignedTo?: string;
  notes?: string;
  expectedValue?: number;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  orgId: string;
}

interface ActivityLog {
  id: string;
  leadId: string;
  type: string;
  message: string;
  userId: string;
  userName: string;
  timestamp: any;
}

const Leads: React.FC = () => {
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sources: [] as string[],
    statuses: [] as string[],
    assignedTo: [] as string[],
    dateRange: { start: '', end: '' }
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      fullName: '',
      company: '',
      country: '',
      phone: '',
      email: '',
      source: '',
      status: 'New',
      assignedTo: '',
      notes: '',
      expectedValue: ''
    }
  });

  // Fetch leads
  const fetchLeads = useCallback(async (reset = false) => {
    if (!orgId) return;

    setLoading(true);
    try {
      let q = query(
        collection(firestore, 'leads'),
        where('orgId', '==', orgId),
        orderBy(sortBy, sortOrder),
        limit(25)
      );

      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const newLeads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Lead));

      if (reset) {
        setLeads(newLeads);
      } else {
        setLeads(prev => [...prev, ...newLeads]);
      }

      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 25);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [orgId, sortBy, sortOrder, lastDoc]);

  // Real-time updates
  useEffect(() => {
    if (!orgId) return;

    const q = query(
      collection(firestore, 'leads'),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedLeads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Lead));
      setLeads(updatedLeads);
      setLoading(false);
    });

    return unsubscribe;
  }, [orgId]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      // Implement search logic here
      console.log('Searching for:', term);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Form submission
  const onSubmit = async (data: LeadFormData) => {
    if (!orgId) return;

    try {
      const leadData = {
        ...data,
        expectedValue: data.expectedValue ? parseFloat(data.expectedValue) : undefined,
        orgId: orgId,
        createdBy: user?.uid || 'unknown',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(firestore, 'leads'), leadData);
      
      // Log activity
      await addDoc(collection(firestore, 'activity_logs'), {
        orgId: orgId,
        type: 'lead_created',
        message: `Lead "${data.companyName}" was created`,
        action: 'create',
        collectionName: 'leads',
        docId: 'new',
        userId: user?.uid || '',
        timestamp: new Date()
      });
      
      toast.success('Lead created successfully');
      setShowAddDialog(false);
      form.reset();
      fetchLeads(true);
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
    }
  };

  // Status change
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateDoc(doc(firestore, 'leads', leadId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedLeads.length === 0) {
      toast.error('Please select leads first');
      return;
    }

    try {
      const batch = selectedLeads.map(leadId => 
        updateDoc(doc(firestore, 'leads', leadId), {
          status: action === 'archive' ? 'Archived' : action,
          updatedAt: new Date()
        })
      );

      await Promise.all(batch);
      toast.success(`Bulk ${action} completed successfully`);
      setSelectedLeads([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error(`Failed to ${action} leads`);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Company', 'Country', 'Source', 'Status', 'Assigned To', 'Email', 'Phone', 'Expected Value', 'Created Date'];
    const csvData = leads.map(lead => [
      lead.fullName,
      lead.company || '',
      lead.country,
      lead.source,
      lead.status,
      lead.assignedTo || '',
      lead.email || '',
      lead.phone || '',
      lead.expectedValue || '',
      format(lead.createdAt?.toDate() || new Date(), 'yyyy-MM-dd')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.country.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource = filters.sources.length === 0 || filters.sources.includes(lead.source);
    const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(lead.status);
    const matchesAssigned = filters.assignedTo.length === 0 || filters.assignedTo.includes(lead.assignedTo || '');

    return matchesSearch && matchesSource && matchesStatus && matchesAssigned;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Qualified': 'bg-green-100 text-green-800',
      'Proposal Sent': 'bg-purple-100 text-purple-800',
      'Negotiation': 'bg-orange-100 text-orange-800',
      'Won': 'bg-emerald-100 text-emerald-800',
      'Lost': 'bg-red-100 text-red-800',
      'Archived': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'WhatsApp': 'bg-green-100 text-green-800',
      'Email': 'bg-blue-100 text-blue-800',
      'Direct': 'bg-purple-100 text-purple-800',
      'Web': 'bg-orange-100 text-orange-800',
      'Referral': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage your sales leads and pipeline</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
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
                                {country}
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (WhatsApp)</FormLabel>
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expectedValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Value (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LEAD_SOURCES.map(source => (
                              <SelectItem key={source} value={source}>
                                {source}
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
                            {LEAD_STATUSES.map(status => (
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
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input placeholder="Assign to user" {...field} />
                      </FormControl>
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
                          placeholder="Add any additional notes about this lead..."
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
                    Create Lead
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
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button
          variant="outline"
          onClick={exportToCSV}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Source</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LEAD_SOURCES.map(source => (
                  <Badge
                    key={source}
                    variant={filters.sources.includes(source) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        sources: prev.sources.includes(source)
                          ? prev.sources.filter(s => s !== source)
                          : [...prev.sources, source]
                      }));
                    }}
                  >
                    {source}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LEAD_STATUSES.map(status => (
                  <Badge
                    key={status}
                    variant={filters.statuses.includes(status) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        statuses: prev.statuses.includes(status)
                          ? prev.statuses.filter(s => s !== status)
                          : [...prev.statuses, status]
                      }));
                    }}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedLeads.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {selectedLeads.length} leads selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('Qualified')}
                >
                  Mark as Qualified
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('Lost')}
                >
                  Mark as Lost
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('archive')}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLeads([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLeads(filteredLeads.map(lead => lead.id));
                        } else {
                          setSelectedLeads([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="w-12 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLeads(prev => [...prev, lead.id]);
                          } else {
                            setSelectedLeads(prev => prev.filter(id => id !== lead.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{lead.fullName}</TableCell>
                    <TableCell>{lead.company || '-'}</TableCell>
                    <TableCell>{lead.country}</TableCell>
                    <TableCell>
                      <Badge className={getSourceColor(lead.source)}>
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.status}
                        onValueChange={(value) => handleStatusChange(lead.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map(status => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{lead.assignedTo || '-'}</TableCell>
                    <TableCell>{lead.lastContactDate ? format(lead.lastContactDate?.toDate() || new Date(), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell>
                      {format(lead.createdAt?.toDate() || new Date(), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLead(lead);
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

      {/* Lead Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-[600px] sm:w-[800px]">
          <SheetHeader>
            <SheetTitle>Lead Details</SheetTitle>
          </SheetHeader>
          {selectedLead && (
            <div className="mt-6 space-y-6">
              {/* Lead Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Lead Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{selectedLead.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                    <p className="font-medium">{selectedLead.company || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Country</Label>
                    <p className="font-medium">{selectedLead.country}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedLead.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedLead.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Expected Value</Label>
                    <p className="font-medium">${selectedLead.expectedValue || 0}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Status and Assignment */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Status & Assignment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-2">
                      <Badge className={getStatusColor(selectedLead.status)}>
                        {selectedLead.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Source</Label>
                    <div className="mt-2">
                      <Badge className={getSourceColor(selectedLead.source)}>
                        {selectedLead.source}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                    <p className="font-medium">{selectedLead.assignedTo || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                    <p className="font-medium">
                      {format(selectedLead.createdAt?.toDate() || new Date(), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notes */}
              {selectedLead.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notes</h3>
                  <p className="text-sm">{selectedLead.notes}</p>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Lead
                </Button>
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convert to Customer
                </Button>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Leads;











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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  Grid, 
  List, 
  Mail, 
  Phone, 
  Building, 
  User, 
  Tag, 
  Edit,
  Trash2,
  Eye,
  MessageCircle
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, onSnapshot } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { toast } from 'sonner';

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional()
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface Contact {
  id: string;
  name: string;
  company?: string;
  role?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  tags?: string[];
  notes?: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  orgId: string;
}

const CONTACT_TAGS = [
  'VIP', 'Decision Maker', 'Technical', 'Finance', 'Purchasing', 'Logistics',
  'Marketing', 'Sales', 'Support', 'Partner', 'Supplier', 'Prospect'
];

const Contacts: React.FC = () => {
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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      company: '',
      role: '',
      phone: '',
      email: '',
      whatsapp: '',
      tags: [],
      notes: ''
    }
  });

  // Fetch contacts
  useEffect(() => {
    if (!orgId) return;

    const q = query(
      collection(firestore, 'contacts'),
      where('orgId', '==', orgId),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          const contactsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Contact));
          setContacts(contactsData);
          
          // Extract unique companies
          const uniqueCompanies = [...new Set(contactsData.map(c => c.company).filter((c): c is string => Boolean(c)))];
          setCompanies(uniqueCompanies);
          
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

  // Form submission
  const onSubmit = async (data: ContactFormData) => {
    if (!orgId) return;

    try {
      const contactData = {
        ...data,
        orgId: orgId,
        createdBy: user?.uid || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(firestore, 'contacts'), contactData);
      toast.success('Contact created successfully');
      setShowAddDialog(false);
      form.reset();
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Failed to create contact');
    }
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm || 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCompany = !selectedCompany || contact.company === selectedCompany;
    const matchesTags = selectedTags.length === 0 || 
      (contact.tags && selectedTags.some(tag => contact.tags!.includes(tag)));

    return matchesSearch && matchesCompany && matchesTags;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-orange-100 text-orange-800'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const ContactCard: React.FC<{ contact: Contact }> = ({ contact }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => {
        setSelectedContact(contact);
        setShowDetailSheet(true);
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className={getAvatarColor(contact.name)}>
              {getInitials(contact.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{contact.name}</h3>
            {contact.company && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                <Building className="h-3 w-3" />
                <span>{contact.company}</span>
              </div>
            )}
            {contact.role && (
              <div className="text-sm text-muted-foreground">{contact.role}</div>
            )}
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          {contact.email && (
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-blue-500" />
              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                {contact.email}
              </a>
            </div>
          )}
          
          {contact.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-green-500" />
              <a href={`tel:${contact.phone}`} className="text-green-600 hover:underline">
                {contact.phone}
              </a>
            </div>
          )}
          
          {contact.whatsapp && (
            <div className="flex items-center space-x-2 text-sm">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <a 
                href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline"
              >
                WhatsApp
              </a>
            </div>
          )}
        </div>
        
        {contact.tags && contact.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ContactListItem: React.FC<{ contact: Contact }> = ({ contact }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => {
        setSelectedContact(contact);
        setShowDetailSheet(true);
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={getAvatarColor(contact.name)}>
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{contact.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {contact.company && (
                  <>
                    <Building className="h-3 w-3" />
                    <span>{contact.company}</span>
                  </>
                )}
                {contact.role && <span>• {contact.role}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                <Mail className="h-4 w-4" />
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="text-green-600 hover:underline">
                <Phone className="h-4 w-4" />
              </a>
            )}
            {contact.whatsapp && (
              <a 
                href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        {contact.tags && contact.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
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
            <h1 className="text-3xl font-bold">Contacts</h1>
            <p className="text-muted-foreground">Manage your contact database</p>
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
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your contact database</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies.map(company => (
                              <SelectItem key={company} value={company}>
                                {company}
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
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input placeholder="Sales Manager" {...field} />
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

                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp (different from phone)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {CONTACT_TAGS.map(tag => (
                          <Badge
                            key={tag}
                            variant={field.value?.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const currentTags = field.value || [];
                              if (currentTags.includes(tag)) {
                                field.onChange(currentTags.filter(t => t !== tag));
                              } else {
                                field.onChange([...currentTags, tag]);
                              }
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
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
                          placeholder="Add any additional notes about this contact..."
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
                    Create Contact
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
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Companies</SelectItem>
            {companies.map(company => (
              <SelectItem key={company} value={company}>
                {company}
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

      {/* Tag Filters */}
      {selectedTags.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium">Tags:</span>
                {selectedTags.map(tag => (
                  <Badge
                    key={tag}
                    variant="default"
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTags([])}
              >
                Clear Tags
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Tags */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">Filter by tags:</span>
            {CONTACT_TAGS.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contacts Display */}
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Build your contact database by adding people you work with. Track communication history and manage relationships.
          </p>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button disabled={!user}>
                <Plus className="mr-2" />
                Add Your First Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <ContactForm onSuccess={() => setShowAddDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <ContactListItem key={contact.id} contact={contact} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Contact Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-[600px] sm:w-[800px]">
          <SheetHeader>
            <SheetTitle>Contact Details</SheetTitle>
          </SheetHeader>
          {selectedContact && (
            <div className="mt-6 space-y-6">
              {/* Contact Header */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className={getAvatarColor(selectedContact.name)}>
                    {getInitials(selectedContact.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedContact.name}</h2>
                  {selectedContact.company && (
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{selectedContact.company}</span>
                    </div>
                  )}
                  {selectedContact.role && (
                    <div className="text-muted-foreground">{selectedContact.role}</div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedContact.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <a href={`mailto:${selectedContact.email}`} className="text-blue-600 hover:underline">
                        {selectedContact.email}
                      </a>
                    </div>
                  )}
                  
                  {selectedContact.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-green-500" />
                      <a href={`tel:${selectedContact.phone}`} className="text-green-600 hover:underline">
                        {selectedContact.phone}
                      </a>
                    </div>
                  )}
                  
                  {selectedContact.whatsapp && (
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <a 
                        href={`https://wa.me/${selectedContact.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        {selectedContact.whatsapp}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              {selectedContact.tags && selectedContact.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedContact.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedContact.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedContact.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Contact
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

export default Contacts;










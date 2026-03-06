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
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Search, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  File, 
  FileText, 
  Image, 
  FileSpreadsheet,
  FileCheck,
  Calendar,
  User,
  Filter
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Form validation schema
const documentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
  linkedTo: z.string().optional(),
  linkedId: z.string().optional()
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

interface Document {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  linkedTo?: string;
  linkedId?: string;
  createdAt: any;
  updatedAt: any;
  orgId: string;
}

const DOCUMENT_CATEGORIES = [
  'Contracts', 'Invoices', 'Purchase Orders', 'Shipping Documents',
  'Product Catalogs', 'Technical Specifications', 'Compliance',
  'Marketing Materials', 'Legal Documents', 'Financial Reports',
  'Other'
];

const DOCUMENT_TAGS = [
  'Urgent', 'Draft', 'Final', 'Confidential', 'Public',
  'Internal', 'External', 'Archive', 'Active', 'Pending'
];

const LINK_TYPES = ['Lead', 'Order', 'Contact', 'Company'];

const Documents: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [linkedRecords, setLinkedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      tags: [],
      linkedTo: '',
      linkedId: ''
    }
  });

  // Fetch documents
  useEffect(() => {
    if (!user?.orgId) return;

    const q = query(
      collection(db, 'documents'),
      where('orgId', '==', user.orgId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const documentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Document));
      setDocuments(documentsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.orgId]);

  // Fetch linked records based on type
  useEffect(() => {
    const linkedType = form.watch('linkedTo');
    if (!linkedType || !user?.orgId) {
      setLinkedRecords([]);
      return;
    }

    const fetchLinkedRecords = async () => {
      try {
        let collectionName = '';
        switch (linkedType) {
          case 'Lead':
            collectionName = 'leads';
            break;
          case 'Order':
            collectionName = 'exportOrders';
            break;
          case 'Contact':
            collectionName = 'contacts';
            break;
          case 'Company':
            collectionName = 'companies';
            break;
        }

        if (!collectionName) return;

        const q = query(
          collection(db, collectionName),
          where('orgId', '==', user.orgId),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLinkedRecords(records);
      } catch (error) {
        console.error('Error fetching linked records:', error);
      }
    };

    fetchLinkedRecords();
  }, [form.watch('linkedTo'), user?.orgId]);

  // File upload simulation
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    form.setValue('title', file.name.replace(/\.[^/.]+$/, ''));
  };

  // Form submission
  const onSubmit = async (data: DocumentFormData) => {
    if (!user?.orgId || !selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate file upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(uploadInterval);
      setUploadProgress(100);

      // Create document record
      const documentData = {
        ...data,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        fileUrl: `https://example.com/files/${selectedFile.name}`, // Mock URL
        uploadedBy: user.displayName || user.email || 'Unknown',
        orgId: user.orgId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'documents'), documentData);
      
      toast.success('Document uploaded successfully');
      setShowAddDialog(false);
      form.reset();
      setSelectedFile(null);
      setUploadProgress(0);
      setUploading(false);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
      setUploading(false);
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

  // Delete document
  const deleteDocument = async (documentId: string) => {
    try {
      await deleteDoc(doc(db, 'documents', documentId));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    const matchesTags = selectedTags.length === 0 || 
      (doc.tags && selectedTags.some(tag => doc.tags!.includes(tag)));

    return matchesSearch && matchesCategory && matchesTags;
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <Image className="h-8 w-8 text-green-500" />;
    if (fileType.includes('pdf')) return <FileCheck className="h-8 w-8 text-red-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    if (fileType.includes('text') || fileType.includes('document')) return <FileText className="h-8 w-8 text-blue-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const DocumentCard: React.FC<{ document: Document }> = ({ document }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getFileIcon(document.fileType)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{document.title}</h3>
            <p className="text-sm text-muted-foreground">{document.fileName}</p>
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              <span>{formatFileSize(document.fileSize)}</span>
              <span>•</span>
              <span>{format(document.createdAt.toDate(), 'MMM dd, yyyy')}</span>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{document.category}</Badge>
                {document.tags && document.tags.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {document.tags[0]}
                    {document.tags.length > 1 && ` +${document.tags.length - 1}`}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => deleteDocument(document.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground">Manage your document repository</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage your document repository</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label>File *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">
                      Click to select a file or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum file size: 10MB
                    </p>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button type="button" variant="outline" className="mt-4">
                        Select File
                      </Button>
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <File className="h-4 w-4" />
                      <span className="text-sm">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                  )}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter document title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add document description..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DOCUMENT_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
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
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {DOCUMENT_TAGS.map(tag => (
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select record type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LINK_TYPES.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
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
                    name="linkedId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Record</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select record" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {linkedRecords.map(record => (
                              <SelectItem key={record.id} value={record.id}>
                                {record.fullName || record.companyName || record.title || record.id.slice(-6).toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedFile || uploading}>
                    {uploading ? 'Uploading...' : 'Upload Document'}
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
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {DOCUMENT_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            {DOCUMENT_TAGS.map(tag => (
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

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No documents found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;

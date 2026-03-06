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
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  Box, 
  Tag, 
  Filter,
  Download,
  Copy,
  Save,
  X
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Form validation schema
const itemFormSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  costPrice: z.number().min(0, "Cost price must be positive"),
  weight: z.number().min(0, "Weight must be positive").optional(),
  dimensions: z.string().optional(),
  hsCode: z.string().optional(),
  minOrderQuantity: z.number().min(1, "Min order quantity must be positive").optional(),
  stockQuantity: z.number().min(0, "Stock quantity must be positive").optional(),
  reorderLevel: z.number().min(0, "Reorder level must be positive").optional(),
  supplier: z.string().optional(),
  notes: z.string().optional()
});

type ItemFormData = z.infer<typeof itemFormSchema>;

interface Item {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  unitPrice: number;
  costPrice: number;
  weight?: number;
  dimensions?: string;
  hsCode?: string;
  minOrderQuantity?: number;
  stockQuantity?: number;
  reorderLevel?: number;
  supplier?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  orgId: string;
}

const CATEGORIES = [
  'Electronics', 'Machinery', 'Textiles', 'Chemicals', 'Food & Beverage',
  'Pharmaceuticals', 'Automotive', 'Construction', 'Agriculture', 'Other'
];

const UNITS = [
  'Pieces', 'Sets', 'Boxes', 'Cartons', 'Pallets', 'Kilograms', 'Tons',
  'Liters', 'Gallons', 'Meters', 'Feet', 'Square Meters', 'Cubic Meters'
];

const ExportItems: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [inlineEditing, setInlineEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      category: '',
      unit: '',
      unitPrice: 0,
      costPrice: 0,
      weight: 0,
      dimensions: '',
      hsCode: '',
      minOrderQuantity: 1,
      stockQuantity: 0,
      reorderLevel: 0,
      supplier: '',
      notes: ''
    }
  });

  // Fetch items
  useEffect(() => {
    if (!user?.orgId) return;

    const q = query(
      collection(db, 'items'),
      where('orgId', '==', user.orgId),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Item));
      setItems(itemsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.orgId]);

  // Form submission
  const onSubmit = async (data: ItemFormData) => {
    if (!user?.orgId) return;

    try {
      const itemData = {
        ...data,
        orgId: user.orgId,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'items'), itemData);
      toast.success('Item created successfully');
      setShowAddDialog(false);
      form.reset();
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Failed to create item');
    }
  };

  // Edit item submission
  const onEditSubmit = async (data: ItemFormData) => {
    if (!user?.orgId || !editingItem) return;

    try {
      await updateDoc(doc(db, 'items', editingItem.id), {
        ...data,
        updatedAt: new Date()
      });
      toast.success('Item updated successfully');
      setEditingItem(null);
      form.reset();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  // Delete item
  const deleteItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'items', itemId));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  // Start inline editing
  const startInlineEdit = (itemId: string, field: string, currentValue: any) => {
    setInlineEditing(itemId + '-' + field);
    setEditValues({
      ...editValues,
      [itemId + '-' + field]: currentValue
    });
  };

  // Save inline edit
  const saveInlineEdit = async (itemId: string, field: string) => {
    const value = editValues[itemId + '-' + field];
    
    try {
      await updateDoc(doc(db, 'items', itemId), {
        [field]: value,
        updatedAt: new Date()
      });
      toast.success('Field updated successfully');
      setInlineEditing(null);
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Failed to update field');
    }
  };

  // Cancel inline edit
  const cancelInlineEdit = (itemId: string, field: string) => {
    setInlineEditing(null);
    const newEditValues = { ...editValues };
    delete newEditValues[itemId + '-' + field];
    setEditValues(newEditValues);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getMargin = (unitPrice: number, costPrice: number) => {
    if (costPrice === 0) return 0;
    return ((unitPrice - costPrice) / costPrice * 100).toFixed(1);
  };

  const getStockStatus = (stock?: number, reorder?: number) => {
    if (!stock) return { color: 'gray', text: 'No Stock' };
    if (!reorder) return { color: 'green', text: 'In Stock' };
    if (stock <= reorder) return { color: 'red', text: 'Low Stock' };
    return { color: 'green', text: 'In Stock' };
  };

  const InlineEditableCell: React.FC<{
    itemId: string;
    field: string;
    value: any;
    type?: 'text' | 'number'
  }> = ({ itemId, field, value, type = 'text' }) => {
    const editKey = itemId + '-' + field;
    const isEditing = inlineEditing === editKey;

    if (isEditing) {
      return (
        <div className="flex items-center space-x-1">
          {type === 'number' ? (
            <Input
              type="number"
              value={editValues[editKey] || value}
              onChange={(e) => setEditValues({ ...editValues, [editKey]: parseFloat(e.target.value) || 0 })}
              className="w-24 h-8"
            />
          ) : (
            <Input
              value={editValues[editKey] || value}
              onChange={(e) => setEditValues({ ...editValues, [editKey]: e.target.value })}
              className="w-32 h-8"
            />
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => saveInlineEdit(itemId, field)}
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => cancelInlineEdit(itemId, field)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
        onClick={() => startInlineEdit(itemId, field, value)}
      >
        {type === 'number' && typeof value === 'number' ? 
          (field.includes('Price') ? `$${value.toFixed(2)}` : value) : 
          value
        }
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Item Register</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Item Register</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU *</FormLabel>
                          <FormControl>
                            <Input placeholder="SKU-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Product Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Product description..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
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
                              {CATEGORIES.map(category => (
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
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UNITS.map(unit => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
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
                      name="hsCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HS Code</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price *</FormLabel>
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
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Price *</FormLabel>
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
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
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
                      name="dimensions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dimensions (LxWxH)</FormLabel>
                          <FormControl>
                            <Input placeholder="10x5x3 cm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier</FormLabel>
                          <FormControl>
                            <Input placeholder="Supplier Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="minOrderQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Order Qty</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reorderLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reorder Level</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
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
                            placeholder="Additional notes..."
                            className="min-h-[80px]"
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
                      Create Item
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
            placeholder="Search items..."
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
            {CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">SKU</th>
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Category</th>
                  <th className="text-left p-4 font-medium">Unit</th>
                  <th className="text-left p-4 font-medium">Unit Price</th>
                  <th className="text-left p-4 font-medium">Cost Price</th>
                  <th className="text-left p-4 font-medium">Margin %</th>
                  <th className="text-left p-4 font-medium">Stock</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item.stockQuantity, item.reorderLevel);
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <InlineEditableCell
                          itemId={item.id}
                          field="sku"
                          value={item.sku}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            <InlineEditableCell
                              itemId={item.id}
                              field="name"
                              value={item.name}
                            />
                          </div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">
                              <InlineEditableCell
                                itemId={item.id}
                                field="description"
                                value={item.description}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td className="p-4">{item.unit}</td>
                      <td className="p-4">
                        <InlineEditableCell
                          itemId={item.id}
                          field="unitPrice"
                          value={item.unitPrice}
                          type="number"
                        />
                      </td>
                      <td className="p-4">
                        <InlineEditableCell
                          itemId={item.id}
                          field="costPrice"
                          value={item.costPrice}
                          type="number"
                        />
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${
                          parseFloat(getMargin(item.unitPrice, item.costPrice)) >= 20 ? 'text-green-600' :
                          parseFloat(getMargin(item.unitPrice, item.costPrice)) >= 10 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {getMargin(item.unitPrice, item.costPrice)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <InlineEditableCell
                          itemId={item.id}
                          field="stockQuantity"
                          value={item.stockQuantity}
                          type="number"
                        />
                      </td>
                      <td className="p-4">
                        <Badge variant={stockStatus.color === 'green' ? 'default' : stockStatus.color === 'red' ? 'destructive' : 'secondary'}>
                          {stockStatus.text}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              form.reset(item);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No items found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              {/* Same form fields as Add Dialog */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU *</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Product Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Item
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExportItems;

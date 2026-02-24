'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileUp, FileDown, Trash2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const mockItems = [
  { name: "Black Pepper (Whole)", sku: "BP001", category: "Whole Spices", hsn: "0904", price: 8.50, cbm: 0.042, status: "Active" },
  { name: "Green Cardamom", sku: "CD001", category: "Whole Spices", hsn: "0908", price: 22.00, cbm: 0.038, status: "Active" },
  { name: "Turmeric Powder", sku: "TM001", category: "Ground Spices", hsn: "0910", price: 3.20, cbm: 0.025, status: "Active" },
  { name: "Marayur Jaggery", sku: "MJ001", category: "Sweeteners", hsn: "1701", price: 1.80, cbm: 0.050, status: "Active" },
  { name: "Wayanad GI Rice", sku: "WR001", category: "Rice & Grains", hsn: "1006", price: 2.10, cbm: 0.060, status: "Active" },
];

export default function ItemRegisterPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader title="Item Register" description="Master register for all exportable spice products and commodities.">
        <div className="flex gap-2">
          <Button variant="outline"><FileUp className="mr-2 size-4" /> Import</Button>
          <Button variant="outline"><FileDown className="mr-2 size-4" /> Export</Button>
          <Button asChild><Link href="/export-docs/items/new"><PlusCircle className="mr-2 size-4" /> Add Item</Link></Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="trash">Trash</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, SKU, HSN..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon"><Filter className="size-4" /></Button>
          </div>
        </div>

        <TabsContent value="all">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thumbnail</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Price (USD)</TableHead>
                  <TableHead>CBM/Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockItems.map((item) => (
                  <TableRow key={item.sku}>
                    <TableCell>
                      <div className="size-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">IMG</div>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.hsn}</TableCell>
                    <TableCell>${item.price.toFixed(2)}/kg</TableCell>
                    <TableCell>{item.cbm} m³</TableCell>
                    <TableCell>
                      <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="trash">
          <div className="py-12 text-center text-muted-foreground border rounded-md border-dashed">
            No items in trash.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
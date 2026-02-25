'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Filter, Mail, Phone, Globe, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const mockBuyers = [
  { id: 1, name: "Gulf Foods LLC", country: "UAE", currency: "USD", totalOrders: 12, lastOrder: "2026-02-10", totalValue: 142000, status: "VIP" },
  { id: 2, name: "London Spice Co", country: "UK", currency: "GBP", totalOrders: 8, lastOrder: "2026-02-09", totalValue: 82000, status: "Active" },
  { id: 3, name: "Nairobi Traders", country: "Kenya", currency: "USD", totalOrders: 5, lastOrder: "2026-02-08", totalValue: 35000, status: "Active" },
];

const mockAgents = [
  { id: 1, name: "Express Logistics", type: "Shipping", services: "Sea/Air Freight", country: "India", contact: "+91 98765 43210" },
  { id: 2, name: "Global Sourcing Ltd", type: "Buying", commission: "3%", country: "UK", contact: "John Doe" },
];

export default function BuyersAndAgentsPage() {
  const [activeTab, setActiveTab] = useState("buyers");

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Buyers & Agents" 
        description="Manage your international customer base and logistics partners."
      >
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <PlusCircle className="mr-2 size-4" /> 
          {activeTab === 'buyers' ? 'Add Buyer' : 'Add Agent'}
        </Button>
      </PageHeader>

      <Tabs defaultValue="buyers" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-stone-100 p-1 rounded-xl">
            <TabsTrigger value="buyers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Buyers</TabsTrigger>
            <TabsTrigger value="buying-agents" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Buying Agents</TabsTrigger>
            <TabsTrigger value="shipping-agents" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Shipping Agents</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search records..." className="pl-8 bg-white h-10 border-stone-200" />
            </div>
            <Button variant="outline" size="icon" className="bg-white border-stone-200"><Filter className="size-4" /></Button>
          </div>
        </div>

        <TabsContent value="buyers">
          <Card className="border-none shadow-xl shadow-stone-200/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Company</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockBuyers.map((buyer) => (
                    <TableRow key={buyer.id} className="group">
                      <TableCell className="pl-6">
                        <div className="font-bold text-stone-900">{buyer.name}</div>
                        <div className="text-xs text-stone-500 font-medium">Last order: {buyer.lastOrder}</div>
                      </TableCell>
                      <TableCell>{buyer.country}</TableCell>
                      <TableCell><Badge variant="outline">{buyer.currency}</Badge></TableCell>
                      <TableCell className="font-medium">{buyer.totalOrders}</TableCell>
                      <TableCell className="font-bold text-spice-600">${buyer.totalValue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={buyer.status === 'VIP' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                          {buyer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Order History</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buying-agents">
          <Card className="border-none shadow-xl shadow-stone-200/50">
            <CardContent className="p-8 text-center text-stone-500">
              <div className="max-w-xs mx-auto space-y-4">
                <PlusCircle className="mx-auto size-12 text-stone-300" />
                <h3 className="font-bold text-stone-900">No Buying Agents Yet</h3>
                <p className="text-sm">Manage agents who source products or act on behalf of international buyers.</p>
                <Button variant="outline" className="w-full">Register First Agent</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping-agents">
          <Card className="border-none shadow-xl shadow-stone-200/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Agent / Company</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAgents.filter(a => a.type === 'Shipping').map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="pl-6 font-bold text-stone-900">{agent.name}</TableCell>
                      <TableCell><Badge variant="secondary">{agent.services}</Badge></TableCell>
                      <TableCell>{agent.country}</TableCell>
                      <TableCell className="text-sm font-medium">{agent.contact}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button variant="ghost" size="sm">Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
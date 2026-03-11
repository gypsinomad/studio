'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileDown, TrendingUp, DollarSign, Ship, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Line, LineChart } from 'recharts';

const mockSalesData = [
  { month: 'Jun', value: 45000 },
  { month: 'Jul', value: 52000 },
  { month: 'Aug', value: 48000 },
  { month: 'Sep', value: 61000 },
  { month: 'Oct', value: 55000 },
  { month: 'Nov', value: 67000 },
  { month: 'Dec', value: 72000 },
];

const mockBuyerData = [
  { name: 'Gulf Foods', value: 85000 },
  { name: 'London Spice', value: 62000 },
  { name: 'Nairobi Traders', value: 41000 },
  { name: 'Apex Imports', value: 35000 },
  { name: 'EuroSpices', value: 28000 },
];

export default function ExportReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Export Analytics" description="Comprehensive reporting on sales performance, logistics efficiency, and financial health.">
        <Button variant="outline"><FileDown className="mr-2 size-4" /> Export to Excel</Button>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-50 rounded-full"><DollarSign className="size-5 text-emerald-600" /></div>
                  <div><p className="text-xs text-muted-foreground">Total Export Value</p><p className="text-xl font-bold">$4.2 Cr</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 rounded-full"><Ship className="size-5 text-blue-600" /></div>
                  <div><p className="text-xs text-muted-foreground">Total Shipments</p><p className="text-xl font-bold">42</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-50 rounded-full"><TrendingUp className="size-5 text-amber-600" /></div>
                  <div><p className="text-xs text-muted-foreground">Pending Receivables</p><p className="text-xl font-bold">$18,400</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-50 rounded-full"><Users className="size-5 text-purple-600" /></div>
                  <div><p className="text-xs text-muted-foreground">Active Buyers</p><p className="text-xl font-bold">18</p></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Sales Trend (USD)</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockSalesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Sales by Buyer (Top 5)</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockBuyerData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0F172A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <Card><CardContent className="p-12 text-center text-muted-foreground">Detailed Sales Reports coming soon...</CardContent></Card>
        </TabsContent>
        <TabsContent value="financial">
          <Card><CardContent className="p-12 text-center text-muted-foreground">Financial Analytics coming soon...</CardContent></Card>
        </TabsContent>
        <TabsContent value="operations">
          <Card><CardContent className="p-12 text-center text-muted-foreground">Logistics Reports coming soon...</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
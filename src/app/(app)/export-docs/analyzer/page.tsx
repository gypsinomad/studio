'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calculator, FileDown, Search, Plus, Trash2, Bot, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const items = [
  { id: 1, name: "Black Pepper", unitCbm: 0.042, weight: 25 },
  { id: 2, name: "Green Cardamom", unitCbm: 0.038, weight: 15 },
  { id: 3, name: "Turmeric Powder", unitCbm: 0.025, weight: 20 },
];

export default function OrderAnalyzerPage() {
  const [selectedItems, setSelectedItems] = useState<{ id: number, name: string, qty: number, unitCbm: number, weight: number }[]>([]);
  const [freightRate, setFreightRate] = useState(0);

  const stats = useMemo(() => {
    const totalCbm = selectedItems.reduce((acc, item) => acc + (item.unitCbm * item.qty), 0);
    const totalWeight = selectedItems.reduce((acc, item) => acc + (item.weight * item.qty), 0);
    const totalQty = selectedItems.reduce((acc, item) => acc + item.qty, 0);
    
    let recommended = "None";
    if (totalCbm > 0 && totalCbm <= 25) recommended = "20ft ST";
    else if (totalCbm > 25 && totalCbm <= 55) recommended = "40ft ST";
    else if (totalCbm > 55) recommended = "40ft HC";

    return { totalCbm, totalWeight, totalQty, recommended };
  }, [selectedItems]);

  const containers = [
    { name: "20ft Standard", capacity: 25, color: "bg-blue-500" },
    { name: "40ft Standard", capacity: 55, color: "bg-emerald-500" },
    { name: "40HC High Cube", capacity: 67, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Order Analyzer" description="Simulate container utilization and estimate freight costs based on Item CBM.">
        <Button variant="outline"><FileDown className="mr-2 size-4" /> Export Planning Sheet</Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-10">
        {/* LEFT - SELECTOR */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Item Selection</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search register..." className="pl-8 h-9" />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors border group">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.unitCbm} m³ / unit</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => setSelectedItems([...selectedItems, { ...item, qty: 1 }])}>
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-primary text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Running Total CBM</span>
                <span className="text-2xl font-bold">{stats.totalCbm.toFixed(3)} m³</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT - ANALYSIS */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total CBM</p><p className="text-xl font-bold">{stats.totalCbm.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total Weight</p><p className="text-xl font-bold">{stats.totalWeight} kg</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total Units</p><p className="text-xl font-bold">{stats.totalQty}</p></CardContent></Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="pt-6">
                <p className="text-xs text-emerald-700 font-medium">Recommended</p>
                <p className="text-xl font-bold text-emerald-900">{stats.recommended}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Container Utilization</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {containers.map(c => {
                const percent = Math.min((stats.totalCbm / c.capacity) * 100, 100);
                const isRecommended = stats.recommended.includes(c.name.split(' ')[0]);
                return (
                  <div key={c.name} className={`space-y-2 p-4 rounded-lg border ${isRecommended ? 'bg-emerald-50 border-emerald-200' : ''}`}>
                    <div className="flex justify-between text-sm font-medium">
                      <span>{c.name} ({c.capacity} m³)</span>
                      <span>{percent.toFixed(1)}%</span>
                    </div>
                    <Progress value={percent} className="h-3" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Freight Estimator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="grid gap-2 flex-1">
                  <Label>Freight Cost per CBM (USD)</Label>
                  <Input type="number" placeholder="e.g. 150" onChange={(e) => setFreightRate(Number(e.target.value))} />
                </div>
                <div className="bg-muted p-3 rounded-lg flex-1">
                  <p className="text-xs text-muted-foreground">Total Estimated Freight</p>
                  <p className="text-lg font-bold">${(stats.totalCbm * freightRate).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Bot className="mr-2 size-4" /> AI Packaging Suggestion
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
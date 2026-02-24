'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bot, Sparkles, Upload, Plus, Trash2, Loader2 } from 'lucide-react';
import { CATEGORIES, SUBCATEGORIES, HSN_CODES, CURRENCIES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export default function NewItemPage() {
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [dimensions, setDimensions] = useState({ l: 0, w: 0, h: 0 });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currencies, setCurrencies] = useState([{ code: 'USD', amount: '' }]);

  const cbm = useMemo(() => {
    return (dimensions.l * dimensions.w * dimensions.h) / 1000000;
  }, [dimensions]);

  const handleAiAutoFill = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      toast({ title: "AI Analysis Complete", description: "Fields have been auto-filled from the uploaded image." });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Item" description="Create a new export item with dimensions and multi-currency pricing." />

      <div className="grid gap-6 md:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="md:col-span-7 space-y-6">
          <Card>
            <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" placeholder="e.g. Wayanad GI Black Pepper" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <div className="flex gap-2">
                    <Input id="sku" placeholder="SKU-001" />
                    <Button variant="secondary">Auto</Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Subcategory</Label>
                  <Select disabled={!category}>
                    <SelectTrigger><SelectValue placeholder="Select Subcategory" /></SelectTrigger>
                    <SelectContent>
                      {category && SUBCATEGORIES[category]?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>HSN Code</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select HSN" /></SelectTrigger>
                    <SelectContent>
                      {HSN_CODES.map(h => <SelectItem key={h.code} value={h.code}>{h.code} – {h.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" placeholder="Detailed product specifications..." className="min-h-[100px]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Attributes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Material / Composition</Label><Input placeholder="e.g. 100% Organic" /></div>
                <div className="grid gap-2"><Label>Origin</Label><Input placeholder="e.g. Kerala, India" /></div>
              </div>
              {category === 'Whole Spices' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                  <div className="grid gap-2"><Label>Moisture %</Label><Input type="number" placeholder="12" /></div>
                  <div className="grid gap-2"><Label>Purity %</Label><Input type="number" placeholder="99" /></div>
                </div>
              )}
              <Button variant="ghost" size="sm" className="w-full border-dashed border-2"><Plus className="mr-2 size-4" /> Add Custom Attribute</Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardHeader><CardTitle>Media & AI Tools</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Drag & drop product images</p>
                <p className="text-xs text-muted-foreground mt-1">Multi-upload supported (JPG, PNG)</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={handleAiAutoFill} disabled={isAiLoading}>
                  {isAiLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Bot className="mr-2 size-4 text-emerald-600" />}
                  Auto-Fill
                </Button>
                <Button variant="secondary">
                  <Sparkles className="mr-2 size-4 text-amber-500" />
                  Generate Desc
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Logistics (CBM)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="grid gap-2">
                  <Label>Length (cm)</Label>
                  <Input type="number" onChange={(e) => setDimensions({ ...dimensions, l: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label>Width (cm)</Label>
                  <Input type="number" onChange={(e) => setDimensions({ ...dimensions, w: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label>Height (cm)</Label>
                  <Input type="number" onChange={(e) => setDimensions({ ...dimensions, h: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-sm font-medium text-emerald-900">Calculated CBM:</span>
                <Badge className="bg-emerald-600">{cbm.toFixed(4)} m³ per unit</Badge>
              </div>
              <div className="grid gap-2">
                <Label>Weight (kg)</Label>
                <Input type="number" placeholder="25.0" />
              </div>
              <div className="flex items-center justify-between py-2 border-t mt-4">
                <div className="space-y-0.5">
                  <Label>Multi-Component Item</Label>
                  <p className="text-xs text-muted-foreground">Item consists of multiple parts/kits</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BOTTOM PRICING */}
        <div className="md:col-span-12">
          <Card>
            <CardHeader><CardTitle>Pricing Strategy</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currencies.map((curr, idx) => (
                  <div key={idx} className="flex gap-4 items-end animate-in slide-in-from-left-2">
                    <div className="grid gap-2 w-32">
                      <Label>Currency</Label>
                      <Select defaultValue={curr.code}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2 flex-1">
                      <Label>Unit Amount</Label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCurrencies(currencies.filter((_, i) => i !== idx))} disabled={currencies.length === 1}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setCurrencies([...currencies, { code: 'USD', amount: '' }])}>
                  <Plus className="mr-2 size-4" /> Add Currency
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6">
              <Button variant="outline">Save as Draft</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">Save Item</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
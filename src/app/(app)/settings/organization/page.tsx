
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useDoc, useMemoFirebase, useUser, useStorage } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { RoleGuard } from '@/components/auth/role-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { LoaderCircle, Upload, Plus, Trash2, Building2, Palette, ShieldCheck, Globe } from 'lucide-react';
import type { OrganizationSettings } from '@/lib/types';
import { format } from 'date-fns';

const orgSchema = z.object({
  branding: z.object({
    brandName: z.string().min(2, 'Brand name is required'),
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'),
    accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'),
  }),
  profile: z.object({
    legalName: z.string().min(2, 'Legal name is required'),
    displayName: z.string().min(2, 'Display name is required'),
    address: z.object({
      line1: z.string().min(5, 'Address line 1 is required'),
      line2: z.string().optional(),
      city: z.string().min(2, 'City is required'),
      state: z.string().min(2, 'State is required'),
      pinCode: z.string().min(6, 'PIN Code must be 6 digits'),
      country: z.string().min(2, 'Country is required'),
    }),
    email: z.string().email('Invalid email'),
    phone: z.string().min(10, 'Invalid phone number'),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
  }),
  localization: z.object({
    timezone: z.string(),
    currency: z.string(),
    dateFormat: z.string(),
    timeFormat: z.string(),
  }),
  compliance: z.object({
    pan: z.string().min(10, 'Invalid PAN'),
    gstin: z.string().min(15, 'Invalid GSTIN'),
    iec: z.string().min(10, 'Invalid IEC'),
    adCode: z.string().optional(),
    apedaReg: z.string().optional(),
    fssaiNumber: z.string().optional(),
    isVerified: z.boolean().default(false),
    internalNotes: z.string().optional(),
    licenses: z.array(z.object({
      name: z.string(),
      id: z.string(),
      expiryDate: z.any().optional(),
    })),
  }),
});

type OrgFormValues = z.infer<typeof orgSchema>;

export default function OrganizationSettingsPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');

  const orgRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'organization') : null), [firestore]);
  const { data: orgData, isLoading } = useDoc<OrganizationSettings>(orgRef);

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      branding: { brandName: 'SpiceRoute CRM', primaryColor: '#6366f1', accentColor: '#f59e0b' },
      localization: { timezone: 'UTC+5:30', currency: 'INR', dateFormat: 'PP', timeFormat: 'p' },
      compliance: { isVerified: false, licenses: [] }
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'compliance.licenses',
  });

  useEffect(() => {
    if (orgData) {
      form.reset(orgData as any);
    }
  }, [orgData, form.reset]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'darkLogo' | 'favicon') => {
    const file = event.target.files?.[0];
    if (!file || !storage || !orgRef) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum logo size is 2MB.' });
      return;
    }

    try {
      const storagePath = `org/branding/${type}_${Date.now()}`;
      const fileRef = ref(storage, storagePath);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      const fieldMap = { logo: 'branding.logoUrl', darkLogo: 'branding.darkLogoUrl', favicon: 'branding.faviconUrl' };
      await updateDoc(orgRef, { [fieldMap[type]]: url });
      toast({ title: 'Success', description: `${type} updated successfully.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload image.' });
    }
  };

  const onSubmit = async (values: OrgFormValues) => {
    if (!orgRef || !user) return;
    setIsSaving(true);
    try {
      await setDoc(orgRef, { ...values, updatedAt: serverTimestamp(), updatedBy: user.uid }, { merge: true });
      toast({ title: 'Settings Saved', description: 'Organization configuration updated successfully.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'An error occurred while saving.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageHeader title="Organization Settings" description="Manage global branding, company profile, and compliance details." />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/50 border shadow-sm p-1 rounded-xl">
          <TabsTrigger value="branding" className="rounded-lg gap-2"><Palette className="size-4" /> Branding</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg gap-2"><Building2 className="size-4" /> Company Profile</TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-lg gap-2"><ShieldCheck className="size-4" /> Compliance</TabsTrigger>
          <TabsTrigger value="localization" className="rounded-lg gap-2"><Globe className="size-4" /> Localization</TabsTrigger>
        </TabsList>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TabsContent value="branding" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Visual Identity</CardTitle><CardDescription>Upload your logos and set brand colors.</CardDescription></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Brand Name</Label>
                      <Input {...form.register('branding.brandName')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <div className="size-10 rounded-lg border shadow-inner" style={{ backgroundColor: form.watch('branding.primaryColor') }} />
                        <Input {...form.register('branding.primaryColor')} placeholder="#000000" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                      <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Main Logo</p>
                      <p className="text-xs text-muted-foreground mt-1">Light Theme Sidebar (Max 2MB)</p>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" />
                    </div>
                    {orgData?.branding.logoUrl && (
                      <div className="p-4 rounded-lg bg-slate-900 flex items-center justify-center">
                        <img src={orgData.branding.logoUrl} alt="Logo" className="h-8" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-50 border-slate-200">
                <CardHeader><CardTitle>Live Preview</CardTitle><CardDescription>See how your branding looks in the app shell.</CardDescription></CardHeader>
                <CardContent>
                  <div className="rounded-xl border shadow-xl bg-white overflow-hidden aspect-video relative">
                    <div className="h-8 border-b bg-slate-900 flex items-center px-3 gap-2">
                      <div className="size-2 rounded-full bg-red-400" />
                      <div className="size-2 rounded-full bg-amber-400" />
                      <div className="size-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex h-[calc(100%-2rem)]">
                      <div className="w-16 border-r bg-slate-950 flex flex-col items-center py-4 gap-4">
                        <div className="size-8 rounded-lg" style={{ backgroundColor: form.watch('branding.primaryColor') }} />
                        <div className="size-6 rounded bg-slate-800" />
                        <div className="size-6 rounded bg-slate-800" />
                      </div>
                      <div className="flex-1 p-4 space-y-4">
                        <div className="h-4 w-1/3 rounded bg-slate-100" />
                        <div className="grid grid-cols-3 gap-2">
                          <div className="h-20 rounded bg-slate-50 border border-slate-100" />
                          <div className="h-20 rounded bg-slate-50 border border-slate-100" />
                          <div className="h-20 rounded bg-slate-50 border border-slate-100" />
                        </div>
                        <Button size="sm" style={{ backgroundColor: form.watch('branding.primaryColor') }}>Example Button</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card>
              <CardHeader><CardTitle>Company Profile</CardTitle><CardDescription>Legal and contact information for your organization.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Identity</h3>
                    <div className="space-y-2"><Label>Legal Entity Name</Label><Input {...form.register('profile.legalName')} /></div>
                    <div className="space-y-2"><Label>Display Name</Label><Input {...form.register('profile.displayName')} /></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Contact</h3>
                    <div className="space-y-2"><Label>Business Email</Label><Input {...form.register('profile.email')} /></div>
                    <div className="space-y-2"><Label>Phone Number</Label><Input {...form.register('profile.phone')} /></div>
                    <div className="space-y-2"><Label>Website URL</Label><Input {...form.register('profile.website')} /></div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Registered Office Address</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2"><Label>Address Line 1</Label><Input {...form.register('profile.address.line1')} /></div>
                    <div className="md:col-span-2 space-y-2"><Label>Address Line 2 (Optional)</Label><Input {...form.register('profile.address.line2')} /></div>
                    <div className="space-y-2"><Label>City</Label><Input {...form.register('profile.address.city')} /></div>
                    <div className="space-y-2"><Label>State / Province</Label><Input {...form.register('profile.address.state')} /></div>
                    <div className="space-y-2"><Label>PIN / Postal Code</Label><Input {...form.register('profile.address.pinCode')} /></div>
                    <div className="space-y-2"><Label>Country</Label><Input {...form.register('profile.address.country')} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card>
              <CardHeader><CardTitle>Statutory Compliance</CardTitle><CardDescription>Manage Indian exporter registrations and statutory licenses.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2"><Label>PAN (Company)</Label><Input {...form.register('compliance.pan')} className="font-mono uppercase" /></div>
                  <div className="space-y-2"><Label>GSTIN</Label><Input {...form.register('compliance.gstin')} className="font-mono uppercase" /></div>
                  <div className="space-y-2"><Label>IEC Code</Label><Input {...form.register('compliance.iec')} className="font-mono uppercase" /></div>
                  <div className="space-y-2"><Label>AD Code (Bank Authorized)</Label><Input {...form.register('compliance.adCode')} /></div>
                  <div className="space-y-2"><Label>APEDA Registration</Label><Input {...form.register('compliance.apedaReg')} /></div>
                  <div className="space-y-2"><Label>FSSAI Number</Label><Input {...form.register('compliance.fssaiNumber')} /></div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">License Expiry Tracking</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', id: '', expiryDate: '' })}><Plus className="mr-2 size-4" /> Add License</Button>
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid md:grid-cols-4 gap-4 items-end p-4 rounded-xl border bg-slate-50/50">
                      <div className="space-y-2"><Label>License Name</Label><Input {...form.register(`compliance.licenses.${index}.name`)} placeholder="e.g. Spices Board" /></div>
                      <div className="space-y-2"><Label>Registration ID</Label><Input {...form.register(`compliance.licenses.${index}.id`)} /></div>
                      <div className="space-y-2"><Label>Expiry Date</Label><Input type="date" {...form.register(`compliance.licenses.${index}.expiryDate`)} /></div>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}><Trash2 className="size-4" /></Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="space-y-0.5">
                    <Label>Organization Verified</Label>
                    <p className="text-xs text-muted-foreground">Mark this organization as fully compliant and verified.</p>
                  </div>
                  <Switch checked={form.watch('compliance.isVerified')} onCheckedChange={(val) => form.setValue('compliance.isVerified', val)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localization" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card>
              <CardHeader><CardTitle>Regional Settings</CardTitle><CardDescription>Set defaults for date formats and currencies.</CardDescription></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={form.watch('localization.currency')} onValueChange={(val) => form.setValue('localization.currency', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="INR">INR (₹)</SelectItem><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="AED">AED</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Select value={form.watch('localization.timezone')} onValueChange={(val) => form.setValue('localization.timezone', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="UTC+5:30">India Standard Time (UTC+5:30)</SelectItem><SelectItem value="UTC">UTC</SelectItem><SelectItem value="UTC+4">Dubai (UTC+4)</SelectItem></SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="fixed bottom-8 right-8 flex gap-3">
            <Button type="submit" size="lg" disabled={isSaving} className="shadow-2xl">
              {isSaving ? <LoaderCircle className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Tabs>
    </RoleGuard>
  );
}

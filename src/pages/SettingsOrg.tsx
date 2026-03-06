import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Users, 
  Settings, 
  Save,
  Upload,
  FileText,
  Shield,
  Bell,
  Database,
  CreditCard,
  Palette,
  Globe2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Form validation schemas
const orgInfoSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  legalName: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.string().optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional()
});

const preferencesSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  currency: z.string().min(1, "Currency is required"),
  language: z.string().min(1, "Language is required"),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  weeklyReports: z.boolean(),
  autoBackup: z.boolean()
});

const securitySchema = z.object({
  twoFactorAuth: z.boolean(),
  sessionTimeout: z.number().min(5).max(1440),
  passwordPolicy: z.boolean(),
  auditLogging: z.boolean(),
  ipWhitelist: z.string().optional()
});

type OrgInfoData = z.infer<typeof orgInfoSchema>;
type PreferencesData = z.infer<typeof preferencesSchema>;
type SecurityData = z.infer<typeof securitySchema>;

interface Organization {
  id: string;
  companyName: string;
  legalName?: string;
  registrationNumber?: string;
  taxId?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  industry?: string;
  employeeCount?: string;
  foundedYear?: number;
  logo?: string;
  settings?: {
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    weeklyReports: boolean;
    autoBackup: boolean;
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: boolean;
    auditLogging: boolean;
    ipWhitelist?: string;
  };
  createdAt: any;
  updatedAt: any;
}

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Italy', 'Spain',
  'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'Poland', 'China', 'Japan', 'South Korea', 'India', 'Singapore', 'Malaysia', 'Thailand',
  'Vietnam', 'Indonesia', 'Philippines', 'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia',
  'Mexico', 'South Africa', 'Egypt', 'Nigeria', 'Kenya', 'Ghana', 'Morocco', 'UAE',
  'Saudi Arabia', 'Israel', 'Turkey', 'Russia', 'New Zealand', 'Pakistan', 'Bangladesh'
];

const INDUSTRIES = [
  'Agriculture', 'Manufacturing', 'Technology', 'Healthcare', 'Finance', 'Education',
  'Retail', 'Construction', 'Transportation', 'Energy', 'Food & Beverage', 'Textiles',
  'Chemicals', 'Pharmaceuticals', 'Automotive', 'Electronics', 'Telecommunications',
  'Media & Entertainment', 'Tourism', 'Consulting', 'Other'
];

const TIMEZONES = [
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00',
  'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00',
  'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00',
  'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00'
];

const DATE_FORMATS = [
  'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MMMM DD, YYYY', 'DD MMMM YYYY'
];

const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'SGD', 'MYR', 'THB'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese',
  'Korean', 'Arabic', 'Hindi', 'Thai', 'Vietnamese', 'Indonesian', 'Malay'
];

const SettingsOrg: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  const orgInfoForm = useForm<OrgInfoData>({
    resolver: zodResolver(orgInfoSchema),
    defaultValues: {
      companyName: '',
      legalName: '',
      registrationNumber: '',
      taxId: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      industry: '',
      employeeCount: '',
      foundedYear: undefined
    }
  });

  const preferencesForm = useForm<PreferencesData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      timezone: 'UTC+00:00',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      language: 'English',
      emailNotifications: true,
      smsNotifications: false,
      weeklyReports: true,
      autoBackup: true
    }
  });

  const securityForm = useForm<SecurityData>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      twoFactorAuth: false,
      sessionTimeout: 60,
      passwordPolicy: true,
      auditLogging: true,
      ipWhitelist: ''
    }
  });

  // Fetch organization data
  useEffect(() => {
    if (!user?.orgId) return;

    const fetchOrganization = async () => {
      try {
        const orgDoc = await getDoc(doc(db, 'orgs', user.orgId));
        if (orgDoc.exists()) {
          const orgData = orgDoc.data() as Organization;
          setOrganization(orgData);
          
          // Populate forms
          orgInfoForm.reset({
            companyName: orgData.companyName,
            legalName: orgData.legalName || '',
            registrationNumber: orgData.registrationNumber || '',
            taxId: orgData.taxId || '',
            email: orgData.email,
            phone: orgData.phone || '',
            website: orgData.website || '',
            address: orgData.address || '',
            city: orgData.city || '',
            state: orgData.state || '',
            country: orgData.country,
            postalCode: orgData.postalCode || '',
            industry: orgData.industry || '',
            employeeCount: orgData.employeeCount || '',
            foundedYear: orgData.foundedYear
          });

          if (orgData.settings) {
            preferencesForm.reset({
              timezone: orgData.settings.timezone,
              dateFormat: orgData.settings.dateFormat,
              currency: orgData.settings.currency,
              language: orgData.settings.language,
              emailNotifications: orgData.settings.emailNotifications,
              smsNotifications: orgData.settings.smsNotifications,
              weeklyReports: orgData.settings.weeklyReports,
              autoBackup: orgData.settings.autoBackup
            });

            securityForm.reset({
              twoFactorAuth: orgData.settings.twoFactorAuth,
              sessionTimeout: orgData.settings.sessionTimeout,
              passwordPolicy: orgData.settings.passwordPolicy,
              auditLogging: orgData.settings.auditLogging,
              ipWhitelist: orgData.settings.ipWhitelist || ''
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching organization:', error);
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [user?.orgId]);

  // Save organization info
  const saveOrgInfo = async (data: OrgInfoData) => {
    if (!user?.orgId) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'orgs', user.orgId), {
        ...data,
        updatedAt: new Date()
      });
      toast.success('Organization information updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization information');
    } finally {
      setSaving(false);
    }
  };

  // Save preferences
  const savePreferences = async (data: PreferencesData) => {
    if (!user?.orgId) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'orgs', user.orgId), {
        'settings': {
          ...organization?.settings,
          ...data
        },
        updatedAt: new Date()
      });
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  // Save security settings
  const saveSecurity = async (data: SecurityData) => {
    if (!user?.orgId) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'orgs', user.orgId), {
        'settings': {
          ...organization?.settings,
          ...data
        },
        updatedAt: new Date()
      });
      toast.success('Security settings updated successfully');
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast.error('Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">Manage your organization's information and preferences</p>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
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
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization's information and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Organization Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...orgInfoForm}>
                <form onSubmit={orgInfoForm.handleSubmit(saveOrgInfo)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={orgInfoForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corporation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgInfoForm.control}
                      name="legalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corporation LLC" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={orgInfoForm.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input placeholder="123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgInfoForm.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID</FormLabel>
                          <FormControl>
                            <Input placeholder="TX-123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgInfoForm.control}
                      name="foundedYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Founded Year</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="2020"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={orgInfoForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgInfoForm.control}
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
                    control={orgInfoForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={orgInfoForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Business Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgInfoForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={orgInfoForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgInfoForm.control}
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
                      control={orgInfoForm.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={orgInfoForm.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INDUSTRIES.map(industry => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={orgInfoForm.control}
                      name="employeeCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee Count</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-10">1-10</SelectItem>
                              <SelectItem value="11-50">11-50</SelectItem>
                              <SelectItem value="51-200">51-200</SelectItem>
                              <SelectItem value="201-500">201-500</SelectItem>
                              <SelectItem value="501-1000">501-1000</SelectItem>
                              <SelectItem value="1000+">1000+</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>System Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <form onSubmit={preferencesForm.handleSubmit(savePreferences)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={preferencesForm.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIMEZONES.map(tz => (
                                <SelectItem key={tz} value={tz}>
                                  {tz}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={preferencesForm.control}
                      name="dateFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Format</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DATE_FORMATS.map(format => (
                                <SelectItem key={format} value={format}>
                                  {format}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={preferencesForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CURRENCIES.map(currency => (
                                <SelectItem key={currency} value={currency}>
                                  {currency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={preferencesForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LANGUAGES.map(language => (
                                <SelectItem key={language} value={language}>
                                  {language}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Notifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={preferencesForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Receive email updates about your account
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={preferencesForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">SMS Notifications</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Receive text message alerts
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={preferencesForm.control}
                        name="weeklyReports"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Weekly Reports</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Get weekly performance reports
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Data Management</h3>
                    <FormField
                      control={preferencesForm.control}
                      name="autoBackup"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Automatic Backup</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Automatically backup your data daily
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(saveSecurity)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Authentication</h3>
                    <FormField
                      control={securityForm.control}
                      name="twoFactorAuth"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout (minutes)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timeout" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                              <SelectItem value="240">4 hours</SelectItem>
                              <SelectItem value="480">8 hours</SelectItem>
                              <SelectItem value="1440">24 hours</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Access Control</h3>
                    <FormField
                      control={securityForm.control}
                      name="passwordPolicy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Strong Password Policy</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Require strong passwords for all users
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="auditLogging"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Audit Logging</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Log all user activities for security monitoring
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="ipWhitelist"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IP Whitelist (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter allowed IP addresses, one per line"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Security Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Billing & Subscription</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Billing management would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Integrations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Third-party integrations would be configured here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsOrg;

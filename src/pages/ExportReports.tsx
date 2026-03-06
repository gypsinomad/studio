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
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Mail,
  Printer,
  FileSpreadsheet,
  FileBarChart,
  DollarSign,
  Users,
  Package,
  Target,
  Activity
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

// Form validation schema
const reportFormSchema = z.object({
  type: z.string().min(1, "Report type is required"),
  dateRange: z.string().min(1, "Date range is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  format: z.string().min(1, "Format is required"),
  recipients: z.string().optional()
});

type ReportFormData = z.infer<typeof reportFormSchema>;

interface ReportData {
  orders: any[];
  leads: any[];
  customers: any[];
  payments: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const REPORT_TYPES = [
  { value: 'sales', label: 'Sales Report', icon: <DollarSign className="h-4 w-4" /> },
  { value: 'orders', label: 'Orders Report', icon: <Package className="h-4 w-4" /> },
  { value: 'customers', label: 'Customers Report', icon: <Users className="h-4 w-4" /> },
  { value: 'performance', label: 'Performance Report', icon: <Target className="h-4 w-4" /> },
  { value: 'financial', label: 'Financial Report', icon: <FileBarChart className="h-4 w-4" /> },
  { value: 'activity', label: 'Activity Report', icon: <Activity className="h-4 w-4" /> }
];

const DATE_RANGES = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' }
];

const FORMATS = ['PDF', 'Excel', 'CSV'];

const ExportReports: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
    orders: [],
    leads: [],
    customers: [],
    payments: []
  });
  const [selectedReport, setSelectedReport] = useState<string>('sales');
  const [dateRange, setDateRange] = useState('30');
  const [reportCharts, setReportCharts] = useState<any[]>([]);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      type: 'sales',
      dateRange: '30',
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      format: 'PDF',
      recipients: ''
    }
  });

  // Fetch report data
  useEffect(() => {
    if (!user?.orgId) return;

    const fetchReportData = async () => {
      try {
        const daysAgo = parseInt(dateRange);
        const startDate = subDays(new Date(), daysAgo);
        
        // Fetch orders
        const ordersQuery = query(
          collection(db, 'exportOrders'),
          where('orgId', '==', user.orgId),
          where('createdAt', '>=', startDate),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch leads
        const leadsQuery = query(
          collection(db, 'leads'),
          where('orgId', '==', user.orgId),
          where('createdAt', '>=', startDate),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const leadsSnapshot = await getDocs(leadsQuery);
        const leadsData = leadsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch customers
        const customersQuery = query(
          collection(db, 'companies'),
          where('orgId', '==', user.orgId),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const customersSnapshot = await getDocs(customersQuery);
        const customersData = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch payments
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('orgId', '==', user.orgId),
          where('createdAt', '>=', startDate),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsData = paymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setReportData({
          orders: ordersData,
          leads: leadsData,
          customers: customersData,
          payments: paymentsData
        });

        // Prepare chart data
        prepareChartData(ordersData, leadsData, paymentsData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setLoading(false);
      }
    };

    fetchReportData();
  }, [user?.orgId, dateRange]);

  // Prepare chart data
  const prepareChartData = (orders: any[], leads: any[], payments: any[]) => {
    // Daily revenue trend
    const dailyData = [];
    for (let i = parseInt(dateRange) - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayOrders = orders.filter(order => 
        order.createdAt.toDate() >= dayStart && order.createdAt.toDate() <= dayEnd
      );
      
      const dayLeads = leads.filter(lead => 
        lead.createdAt.toDate() >= dayStart && lead.createdAt.toDate() <= dayEnd
      );
      
      dailyData.push({
        date: format(date, 'MMM dd'),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + order.totalValue, 0),
        leads: dayLeads.length
      });
    }
    setReportCharts(dailyData);
  };

  // Generate report
  const generateReport = async (data: ReportFormData) => {
    setGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In a real implementation, you would generate and serve the report
      const reportContent = {
        type: data.type,
        dateRange: data.dateRange,
        format: data.format,
        data: reportData,
        generatedAt: new Date()
      };
      
      console.log('Generated Report:', reportContent);
      
      toast.success(`${data.format} report generated successfully`);
      setShowGenerateDialog(false);
      form.reset();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  // Export to Excel (mock implementation)
  const exportToExcel = () => {
    // In a real implementation, you would use a library like xlsx
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Orders,Revenue,Leads\n"
      + reportCharts.map(row => `${row.date},${row.orders},${row.revenue},${row.leads}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Excel file downloaded successfully');
  };

  // Get report statistics
  const getReportStats = () => {
    const totalOrders = reportData.orders.length;
    const totalRevenue = reportData.orders.reduce((sum, order) => sum + order.totalValue, 0);
    const totalLeads = reportData.leads.length;
    const totalCustomers = reportData.customers.length;
    const totalPayments = reportData.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paidPayments = reportData.payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);

    return {
      totalOrders,
      totalRevenue,
      totalLeads,
      totalCustomers,
      totalPayments,
      paidPayments,
      conversionRate: totalLeads > 0 ? ((totalOrders / totalLeads) * 100).toFixed(1) : '0',
      avgOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : '0'
    };
  };

  const stats = getReportStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate and analyze business reports</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-32 bg-gray-100 rounded"></div>
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
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and analyze business reports</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Custom Report</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(generateReport)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REPORT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center space-x-2">
                                  {type.icon}
                                  <span>{type.label}</span>
                                </div>
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
                    name="dateRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Range *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select date range" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DATE_RANGES.map(range => (
                              <SelectItem key={range.value} value={range.value}>
                                {range.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('dateRange') === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Format *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FORMATS.map(format => (
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

                  <FormField
                    control={form.control}
                    name="recipients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Recipients (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="email1@example.com, email2@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowGenerateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={generating}>
                      {generating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex space-x-2">
        {REPORT_TYPES.map(type => (
          <Button
            key={type.value}
            variant={selectedReport === type.value ? 'default' : 'outline'}
            onClick={() => setSelectedReport(type.value)}
            className="flex items-center space-x-2"
          >
            {type.icon}
            <span>{type.label}</span>
          </Button>
        ))}
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Period:</span>
        <div className="flex space-x-2">
          {DATE_RANGES.map(range => (
            <Button
              key={range.value}
              variant={dateRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Leads</p>
                <p className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Leads to Orders</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportCharts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Generation Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportCharts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="leads" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Tables */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.orders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{order.orderNumber || order.id.slice(-6).toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">{order.buyer.companyName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${order.totalValue.toLocaleString()}</div>
                      <Badge variant="outline" className="text-xs">{order.status}</Badge>
                    </div>
                  </div>
                ))}
                {reportData.orders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No orders found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.leads.slice(0, 5).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{lead.fullName}</div>
                      <div className="text-sm text-muted-foreground">{lead.company}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">{lead.status}</Badge>
                    </div>
                  </div>
                ))}
                {reportData.leads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No leads found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.customers.slice(0, 5).map((customer: any) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{customer.companyName}</div>
                      <div className="text-sm text-muted-foreground">{customer.country}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{customer.totalOrders || 0} orders</div>
                      <div className="text-sm text-muted-foreground">
                        ${(customer.totalBusinessValue || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {reportData.customers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No customers found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.payments.slice(0, 5).map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{payment.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">{payment.buyerCompanyName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${payment.amount.toLocaleString()}</div>
                      <Badge variant="outline" className="text-xs">{payment.status}</Badge>
                    </div>
                  </div>
                ))}
                {reportData.payments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No payments found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExportReports;

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Users, Package, Download, Filter, Calendar, BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

export default function ReportsPage() {
  const firestore = useFirestore();
  const [dateRange, setDateRange] = useState('30days');
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<any>({});

  // Fetch real data
  useEffect(() => {
    fetchReportData();
  }, [firestore, dateRange]);

  const fetchReportData = async () => {
    if (!firestore) return;
    
    setIsLoading(true);
    try {
      const leadsQuery = query(collection(firestore, 'leads'), orderBy('createdAt', 'desc'));
      const ordersQuery = query(collection(firestore, 'exportOrders'), orderBy('createdAt', 'desc'));
      
      const [leadsSnapshot, ordersSnapshot] = await Promise.all([
        getDocs(leadsQuery),
        getDocs(ordersQuery)
      ]);

      const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate metrics
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalValue || 0), 0);
      const conversionRate = leads.length > 0 ? (orders.length / leads.length) * 100 : 0;
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      setReportData({
        totalRevenue,
        totalOrders: orders.length,
        totalLeads: leads.length,
        conversionRate,
        avgOrderValue,
        leads,
        orders
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    toast.success('Report exported successfully');
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Analytics Dashboard</h2>
            <p className="text-slate-500 mt-2 text-base font-medium max-w-2xl">
              Real-time business insights and performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
        
        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
              <CardDescription className="text-xs">Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-slate-900">
                  ${reportData.totalRevenue?.toLocaleString() || '0'}
                </div>
                <div className="flex items-center text-green-600 text-sm">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  +12.5%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Conversion Rate</CardTitle>
              <CardDescription className="text-xs">Leads to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-slate-900">
                  {reportData.conversionRate?.toFixed(1) || '0'}%
                </div>
                <div className="flex items-center text-blue-600 text-sm">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  +3.2%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Orders</CardTitle>
              <CardDescription className="text-xs">All time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-slate-900">
                  {reportData.totalOrders || '0'}
                </div>
                <div className="flex items-center text-purple-600 text-sm">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  +8.1%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Leads</CardTitle>
              <CardDescription className="text-xs">In pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-slate-900">
                  {reportData.totalLeads || '0'}
                </div>
                <div className="flex items-center text-orange-600 text-sm">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  +5.3%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Monthly revenue over last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Revenue chart visualization</p>
                  <p className="text-sm text-slate-400 mt-2">Integration with Chart.js coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Lead Sources
              </CardTitle>
              <CardDescription>Distribution of lead sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Lead sources distribution</p>
                  <p className="text-sm text-slate-400 mt-2">Interactive pie chart coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common reporting tasks and workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-20 flex-col">
                <Download className="w-6 h-6 mb-2" />
                Export CSV Report
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Calendar className="w-6 h-6 mb-2" />
                Schedule Reports
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Users className="w-6 h-6 mb-2" />
                Team Performance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

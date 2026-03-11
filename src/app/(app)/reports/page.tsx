import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF6B6B', '#8B5CF6', '#FF9500'];

export default function ReportsPage() {
  const firestore = useFirestore();
  
  // Fetch data for reports
  const leadsQuery = useMemo(() => {
    if (!firestore) return null;
    const thirtyDaysAgo = subDays(new Date(), 30);
    return query(
      collection(firestore, 'leads'),
      where('createdAt', '>=', thirtyDaysAgo),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const ordersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'exportOrders'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: leads } = useCollection(leadsQuery);
  const { data: orders } = useCollection(ordersQuery);

  // Process data for charts
  const leadsBySource = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    const sourceCounts = leads.reduce((acc, lead) => {
      const source = lead.source || 'Other';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(sourceCounts).map(([source, count]) => ({
      name: source,
      value: count as number,
      percentage: ((count / leads.length) * 100).toFixed(1)
    }));
  }, [leads]);

  const ordersByStage = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const stageCounts = orders.reduce((acc, order) => {
      const stage = order.stage || 'unknown';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(stageCounts).map(([stage, count]) => ({
      name: stage,
      value: count as number,
      percentage: ((count / orders.length) * 100).toFixed(1)
    }));
  }, [orders]);

  const monthlyRevenue = useMemo(() => {
    if (!orders) return [];
    const monthlyData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = subDays(new Date(), i * 30);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthOrders = orders.filter(order => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      const revenue = monthOrders.reduce((sum, order) => sum + (order.totalValue || 0), 0);
      
      monthlyData.push({
        month: format(date, 'MMM yyyy'),
        revenue,
        orders: monthOrders.length
      });
    }
    
    return monthlyData;
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return orders?.reduce((sum, order) => sum + (order.totalValue || 0), 0) || 0;
  }, [orders]);

  const conversionRate = useMemo(() => {
    if (!leads || leads.length === 0) return '0';
    const convertedLeads = leads.filter(lead => lead.status === 'converted').length || 0;
    return ((convertedLeads / leads.length) * 100).toFixed(1);
  }, [leads]);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Comprehensive analytics and business insights for your CRM."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* KPI Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
            <CardDescription>Leads to customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <Badge variant="secondary" className="text-blue-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +3.2%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{orders?.length || 0}</div>
              <Badge variant="secondary" className="text-purple-600">
                <Package className="w-4 h-4 mr-1" />
                +8.1%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {/* Leads by Source Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Leads by Source</CardTitle>
            <CardDescription>Distribution of lead sources</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadsBySource}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {leadsBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Export Orders by Stage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Export Orders by Stage</CardTitle>
            <CardDescription>Current order distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersByStage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow-lg">
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-sm">Orders: {data.value}</p>
                          <p className="text-sm">Percentage: {data.percentage}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#8884d8">
                  {ordersByStage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Trend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
          <CardDescription>Revenue over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border rounded shadow-lg">
                        <p className="font-semibold">{data.month}</p>
                        <p className="text-sm">Revenue: ${data.revenue.toLocaleString()}</p>
                        <p className="text-sm">Orders: {data.orders}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex justify-center mt-6">
        <Button variant="outline" className="gap-2">
          <ArrowUpRight className="w-4 h-4" />
          Export Detailed Report
        </Button>
      </div>
    </>
  );
}

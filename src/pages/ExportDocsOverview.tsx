'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Truck,
  Ship,
  Plane,
  Eye,
  Download,
  ArrowRight
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

import { useFirestore, useUser } from '@/firebase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, trendUp }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className={`text-xs flex items-center mt-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {trend}
            </p>
          )}
        </div>
        <div className="p-2 bg-blue-100 rounded-lg">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

interface Order {
  id: string;
  orderNumber: string;
  buyerCompanyName: string;
  totalValue: number;
  status: string;
  createdAt: any;
  expectedShipmentDate?: string;
}

interface Document {
  id: string;
  title: string;
  category: string;
  fileName: string;
  createdAt: any;
}

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  dueDate: any;
}

const ExportDocsOverview: React.FC = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  if (!isBrowser) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    );
  }
  
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  
  // For now, use user.uid as orgId if userProfile.orgId is not available
  // TODO: Fix orgId assignment in user profile creation
  const orgId = userProfile?.orgId || user?.uid;
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  // Fetch data
  useEffect(() => {
    if (!orgId) return;

    const fetchData = async () => {
      try {
        // Fetch recent orders
        const ordersQuery = query(
          collection(firestore, 'exportOrders'),
          where('orgId', '==', user.orgId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          orderNumber: doc.data().orderNumber || doc.id.slice(-6).toUpperCase(),
          buyerCompanyName: doc.data().buyer.companyName,
          totalValue: doc.data().totalValue,
          status: doc.data().status,
          createdAt: doc.data().createdAt,
          expectedShipmentDate: doc.data().shipment?.expectedShipmentDate
        } as Order));
        setOrders(ordersData);

        // Fetch recent documents
        const documentsQuery = query(
          collection(firestore, 'documents'),
          where('orgId', '==', user.orgId),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const documentsSnapshot = await getDocs(documentsQuery);
        const documentsData = documentsSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          category: doc.data().category,
          fileName: doc.data().fileName,
          createdAt: doc.data().createdAt
        } as Document));
        setDocuments(documentsData);

        // Fetch recent payments
        const paymentsQuery = query(
          collection(firestore, 'payments'),
          where('orgId', '==', user.orgId),
          orderBy('dueDate', 'desc'),
          limit(20)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsData = paymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          orderId: doc.data().orderId,
          amount: doc.data().amount,
          status: doc.data().status,
          dueDate: doc.data().dueDate
        } as Payment));
        setPayments(paymentsData);

        // Prepare chart data (last 30 days)
        const thirtyDaysAgo = subDays(new Date(), 30);
        const dailyData = [];
        for (let i = 29; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dayStart = startOfDay(date);
          const dayEnd = endOfDay(date);
          
          const dayOrders = ordersData.filter(order => 
            order.createdAt.toDate() >= dayStart && order.createdAt.toDate() <= dayEnd
          );
          
          dailyData.push({
            date: format(date, 'MMM dd'),
            orders: dayOrders.length,
            value: dayOrders.reduce((sum, order) => sum + order.totalValue, 0)
          });
        }
        setChartData(dailyData);

        // Prepare status distribution data
        const statusCounts = ordersData.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status,
          value: count
        }));
        setStatusData(statusChartData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching overview data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [orgId]);

  // Calculate KPIs
  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, order) => sum + order.totalValue, 0);
  const pendingOrders = orders.filter(order => order.status === 'Pending').length;
  const totalDocuments = documents.length;
  const pendingPayments = payments.filter(payment => payment.status !== 'Paid').length;
  const overduePayments = payments.filter(payment => 
    payment.status !== 'Paid' && new Date(payment.dueDate.toDate()) < new Date()
  ).length;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'In Progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'Pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'Shipped': return <Truck className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getShipmentIcon = (date?: string) => {
    if (!date) return null;
    const shipmentDate = new Date(date);
    const today = new Date();
    const daysUntil = Math.ceil((shipmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 0) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (daysUntil <= 3) return <Clock className="h-4 w-4 text-orange-500" />;
    if (daysUntil <= 7) return <Calendar className="h-4 w-4 text-blue-500" />;
    return <Calendar className="h-4 w-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Export Documents Overview</h1>
          <p className="text-muted-foreground">Comprehensive view of your export operations</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
        <h1 className="text-3xl font-bold">Export Documents Overview</h1>
        <p className="text-muted-foreground">Comprehensive view of your export operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Orders"
          value={totalOrders.toLocaleString()}
          icon={<Package className="h-6 w-6 text-blue-600" />}
          trend="+12% from last month"
          trendUp={true}
        />
        <KPICard
          title="Total Value"
          value={`$${totalValue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
          trend="+8% from last month"
          trendUp={true}
        />
        <KPICard
          title="Pending Orders"
          value={pendingOrders.toLocaleString()}
          icon={<Clock className="h-6 w-6 text-yellow-600" />}
          trend="-3% from last week"
          trendUp={false}
        />
        <KPICard
          title="Documents"
          value={totalDocuments.toLocaleString()}
          icon={<FileText className="h-6 w-6 text-purple-600" />}
          trend="+15% from last month"
          trendUp={true}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Orders
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">{order.buyerCompanyName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${order.totalValue.toLocaleString()}</div>
                    <Badge variant="outline" className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Documents
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.slice(0, 5).map((document) => (
                <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileCheck className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">{document.title}</div>
                      <div className="text-sm text-muted-foreground">{document.fileName}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {document.category}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No documents found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Payment Overview
            <Button variant="outline" size="sm">
              View All Payments
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${payments.reduce((sum: number, p: Payment) => sum + p.amount, 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Receivables</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">${payments.filter(p => p.status !== 'Paid').reduce((sum: number, p: Payment) => sum + p.amount, 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Pending Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">${overduePayments.reduce((sum: number, p: Payment) => sum + p.amount, 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Overdue Amount</div>
            </div>
          </div>
          
          <div className="space-y-4">
            {payments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Order #{payment.orderId.slice(-6).toUpperCase()}</div>
                    <div className="text-sm text-muted-foreground">
                      Due: {format(payment.dueDate.toDate(), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="font-medium">${payment.amount.toLocaleString()}</div>
                    <Badge variant={payment.status === 'Paid' ? 'default' : payment.status === 'Overdue' ? 'destructive' : 'secondary'} className="text-xs">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No payments found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Shipments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders
              .filter(order => order.expectedShipmentDate && new Date(order.expectedShipmentDate) >= new Date())
              .sort((a, b) => new Date(a.expectedShipmentDate!).getTime() - new Date(b.expectedShipmentDate!).getTime())
              .slice(0, 5)
              .map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getShipmentIcon(order.expectedShipmentDate)}
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">{order.buyerCompanyName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {format(new Date(order.expectedShipmentDate!), 'MMM dd, yyyy')}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            {orders.filter(order => order.expectedShipmentDate && new Date(order.expectedShipmentDate) >= new Date()).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming shipments
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportDocsOverview;












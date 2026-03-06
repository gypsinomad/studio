import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, isWithinInterval, parseISO } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, DollarSign, Package, TrendingUp, Phone, Mail, Globe, UserPlus } from 'lucide-react';

interface KPICard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  loading?: boolean;
}

interface ActivityLog {
  id: string;
  type: string;
  message: string;
  userId: string;
  userName: string;
  timestamp: any;
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    totalLeads: 0,
    activeDeals: 0,
    revenueThisMonth: 0,
    pendingOrders: 0
  });
  const [leadConversions, setLeadConversions] = useState<any[]>([]);
  const [leadsBySource, setLeadsBySource] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_created': return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'lead_updated': return <Users className="h-4 w-4 text-green-500" />;
      case 'order_created': return <Package className="h-4 w-4 text-purple-500" />;
      case 'payment_received': return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case 'task_completed': return <Activity className="h-4 w-4 text-orange-500" />;
      case 'contact_added': return <Phone className="h-4 w-4 text-cyan-500" />;
      case 'email_sent': return <Mail className="h-4 w-4 text-indigo-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'WhatsApp': '#25D366',
      'Email': '#EA4335',
      'Direct': '#4285F4',
      'Web': '#FBBC04',
      'Referral': '#34A853',
      'Other': '#9E9E9E'
    };
    return colors[source] || '#9E9E9E';
  };

  useEffect(() => {
    if (!user?.orgId) return;

    const thirtyDaysAgo = subDays(new Date(), 30);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // KPI Data
    const fetchKPIData = async () => {
      try {
        // Total Leads
        const leadsQuery = query(collection(db, 'leads'), where('orgId', '==', user.orgId));
        const leadsSnapshot = await getDocs(leadsQuery);
        const totalLeads = leadsSnapshot.size;

        // Active Deals/Orders
        const ordersQuery = query(
          collection(db, 'exportOrders'),
          where('orgId', '==', user.orgId),
          where('status', 'not-in', ['Delivered', 'Cancelled'])
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const activeDeals = ordersSnapshot.size;

        // Revenue This Month
        const revenueQuery = query(
          collection(db, 'exportOrders'),
          where('orgId', '==', user.orgId),
          where('createdAt', '>=', startOfMonth)
        );
        const revenueSnapshot = await getDocs(revenueQuery);
        const revenueThisMonth = revenueSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().totalValue || 0);
        }, 0);

        // Pending Orders
        const pendingQuery = query(
          collection(db, 'exportOrders'),
          where('orgId', '==', user.orgId),
          where('status', 'in', ['Pending', 'Draft'])
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        const pendingOrders = pendingSnapshot.size;

        setKpiData({
          totalLeads,
          activeDeals,
          revenueThisMonth,
          pendingOrders
        });
      } catch (error) {
        console.error('Error fetching KPI data:', error);
      }
    };

    // Lead Conversions - Last 30 Days
    const fetchLeadConversions = async () => {
      try {
        const conversionsQuery = query(
          collection(db, 'leads'),
          where('orgId', '==', user.orgId),
          where('createdAt', '>=', thirtyDaysAgo),
          orderBy('createdAt', 'asc')
        );
        const conversionsSnapshot = await getDocs(conversionsQuery);
        
        const dailyData: Record<string, number> = {};
        
        // Initialize all days with 0
        for (let i = 29; i >= 0; i--) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          dailyData[date] = 0;
        }

        // Count leads by date
        conversionsSnapshot.docs.forEach(doc => {
          const date = format(doc.data().createdAt?.toDate() || new Date(), 'yyyy-MM-dd');
          if (dailyData[date] !== undefined) {
            dailyData[date]++;
          }
        });

        const chartData = Object.entries(dailyData).map(([date, count]) => ({
          date: format(parseISO(date), 'MMM dd'),
          count
        }));

        setLeadConversions(chartData);
      } catch (error) {
        console.error('Error fetching lead conversions:', error);
      }
    };

    // Leads by Source
    const fetchLeadsBySource = async () => {
      try {
        const sourceQuery = query(collection(db, 'leads'), where('orgId', '==', user.orgId));
        const sourceSnapshot = await getDocs(sourceQuery);
        
        const sourceCount: Record<string, number> = {};
        
        sourceSnapshot.docs.forEach(doc => {
          const source = doc.data().source || 'Other';
          sourceCount[source] = (sourceCount[source] || 0) + 1;
        });

        const chartData = Object.entries(sourceCount).map(([source, count]) => ({
          name: source,
          value: count,
          color: getSourceColor(source)
        }));

        setLeadsBySource(chartData);
      } catch (error) {
        console.error('Error fetching leads by source:', error);
      }
    };

    // Recent Activity
    const activityQuery = query(
      collection(db, 'activity_logs'),
      where('orgId', '==', user.orgId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribeActivity = onSnapshot(activityQuery, (snapshot) => {
      const activities: ActivityLog[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ActivityLog));
      setRecentActivity(activities);
    });

    fetchKPIData();
    fetchLeadConversions();
    fetchLeadsBySource();
    setLoading(false);

    return () => unsubscribeActivity();
  }, [user?.orgId]);

  const KPICard: React.FC<KPICard> = ({ title, value, icon, trend, loading }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {trend && (
              <p className="text-xs text-muted-foreground">
                {trend}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Leads"
          value={kpiData.totalLeads.toLocaleString()}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend="+12% from last month"
        />
        <KPICard
          title="Active Deals / Orders"
          value={kpiData.activeDeals.toLocaleString()}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          trend="+8% from last month"
        />
        <KPICard
          title="Revenue This Month"
          value={`$${kpiData.revenueThisMonth.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend="+15% from last month"
        />
        <KPICard
          title="Pending Orders"
          value={kpiData.pendingOrders.toLocaleString()}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          trend="2 need attention"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Lead Conversions Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Conversions – Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={leadConversions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads by Source Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Leads by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadsBySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadsBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{activity.userName}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(activity.timestamp?.toDate() || new Date(), { addSuffix: true })}</span>
                    </div>
                    {activity.relatedEntity && (
                      <Badge variant="outline" className="text-xs">
                        {activity.relatedEntity.type}: {activity.relatedEntity.name}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

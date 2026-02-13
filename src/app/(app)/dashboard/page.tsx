'use client';
import { PageHeader } from '@/components/page-header';
import { StatsCards } from './components/stats-cards';
import { RecentActivity } from './components/recent-activity';
import { useFirestore } from '@/firebase';
import type { DashboardStats, Lead, ExportOrder, LeadStatus, ExportOrderStage } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';
import { collection, getDocs, query, where } from 'firebase/firestore';


const OrdersByStageChart = dynamic(
  () => import('@/app/(app)/dashboard/components/orders-by-stage-chart').then(mod => mod.OrdersByStageChart),
  { 
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false 
  }
);

const LeadsByStatusChart = dynamic(
  () => import('@/app/(app)/dashboard/components/leads-by-status-chart').then(mod => mod.LeadsByStatusChart),
  { 
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false 
  }
);


const defaultDashboardStats: Omit<DashboardStats, 'id' | 'lastUpdatedAt'> = {
    totalLeads: 0,
    activeExportOrders: 0,
    leadsByStatus: {
        new: 0,
        contacted: 0,
        qualified: 0,
        quoted: 0,
        converted: 0,
        lost: 0
    },
    exportOrdersByStage: {
        leadReceived: 0,
        quotationSent: 0,
        orderConfirmed: 0,
        exportDocumentation: 0,
        shipmentReady: 0,
        shippedDelivered: 0,
        cancelled: 0,
        lostNoResponse: 0,
    }
};

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user, isAdmin, isLoading: isUserLoading } = useCurrentUser();
  
  const [dashboardData, setDashboardData] = useState<Omit<DashboardStats, 'id' | 'lastUpdatedAt'>>(defaultDashboardStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore || !user) {
        if (!isUserLoading) setIsLoading(false);
        return;
    }

    let isMounted = true;
    
    async function fetchData() {
        setIsLoading(true);
        setError(null);
        try {
            const leadsCollection = collection(firestore, 'leads');
            const ordersCollection = collection(firestore, 'exportOrders');

            let leadsQuery = query(leadsCollection);
            let ordersQuery = query(ordersCollection);

            if (!isAdmin) {
                leadsQuery = query(leadsCollection, where('assignedUserId', '==', user.uid));
                ordersQuery = query(ordersCollection, where('assignedUserId', '==', user.uid));
            }
            
            const [leadsSnapshot, ordersSnapshot] = await Promise.all([
                getDocs(leadsQuery),
                getDocs(ordersQuery),
            ]);

            if (!isMounted) return;

            const leads = leadsSnapshot.docs.map(doc => doc.data() as Lead);
            const orders = ordersSnapshot.docs.map(doc => doc.data() as ExportOrder);

            const totalLeads = leads.length;
            const activeExportOrders = orders.filter(o => o.stage !== 'shippedDelivered' && o.stage !== 'cancelled').length;

            const leadsByStatus = { ...defaultDashboardStats.leadsByStatus };
            for (const lead of leads) {
                if (leadsByStatus.hasOwnProperty(lead.status)) {
                    leadsByStatus[lead.status as LeadStatus]++;
                }
            }
            
            const exportOrdersByStage = { ...defaultDashboardStats.exportOrdersByStage };
            for (const order of orders) {
                 if (exportOrdersByStage.hasOwnProperty(order.stage)) {
                    exportOrdersByStage[order.stage as ExportOrderStage]++;
                }
            }
            
            setDashboardData({
                totalLeads,
                activeExportOrders,
                leadsByStatus,
                exportOrdersByStage
            });

        } catch (err: any) {
            console.error("Dashboard fetch error:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    }
    
    fetchData();

    return () => { isMounted = false; };
  }, [firestore, user, isAdmin, isUserLoading]);


  if (isLoading || isUserLoading) {
    return <DashboardSkeleton />;
  }

  const leadsByStatusChartData = dashboardData?.leadsByStatus ? Object.entries(dashboardData.leadsByStatus).map(([name, value]) => ({ name, value })) : [];
  const exportOrdersByStageChartData = dashboardData?.exportOrdersByStage ? Object.entries(dashboardData.exportOrdersByStage).map(([name, value]) => ({ name, value })) : [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's a snapshot of your business."
      />

      <div className="space-y-6 animate-in fade-in duration-500">
        <StatsCards 
            isLoading={isLoading}
            totalLeads={dashboardData?.totalLeads} 
            activeExportOrders={dashboardData?.activeExportOrders} 
        />
        
        <div className="grid gap-6 md:grid-cols-2">
           {error ? (
             <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-destructive">Dashboard Data Not Available</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Could not load your dashboard statistics due to an error: {error}</p>
                </CardContent>
             </Card>
           ) : (
            <>
              <LeadsByStatusChart data={leadsByStatusChartData} />
              <OrdersByStageChart data={exportOrdersByStageChartData} />
            </>
           )}
        </div>
        
        <RecentActivity />
      </div>
    </>
  );
}

'use client';
import { PageHeader } from '@/components/page-header';
import { StatsCards } from './components/stats-cards';
import { RecentActivity } from './components/recent-activity';
import { useFirestore } from '@/firebase';
import type { DashboardStats, Lead, ExportOrder, LeadStatus, ExportOrderStage } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { OrdersByStageChart } from './components/orders-by-stage-chart';
import { LeadsByStatusChart } from './components/leads-by-status-chart';
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';
import { collection, getDocs, query } from 'firebase/firestore';
import { backfillActivityLog } from '@/utils/backfillActivityLog';

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
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration issues with charts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // One-time backfill for existing data
  useEffect(() => {
    const hasBackfilled = localStorage.getItem('activityBackfilled');
    if (!hasBackfilled && user?.role === 'admin') {
      backfillActivityLog().then(() => {
        localStorage.setItem('activityBackfilled', 'true');
      }).catch(error => {
        console.error('Backfill failed:', error);
      });
    }
  }, [user]);

  useEffect(() => {
    if (!firestore || !user) {
        if (!isUserLoading) setIsLoading(false);
        return;
    }

    let mounted = true;
    
    async function fetchData() {
        setIsLoading(true);
        setError(null);
        try {
            const leadsCollection = collection(firestore, 'leads');
            const ordersCollection = collection(firestore, 'exportOrders');

            const leadsQuery = query(leadsCollection);
            const ordersQuery = query(ordersCollection);
            
            const [leadsSnapshot, ordersSnapshot] = await Promise.all([
                getDocs(leadsQuery),
                getDocs(ordersQuery),
            ]);

            if (!mounted) return;

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
            setError("Unable to load dashboard statistics. Please check your permissions or contact your administrator.");
        } finally {
            if (mounted) {
                setIsLoading(false);
            }
        }
    }
    
    fetchData();

    return () => { mounted = false; };
  }, [firestore, user, isAdmin, isUserLoading]);


  if (isLoading || isUserLoading) {
    return <DashboardSkeleton />;
  }

  const leadsByStatusChartData = dashboardData?.leadsByStatus ? Object.entries(dashboardData.leadsByStatus).map(([name, value]) => ({ name, value })) : [];
  const exportOrdersByStageChartData = dashboardData?.exportOrdersByStage ? Object.entries(dashboardData.exportOrdersByStage).map(([name, value]) => ({ name, value })) : [];

  return (
    <>
      <PageHeader
        title="Global Dashboard"
        description="Monitor your mercantile empire with real-time analytics and trade metrics."
      />

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <StatsCards 
            isLoading={isLoading}
            totalLeads={dashboardData?.totalLeads} 
            activeExportOrders={dashboardData?.activeExportOrders} 
        />
        
        <div className="grid gap-8 md:grid-cols-2">
           {error ? (
             <Card className="md:col-span-2 border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="text-destructive">System Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground font-medium">Could not load statistics: {error}</p>
                </CardContent>
             </Card>
           ) : (
            <>
              {isMounted ? (
                <>
                  <LeadsByStatusChart data={leadsByStatusChartData} />
                  <OrdersByStageChart data={exportOrdersByStageChartData} />
                </>
              ) : (
                <>
                  <Skeleton className="h-[400px] w-full rounded-2xl" />
                  <Skeleton className="h-[400px] w-full rounded-2xl" />
                </>
              )}
            </>
           )}
        </div>
        
        <RecentActivity />
      </div>
    </>
  );
}
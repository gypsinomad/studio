'use client';
import { PageHeader } from '@/components/page-header';
import { StatsCards } from './components/stats-cards';
import { LeadsByStatusChart } from './components/leads-by-status-chart';
import { OrdersByStageChart } from './components/orders-by-stage-chart';
import { RecentActivity } from './components/recent-activity';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { DashboardStats } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const dashboardStatsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Read from the pre-aggregated stats document for this user
    return doc(firestore, 'dashboardStats', user.uid);
  }, [firestore, user]);
  
  const { data: dashboardData, isLoading } = useDoc<DashboardStats>(dashboardStatsRef);

  const leadsByStatus = dashboardData?.leadsByStatus ? Object.entries(dashboardData.leadsByStatus).map(([name, value]) => ({ name, value })) : [];
  const exportOrdersByStage = dashboardData?.exportOrdersByStage ? Object.entries(dashboardData.exportOrdersByStage).map(([name, value]) => ({ name, value })) : [];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's a snapshot of your business."
      />

      <div className="space-y-6">
        <StatsCards 
            isLoading={isLoading}
            totalLeads={dashboardData?.totalLeads} 
            activeExportOrders={dashboardData?.activeExportOrders} 
        />
        
        <div className="grid gap-6 md:grid-cols-2">
           {isLoading && <>
             <Skeleton className="h-[400px] w-full" />
             <Skeleton className="h-[400px] w-full" />
           </>}
           {!isLoading && !dashboardData && (
             <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Dashboard Data Not Available</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Your dashboard statistics are generated periodically by a backend process. Please check back later or ensure the required backend functions are active.</p>
                </CardContent>
             </Card>
           )}
           {!isLoading && dashboardData && leadsByStatus.length > 0 && <LeadsByStatusChart data={leadsByStatus} />}
           {!isLoading && dashboardData && exportOrdersByStage.length > 0 && <OrdersByStageChart data={exportOrdersByStage} />}
        </div>
        
        <RecentActivity />
      </div>
    </>
  );
}

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
           {!isLoading && leadsByStatus.length > 0 && <LeadsByStatusChart data={leadsByStatus} />}
           {!isLoading && exportOrdersByStage.length > 0 && <OrdersByStageChart data={exportOrdersByStage} />}
        </div>
        
        <RecentActivity />
      </div>
    </>
  );
}

    
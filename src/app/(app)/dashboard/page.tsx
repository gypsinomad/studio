'use client';
import { PageHeader } from '@/components/page-header';
import { StatsCards } from './components/stats-cards';
import { LeadsByStatusChart } from './components/leads-by-status-chart';
import { OrdersByStageChart } from './components/orders-by-stage-chart';
import { RecentActivity } from './components/recent-activity';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import type { Lead, ExportOrder } from '@/lib/types';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'leads'), where('assignedUserId', '==', user.uid));
  }, [firestore, user]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'exportOrders'), where('assignedUserId', '==', user.uid));
  }, [firestore, user]);
  
  const { data: leads } = useCollection<Lead>(leadsQuery);
  const { data: orders } = useCollection<ExportOrder>(ordersQuery);

  const dashboardData = useMemo(() => {
    const leadsByStatus = (leads || []).reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const exportOrdersByStage = (orders || []).reduce((acc, order) => {
        acc[order.stage] = (acc[order.stage] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const activeExportOrders = (orders || []).filter(o => !['shippedDelivered', 'cancelled', 'lostNoResponse'].includes(o.stage)).length;

    return {
        totalLeads: leads?.length ?? 0,
        activeExportOrders,
        leadsByStatus: Object.entries(leadsByStatus).map(([name, value]) => ({ name, value })),
        exportOrdersByStage: Object.entries(exportOrdersByStage).map(([name, value]) => ({ name, value })),
    }
  }, [leads, orders]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's a snapshot of your business."
      />

      <div className="space-y-6">
        <StatsCards 
            totalLeads={dashboardData.totalLeads} 
            activeExportOrders={dashboardData.activeExportOrders} 
        />
        
        <div className="grid gap-6 md:grid-cols-2">
            <LeadsByStatusChart data={dashboardData.leadsByStatus} id="leads-by-status-chart" />
            <OrdersByStageChart data={dashboardData.exportOrdersByStage} id="orders-by-stage-chart" />
        </div>
        
        <RecentActivity />
      </div>
    </>
  );
}

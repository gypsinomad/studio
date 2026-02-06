'use client';
import { PageHeader } from '@/components/page-header';
import { StatsCards } from './components/stats-cards';
import { LeadsByStatusChart } from './components/leads-by-status-chart';
import { OrdersByStageChart } from './components/orders-by-stage-chart';
import { RecentActivity } from './components/recent-activity';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { DashboardStats } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

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
        enquiry: 0,
        proformaIssued: 0,
        advanceReceived: 0,
        production: 0,
        exportDocumentation: 0,
        readyToShip: 0,
        shipped: 0,
        closed: 0,
        cancelled: 0,
        lostNoResponse: 0,
    }
};

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isCreating, setIsCreating] = useState(false);


  const dashboardStatsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Read from the pre-aggregated stats document for this user
    return doc(firestore, 'dashboardStats', user.uid);
  }, [firestore, user]);
  
  const { data: dashboardData, isLoading: isLoadingDoc, error } = useDoc<DashboardStats>(dashboardStatsRef);

  useEffect(() => {
      const shouldCreate = !isLoadingDoc && !dashboardData && dashboardStatsRef && !isCreating && !error;
      if (shouldCreate) {
          const createStats = async () => {
              setIsCreating(true);
              console.log("Dashboard stats document not found. Creating with defaults...");
              try {
                  await setDoc(dashboardStatsRef, {
                      ...defaultDashboardStats,
                      lastUpdatedAt: serverTimestamp(),
                  });
                   console.log("Successfully created dashboard stats document.");
              } catch (e) {
                  console.error("Failed to auto-create dashboard stats:", e);
              } finally {
                  setIsCreating(false);
              }
          };
          createStats();
      }
  }, [isLoadingDoc, dashboardData, dashboardStatsRef, isCreating, error]);


  const isLoading = isLoadingDoc || isCreating;

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
           {!isLoading && (!dashboardData && error) && (
             <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Dashboard Data Not Available</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Could not load your dashboard statistics due to an error. Please check your Firestore permissions or the browser console for more details.</p>
                </CardContent>
             </Card>
           )}
           {!isLoading && dashboardData && <LeadsByStatusChart data={leadsByStatus} />}
           {!isLoading && dashboardData && <OrdersByStageChart data={exportOrdersByStage} />}
        </div>
        
        <RecentActivity />
      </div>
    </>
  );
}

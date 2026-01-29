import { PageHeader } from '@/components/page-header';
import { getDashboardData } from '@/lib/data';
import { StatsCards } from './components/stats-cards';
import { LeadsByStatusChart } from './components/leads-by-status-chart';
import { OrdersByStageChart } from './components/orders-by-stage-chart';
import { RecentActivity } from './components/recent-activity';

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's a snapshot of your business."
      />

      <div className="space-y-6">
        <StatsCards 
            totalLeads={data.totalLeads} 
            activeExportOrders={data.activeExportOrders} 
        />
        
        <div className="grid gap-6 md:grid-cols-2">
            <LeadsByStatusChart data={data.leadsByStatus} />
            <OrdersByStageChart data={data.exportOrdersByStage} />
        </div>
        
        <RecentActivity />
      </div>
    </>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Ship, DollarSign, ListChecks } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardsProps {
  totalLeads?: number;
  activeExportOrders?: number;
  isLoading: boolean;
  totalRevenue?: number;
  tasksDue?: number;
}

function StatCard({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean }) {
    if (isLoading) {
        return <Skeleton className="h-40 w-full rounded-2xl" />
    }
    
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-stone-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-spice-600" />
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-spice-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">{title}</h3>
            <p className="text-4xl font-headline font-bold text-stone-900">{value}</p>
            <p className="text-xs text-stone-500 mt-2 font-medium">{description}</p>
        </div>
    )
}

export function StatsCards({ totalLeads, activeExportOrders, isLoading, totalRevenue, tasksDue }: StatsCardsProps) {

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Total Leads"
        value={isLoading ? "..." : totalLeads ?? 0}
        icon={Sprout}
        description="All-time leads in the system"
        isLoading={isLoading}
      />
       <StatCard 
        title="Active Export Orders"
        value={isLoading ? "..." : activeExportOrders ?? 0}
        icon={Ship}
        description="Orders not yet delivered"
        isLoading={isLoading}
      />
       <StatCard 
        title="Revenue (MTD)"
        value={isLoading ? "..." : totalRevenue ? formatCurrency(totalRevenue) : "$0"}
        icon={DollarSign}
        description="Month-to-date revenue from all orders"
        isLoading={isLoading}
      />
       <StatCard 
        title="Tasks Due"
        value={isLoading ? "..." : tasksDue ?? 0}
        icon={ListChecks}
        description="Tasks requiring attention today"
        isLoading={isLoading}
      />
    </div>
  );
}
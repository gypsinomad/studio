import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Ship, DollarSign, ListChecks } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardsProps {
  totalLeads?: number;
  activeExportOrders?: number;
  isLoading: boolean;
}

function StatCard({ title, value, icon: Icon, description, isLoading }: { title: string, value: string | number, icon: React.ElementType, description: string, isLoading: boolean }) {
    if (isLoading) {
        return <Skeleton className="h-40 w-full" />
    }
    
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-stone-200 p-6 hover:shadow-xl hover:border-spice-200 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-spice-500 to-spice-600" />
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-spice-50 to-spice-100 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-spice-600" />
                </div>
            </div>
            <h3 className="text-sm font-medium text-stone-600 mb-1">{title}</h3>
            <p className="text-4xl font-headline font-bold text-stone-900">{value}</p>
            <p className="text-xs text-stone-500 mt-2">{description}</p>
        </div>
    )
}

export function StatsCards({ totalLeads, activeExportOrders, isLoading }: StatsCardsProps) {

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
        value="..."
        icon={DollarSign}
        description="Coming soon"
        isLoading={isLoading}
      />
       <StatCard 
        title="Tasks Due"
        value="..."
        icon={ListChecks}
        description="Coming soon"
        isLoading={isLoading}
      />
    </div>
  );
}

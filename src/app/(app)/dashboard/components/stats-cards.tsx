import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Ship } from 'lucide-react';

interface StatsCardsProps {
  totalLeads: number;
  activeExportOrders: number;
}

export function StatsCards({ totalLeads, activeExportOrders }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <Sprout className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLeads}</div>
          <p className="text-xs text-muted-foreground">+2 from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Export Orders</CardTitle>
          <Ship className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeExportOrders}</div>
           <p className="text-xs text-muted-foreground">+1 since last week</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
          <span className="h-4 w-4 text-muted-foreground">$</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$12,450</div>
           <p className="text-xs text-muted-foreground">Estimate based on confirmed orders</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks Due Today</CardTitle>
          <span className="h-4 w-4 text-muted-foreground">!</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3</div>
           <p className="text-xs text-muted-foreground">1 Overdue</p>
        </CardContent>
      </Card>
    </div>
  );
}

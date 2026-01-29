'use client';

import { TrendingUp } from 'lucide-react';
import { Pie, PieChart, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { LeadStatus } from '@/lib/types';

const chartConfig = {
  value: {
    label: 'Leads',
  },
  new: {
    label: 'New',
    color: 'hsl(var(--chart-1))',
  },
  contacted: {
    label: 'Contacted',
    color: 'hsl(var(--chart-2))',
  },
  qualified: {
    label: 'Qualified',
    color: 'hsl(var(--chart-3))',
  },
  quoted: {
    label: 'Quoted',
    color: 'hsl(var(--chart-4))',
  },
  converted: {
    label: 'Converted',
    color: 'hsl(var(--chart-5))',
  },
  lost: {
    label: 'Lost',
    color: 'hsl(var(--muted))',
  },
} satisfies ChartConfig;

interface LeadsByStatusChartProps {
    data: { name: string, value: number }[];
}

export function LeadsByStatusChart({ data }: LeadsByStatusChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads by Status</CardTitle>
        <CardDescription>Current distribution of leads in the pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
             {data.map((entry) => (
                <Cell key={entry.name} fill={chartConfig[entry.name as keyof typeof chartConfig]?.color} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

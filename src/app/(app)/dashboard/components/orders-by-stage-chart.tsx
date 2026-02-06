'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
} from '@/components/ui/chart';
import type { ExportOrderStage } from '@/lib/types';

const chartConfig = {
  orders: {
    label: 'Orders',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

interface OrdersByStageChartProps {
    data: { name: string, value: number }[];
}

const stageLabels: Record<ExportOrderStage, string> = {
    enquiry: "Enquiry",
    proformaIssued: "Proforma",
    advanceReceived: "Advance",
    production: "Production",
    readyToShip: "Ready",
    shipped: "Shipped",
    closed: "Closed",
    cancelled: "Cancelled",
}

export function OrdersByStageChart({ data }: OrdersByStageChartProps) {
    const chartData = data.map(item => ({...item, name: stageLabels[item.name as ExportOrderStage] || item.name}));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Orders by Stage</CardTitle>
        <CardDescription>Active and completed orders in the pipeline.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} id="orders-by-stage" className="max-h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
             <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar dataKey="value" fill="var(--color-orders)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

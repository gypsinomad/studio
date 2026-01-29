import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sprout, ClipboardCheck, Ship } from 'lucide-react';

const activities = [
  {
    icon: <Sprout className="h-4 w-4" />,
    title: "New Lead 'David Miller'",
    description: 'Assigned to Raj Patel from Facebook.',
    time: '5m ago',
  },
  {
    icon: <ClipboardCheck className="h-4 w-4" />,
    title: 'Task Completed',
    description: 'Priya Singh marked "Send initial email" as done.',
    time: '1h ago',
  },
  {
    icon: <Ship className="h-4 w-4" />,
    title: 'Order Shipped',
    description: 'Order EO-01 to Mexico has been shipped.',
    time: '3h ago',
  },
  {
    icon: <Sprout className="h-4 w-4" />,
    title: "New Lead 'Yuki Tanaka'",
    description: 'Assigned to Priya Singh from Website.',
    time: '1d ago',
  },
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>A log of recent events in the CRM.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                {activity.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm text-muted-foreground">
                {activity.description}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{activity.time}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

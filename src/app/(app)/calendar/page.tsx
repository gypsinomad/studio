'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Ship, 
  ClipboardList, 
  Users, 
  Bell,
  ArrowUpRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, isPast } from 'date-fns';
import type { Meeting, Task, ExportOrder, Reminder } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type EventType = 'meeting' | 'task' | 'milestone' | 'reminder';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: EventType;
  details?: string;
  href: string;
}

const eventColors: Record<EventType, string> = {
  meeting: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100',
  task: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100',
  milestone: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100',
  reminder: 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100',
};

const eventIcons: Record<EventType, any> = {
  meeting: Users,
  task: ClipboardList,
  milestone: Ship,
  reminder: Bell,
};

export default function TeamCalendarPage() {
  const { user } = useCurrentUser();
  const firestore = useFirestore();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Queries
  const meetingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'meetings'), limit(50));
  }, [firestore]);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'), limit(50));
  }, [firestore]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'exportOrders'), limit(50));
  }, [firestore]);

  const remindersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'reminders'), limit(50));
  }, [firestore, user]);

  const { data: meetings } = useCollection<Meeting>(meetingsQuery);
  const { data: tasks } = useCollection<Task>(tasksQuery);
  const { data: orders } = useCollection<ExportOrder>(ordersQuery);
  const { data: reminders } = useCollection<Reminder>(remindersQuery);

  const toDate = (ts: any) => ts?.toDate ? ts.toDate() : new Date(ts);

  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    meetings?.forEach(m => events.push({
      id: m.id!,
      title: m.title,
      date: toDate(m.startAt),
      type: 'meeting',
      href: '/chat',
    }));

    tasks?.forEach(t => events.push({
      id: t.id!,
      title: t.title,
      date: toDate(t.dueDate),
      type: 'task',
      href: '/tasks',
    }));

    orders?.forEach(o => {
      if (o.etd) events.push({ id: `${o.id}-etd`, title: `ETD: ${o.title}`, date: toDate(o.etd), type: 'milestone', href: `/export-orders/${o.id}/edit` });
      if (o.eta) events.push({ id: `${o.id}-eta`, title: `ETA: ${o.title}`, date: toDate(o.eta), type: 'milestone', href: `/export-orders/${o.id}/edit` });
      if (o.paymentDueDate) events.push({ id: `${o.id}-pay`, title: `Payment: ${o.title}`, date: toDate(o.paymentDueDate), type: 'milestone', href: `/export-orders/${o.id}/edit` });
    });

    reminders?.forEach(r => events.push({
      id: r.id!,
      title: r.title,
      date: toDate(r.fireAt),
      type: 'reminder',
      href: '/chat',
    }));

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [meetings, tasks, orders, reminders]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const upcomingEvents = useMemo(() => {
    return allEvents.filter(e => !isPast(e.date) || isToday(e.date)).slice(0, 8);
  }, [allEvents]);

  return (
    <div className="space-y-8 pb-20">
      <PageHeader title="Team Calendar" description="Aggregate view of meetings, tasks, and shipment milestones.">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <div className="flex items-center border rounded-xl overflow-hidden shadow-sm">
            <Button variant="ghost" size="icon" className="rounded-none border-r" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-none" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button className="rounded-xl"><Plus className="size-4 mr-2" /> Event</Button>
        </div>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* CALENDAR GRID */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg font-bold text-slate-900">{format(currentDate, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-4">
                {Object.entries(eventColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className={cn("size-2 rounded-full", color.split(' ')[0].replace('bg-', 'bg-'))} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{type}</span>
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b bg-slate-50/30">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 border-collapse">
                {/* Empty cells for leading days */}
                {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/20 border-r border-b" />
                ))}
                
                {monthDays.map(day => {
                  const dayEvents = allEvents.filter(e => isSameDay(e.date, day));
                  return (
                    <div key={day.toString()} className={cn(
                      "min-h-[140px] border-r border-b p-2 transition-colors",
                      isToday(day) ? "bg-indigo-50/30" : "hover:bg-slate-50/50"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "size-7 flex items-center justify-center rounded-full text-xs font-bold",
                          isToday(day) ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500"
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map(event => (
                          <Link key={event.id} href={event.href}>
                            <div className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-bold truncate border transition-all active:scale-95 mb-1",
                              eventColors[event.type]
                            )}>
                              {event.title}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR - UP NEXT */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-xl">Today & Up Next</CardTitle>
              <CardDescription>Consolidated timeline of your operations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-6 pt-0 space-y-6">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <CalendarIcon className="mx-auto size-10 opacity-20 mb-3" />
                      <p className="font-medium">No upcoming events.</p>
                    </div>
                  ) : (
                    upcomingEvents.map((event, idx) => {
                      const Icon = eventIcons[event.type];
                      return (
                        <Link key={event.id} href={event.href} className="block group">
                          <div className="relative flex gap-4">
                            {idx !== upcomingEvents.length - 1 && (
                              <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-slate-100 group-hover:bg-indigo-100 transition-colors" />
                            )}
                            <div className={cn(
                              "size-10 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm shrink-0 z-10 transition-transform group-hover:scale-110",
                              eventColors[event.type].split(' ')[0]
                            )}>
                              <Icon className="size-4" />
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-widest",
                                  eventColors[event.type].split(' ')[1]
                                )}>
                                  {format(event.date, 'p')} • {isToday(event.date) ? 'Today' : format(event.date, 'MMM d')}
                                </span>
                                <ArrowUpRight className="size-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                              </div>
                              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{event.title}</p>
                              {event.details && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.details}</p>}
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none shadow-2xl shadow-indigo-200">
            <CardContent className="p-8">
              <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <Clock className="size-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold">Timezone Guard</h3>
              <p className="text-indigo-200 text-sm mt-2 leading-relaxed">
                All dates are automatically normalized to your organization's local time (IST).
              </p>
              <Button variant="outline" className="w-full mt-6 bg-white/10 border-white/20 hover:bg-white/20 text-white font-bold h-11">
                Configure Regional
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
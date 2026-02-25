
'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isPast, addDays } from 'date-fns';
import { CheckCircle2, Clock, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import type { Task, Meeting, Message } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function MyDayPage() {
  const { user, userProfile } = useCurrentUser();
  const firestore = useFirestore();

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'tasks'),
      where('assigneeId', '==', user.uid),
      where('status', '!=', 'done'),
      orderBy('dueDate', 'asc'),
      limit(10)
    );
  }, [firestore, user]);

  const meetingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const tomorrow = addDays(new Date(), 1);
    return query(
      collection(firestore, 'meetings'),
      where('participants', 'array-contains', user.uid),
      where('startAt', '>=', Timestamp.fromDate(new Date())),
      where('startAt', '<=', Timestamp.fromDate(tomorrow)),
      orderBy('startAt', 'asc')
    );
  }, [firestore, user]);

  const { data: tasks, isLoading: tasksLoading } = useCollection<Task>(tasksQuery);
  const { data: meetings, isLoading: meetingsLoading } = useCollection<Meeting>(meetingsQuery);

  const toDate = (ts: any) => ts?.toDate ? ts.toDate() : new Date(ts);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <PageHeader 
        title={`Good Day, ${userProfile?.displayName?.split(' ')[0] || 'Member'}`}
        description="Here is your personal overview for today's trade operations."
      />

      <div className="grid gap-8 md:grid-cols-12">
        {/* TASKS SECTION */}
        <div className="md:col-span-7 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Your Focus Tasks</CardTitle>
                <CardDescription>Overdue and upcoming priorities</CardDescription>
              </div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                {tasks?.length || 0} Pending
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasksLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
              ) : !tasks || tasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="mx-auto size-10 opacity-20 mb-3" />
                  <p className="font-medium">You're all caught up!</p>
                </div>
              ) : (
                tasks.map(task => {
                  const due = toDate(task.dueDate);
                  const isOverdue = isPast(due) && !isToday(due);
                  return (
                    <div key={task.id} className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all">
                      <div className={cn(
                        "p-2 rounded-xl shrink-0",
                        isOverdue ? "bg-red-50 text-red-600" : "bg-white text-slate-400 border border-slate-200"
                      )}>
                        {isOverdue ? <AlertCircle className="size-5" /> : <Clock className="size-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{task.title}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {isToday(due) ? "Due Today" : format(due, 'PP')}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 rounded-lg">
                        <Link href="/tasks"><ArrowRight className="size-4" /></Link>
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* MEETINGS & HIGHLIGHTS */}
        <div className="md:col-span-5 space-y-8">
          <Card className="bg-indigo-900 text-white border-none shadow-2xl shadow-indigo-200">
            <CardHeader>
              <CardTitle className="text-white">Next 24h Meetings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {meetingsLoading ? (
                <Skeleton className="h-20 w-full bg-indigo-800/50" />
              ) : !meetings || meetings.length === 0 ? (
                <p className="text-indigo-300 text-sm italic">No internal meetings scheduled.</p>
              ) : (
                meetings.map(meeting => (
                  <div key={meeting.id} className="p-4 rounded-xl bg-indigo-800/40 border border-indigo-700/50">
                    <p className="font-bold">{meeting.title}</p>
                    <div className="flex items-center gap-2 mt-2 text-indigo-300 text-xs font-bold uppercase">
                      <Calendar className="size-3" />
                      {format(toDate(meeting.startAt), 'p')} — {format(toDate(meeting.endAt), 'p')}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="h-1.5 bg-amber-500" />
            <CardHeader>
              <CardTitle className="text-lg">Recent workspace activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3 text-sm">
                  <div className="size-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <p className="text-slate-600">New mentions in <span className="font-bold text-slate-900">#Operations</span></p>
                </div>
                <div className="flex gap-3 text-sm">
                  <div className="size-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <p className="text-slate-600">Task assigned by <span className="font-bold text-slate-900">Admin</span></p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-6 rounded-xl border-slate-200" asChild>
                <Link href="/chat">Open Workspace</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

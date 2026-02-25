'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import type { User, Notification } from '@/lib/types';
import { AiUsageIndicator } from './ai-usage-indicator';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMemo } from 'react';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useAISettings } from '@/hooks/use-ai-settings';
import { PWAInstallButton } from './pwa-install-button';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { collection, query, where, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function NotificationsPanel({ userId }: { userId: string }) {
  const firestore = useFirestore();
  const q = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore, userId]);

  const { data: notifications, isLoading } = useCollection<Notification>(q);
  const unreadCount = notifications?.filter(n => !n.readAt).length || 0;

  const markAsRead = async (id: string) => {
    if (!firestore) return;
    updateDoc(doc(firestore, 'notifications', id), { readAt: new Date() });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 shadow-sm transition-all hover:-translate-y-0.5">
          <Bell className="size-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 size-2.5 bg-red-500 rounded-full border-2 border-white ring-4 ring-red-500/20" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl border-none shadow-2xl overflow-hidden">
        <DropdownMenuLabel className="p-4 bg-slate-50 border-b flex items-center justify-between">
          <span className="font-bold text-slate-900">Notifications</span>
          <Badge className="bg-indigo-100 text-indigo-700 border-none">{unreadCount} New</Badge>
        </DropdownMenuLabel>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4"><Skeleton className="h-12 w-full" /></div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-sm">No recent activity.</div>
          ) : (
            notifications.map(n => (
              <DropdownMenuItem 
                key={n.id} 
                className={cn("p-4 flex flex-col items-start gap-1 cursor-pointer", !n.readAt && "bg-indigo-50/50")}
                onClick={() => markAsRead(n.id!)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-slate-900">{n.title}</span>
                  {!n.readAt && <div className="size-2 rounded-full bg-indigo-500" />}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{n.body}</p>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {n.createdAt ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : ''}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <Button variant="ghost" className="w-full rounded-none h-12 text-xs font-bold text-indigo-600 hover:bg-slate-50">View All Updates</Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppHeader() {
  const auth = useAuth();
  const { user, userProfile, isLoading: isUserLoading, isAdmin } = useCurrentUser();
  const { settings, usage, isLoading: isAiLoading } = useAISettings();

  const mergedUser = useMemo(() => {
    if (!user || !userProfile) return null;
    const fullUser: User = {
        ...userProfile,
        authUid: user.uid,
        email: user.email || userProfile.email,
        displayName: user.displayName || userProfile.displayName,
        avatarUrl: user.photoURL || userProfile.avatarUrl,
    };
    return fullUser;
  }, [user, userProfile]);

  const isLoading = isUserLoading || (isAdmin && isAiLoading);

  const renderHeaderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      );
    }

    if (!mergedUser) {
      return (
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => auth && signOut(auth)}>Logout</Button>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-4">
        <PWAInstallButton />
        <NotificationsPanel userId={mergedUser.authUid} />
        {isAdmin && <AiUsageIndicator settings={settings} usage={usage} isLoading={isAiLoading} />}
        <div className="h-8 w-[1px] bg-slate-200 hidden sm:block mx-2" />
        <UserNav user={mergedUser} />
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-8 flex h-20 items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div className="hidden sm:block">
                 <h2 className="text-xl font-headline font-bold text-slate-900 leading-tight">SpiceRoute</h2>
                 <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-indigo-500">Global Mercantile</p>
            </div>
        </div>
        <div className="ml-auto">
          {renderHeaderContent()}
        </div>
      </div>
    </header>
  );
}

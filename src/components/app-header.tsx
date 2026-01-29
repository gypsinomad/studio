'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import type { AISettings, AIUsageStats } from '@/lib/types';
import { AiUsageIndicator } from './ai-usage-indicator';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { getMonthKey } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

export function AppHeader() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'ai');
  }, [firestore]);

  const usageDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'usageStats', getMonthKey());
  }, [firestore]);

  const { data: settings, isLoading: settingsLoading } = useDoc<AISettings>(settingsDocRef);
  const { data: usage, isLoading: usageLoading } = useDoc<AIUsageStats>(usageDocRef);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userProfileRef);

  const mergedUser = useMemo(() => {
    if (!user || !userProfile) return null;
    return { ...user, ...userProfile };
  }, [user, userProfile]);


  if (isUserLoading || !mergedUser) {
    return (
       <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <h1 className="hidden text-xl font-semibold font-headline md:block">
                SpiceRoute CRM
            </h1>
            <div className="ml-auto flex items-center gap-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
        </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="hidden text-xl font-semibold font-headline md:block">
        SpiceRoute CRM
      </h1>
      <div className="ml-auto flex items-center gap-4">
        <AiUsageIndicator settings={settings} usage={usage} />
        <UserNav user={mergedUser} />
      </div>
    </header>
  );
}

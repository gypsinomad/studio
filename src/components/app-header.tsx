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
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';

export function AppHeader() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const isAdmin = userProfile?.role === 'admin';

  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return doc(firestore, 'settings', 'ai');
  }, [firestore, isAdmin]);

  const usageDocRef = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return doc(firestore, 'usageStats', getMonthKey());
  }, [firestore, isAdmin]);

  const { data: settings } = useDoc<AISettings>(settingsDocRef);
  const { data: usage } = useDoc<AIUsageStats>(usageDocRef);
  
  const mergedUser = useMemo(() => {
    if (!user || !userProfile) return null;
    return { ...user, ...userProfile };
  }, [user, userProfile]);


  if (isUserLoading || isProfileLoading) {
    return (
       <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <h1 className="hidden text-xl font-semibold font-headline md:block">
                SpiceRoute CRM
            </h1>
            <div className="ml-auto flex items-center gap-4">
                {isAdmin && <Skeleton className="h-8 w-24" />}
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
        </header>
    )
  }

  if (!mergedUser) {
    // This can happen if the user is authenticated but the profile doc doesn't exist yet or failed to load.
    // Or if the user is not authenticated. The AuthGuard should prevent this for this layout, but as a fallback:
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
             <div className="md:hidden">
                 <SidebarTrigger />
             </div>
             <h1 className="hidden text-xl font-semibold font-headline md:block">
                 SpiceRoute CRM
             </h1>
             <div className="ml-auto flex items-center gap-4">
                 <p className="text-sm text-destructive">Could not load user profile.</p>
                 <Button variant="outline" onClick={() => signOut(auth)}>Logout</Button>
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
        {isAdmin && <AiUsageIndicator settings={settings} usage={usage} />}
        <UserNav user={mergedUser} />
      </div>
    </header>
  );
}

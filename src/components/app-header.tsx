'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import type { AISettings, AIUsageStats, User } from '@/lib/types';
import { AiUsageIndicator } from './ai-usage-indicator';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { getMonthKey } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';

export function AppHeader() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, userProfile, isLoading: isUserLoading, isAdmin } = useCurrentUser();

  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return doc(firestore, 'settings', 'ai');
  }, [firestore, isAdmin]);

  const usageDocRef = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return doc(firestore, 'usageStats', getMonthKey());
  }, [firestore, isAdmin]);

  const { data: settings, isLoading: isLoadingSettings } = useDoc<AISettings>(settingsDocRef);
  const { data: usage, isLoading: isLoadingUsage } = useDoc<AIUsageStats>(usageDocRef);
  
  const mergedUser = useMemo(() => {
    if (!user || !userProfile) return null;
    // Combine the auth user and firestore profile into a single object
    const fullUser: User = {
        ...userProfile,
        authUid: user.uid,
        email: user.email || userProfile.email,
        displayName: user.displayName || userProfile.displayName,
        avatarUrl: user.photoURL || userProfile.avatarUrl,
    };
    return fullUser;
  }, [user, userProfile]);

  const isLoading = isUserLoading || (isAdmin && (isLoadingSettings || isLoadingUsage));

  if (isLoading) {
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

  if (!mergedUser) {
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
        {isAdmin && <AiUsageIndicator settings={settings} usage={usage} isLoading={isLoadingSettings || isLoadingUsage} />}
        <UserNav user={mergedUser} />
      </div>
    </header>
  );
}

    

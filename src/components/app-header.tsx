'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import type { User } from '@/lib/types';
import { AiUsageIndicator } from './ai-usage-indicator';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMemo } from 'react';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useAISettings } from '@/hooks/use-ai-settings';

export function AppHeader() {
  const auth = useAuth();
  const { user, userProfile, isLoading: isUserLoading, isAdmin } = useCurrentUser();
  const { settings, usage, isLoading: isAiLoading } = useAISettings();

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

  const isLoading = isUserLoading || (isAdmin && isAiLoading);

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
                 <Button variant="outline" onClick={() => auth && signOut(auth)}>Logout</Button>
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
        {isAdmin && <AiUsageIndicator settings={settings} usage={usage} isLoading={isAiLoading} />}
        <UserNav user={mergedUser} />
      </div>
    </header>
  );
}

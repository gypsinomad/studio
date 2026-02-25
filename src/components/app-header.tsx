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
import { PWAInstallButton } from './pwa-install-button';

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
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      );
    }

    if (!mergedUser) {
      return (
        <div className="flex items-center gap-3">
          <p className="text-sm text-destructive hidden sm:block">Could not load profile</p>
          <Button variant="outline" size="sm" onClick={() => auth && signOut(auth)}>Logout</Button>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-4">
        <PWAInstallButton />
        {isAdmin && <AiUsageIndicator settings={settings} usage={usage} isLoading={isAiLoading} />}
        <div className="h-8 w-[1px] bg-stone-200 hidden sm:block" />
        <UserNav user={mergedUser} />
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-stone-200/60 shadow-sm">
      <div className="px-4 sm:px-8 flex h-20 items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div className="hidden sm:block">
                 <h2 className="text-xl font-headline font-bold text-stone-900 leading-tight">SpiceRoute</h2>
                 <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Global Mercantile</p>
            </div>
        </div>
        <div className="ml-auto">
          {renderHeaderContent()}
        </div>
      </div>
    </header>
  );
}
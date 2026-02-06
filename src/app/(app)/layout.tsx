'use client';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If auth state is determined and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  // While checking auth or if there is no user (and redirect is imminent),
  // show a loader within the main content area.
  if (isUserLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated, render the page content.
  return <>{children}</>;
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  // This layout now immediately renders the app shell, including sidebar and header.
  // The AuthGuard will handle the loading/auth state for the main content area.
  return (
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <AppHeader />
          <main className="p-4 lg:p-6 overflow-y-auto">
            <AuthGuard>
                {children}
            </AuthGuard>
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}

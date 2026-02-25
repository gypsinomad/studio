'use client';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-2xl">
          <AppSidebar />
        </Sidebar>
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 lg:p-8 animate-in fade-in duration-500">
            <AuthGuard>
                <ErrorBoundary>
                    {children}
                </ErrorBoundary>
            </AuthGuard>
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}

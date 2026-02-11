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
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
      <SidebarProvider>
        <Sidebar collapsible="icon" className="bg-white/80 backdrop-blur-xl border-r border-stone-200">
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <AppHeader />
          <main className="p-4 lg:p-8 overflow-y-auto animate-in fade-in duration-500">
            <AuthGuard>
                {children}
            </AuthGuard>
          </main>
        </SidebarInset>
      </SidebarProvider>
  );
}

'use client';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Building } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-current-user';

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
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isLoading, hasCompany } = useCurrentUser();
  
  if (isLoading) {
     return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <AppHeader />
          <main className="p-4 lg:p-6 overflow-y-auto">
            {!hasCompany && (
               <Alert className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
                  <Building className="h-4 w-4 !text-yellow-800" />
                  <AlertTitle>Welcome to SpiceRoute CRM!</AlertTitle>
                  <AlertDescription>
                    To get started, you need to create a company profile. This will be the central hub for all your CRM data. 
                    <Link href="/companies" className="font-bold underline ml-2">Go to Companies</Link>
                  </AlertDescription>
                </Alert>
            )}
            {children}
            </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { LoaderCircle, Sprout, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Splash screen and main entry point.
 * Redirects authenticated users to the dashboard or shows a landing page for staff.
 */
export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  // Handle server-side rendering or initial loading state
  if (!mounted || isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center flex flex-col items-center gap-4">
          <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-stone-600 animate-pulse">Initializing SpiceRoute CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-3xl shadow-xl shadow-spice-100">
            <Sprout className="h-16 w-16 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold text-stone-900 tracking-tight">SpiceRoute CRM</h1>
          <p className="text-stone-500 font-medium italic">Global Mercantile Intelligence</p>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <p className="text-stone-600 leading-relaxed text-sm">
            Welcome to the internal trade management portal. Access real-time shipment tracking, lead pipelines, and logistics compliance tools.
          </p>
          
          <div className="grid gap-3">
            <Button asChild className="w-full h-12 rounded-xl text-base font-bold shadow-spice-200">
              <Link href="/login">
                Sign In to Workspace <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full h-12 rounded-xl text-base font-bold border-stone-200">
              <Link href="/signup">Register Staff Account</Link>
            </Button>
          </div>
        </div>

        <div className="pt-4">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.3em]">
            Calicut Traders • Since 2026
          </p>
        </div>
      </div>
    </div>
  );
}

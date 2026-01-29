'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { LoaderCircle } from 'lucide-react';


export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
        if (user) {
            router.replace('/dashboard');
        } else {
            router.replace('/login');
        }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center flex flex-col items-center gap-4">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading SpiceRoute CRM...</p>
      </div>
    </div>
  );
}

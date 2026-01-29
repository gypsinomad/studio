'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// For this example, we'll simulate a logged-in user.
// In a real app, you'd check for an active session.
const FAKE_LOGGED_IN = true;

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (FAKE_LOGGED_IN) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-lg">Loading SpiceRoute CRM...</p>
      </div>
    </div>
  );
}

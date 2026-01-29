import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import type { User, AISettings, AIUsageStats } from '@/lib/types';
import { MOCK_USERS } from '@/lib/data';
import { AiUsageIndicator } from './ai-usage-indicator';
import { adminDb } from '@/firebase/admin';
import { getMonthKey } from '@/lib/utils';
import { unstable_noStore as noStore } from 'next/cache';

async function getAiStatus() {
  noStore();
  try {
    const settingsDoc = await adminDb.doc('settings/ai').get();
    const usageDoc = await adminDb.doc(`usageStats/${getMonthKey()}`).get();

    const settings = settingsDoc.exists ? (settingsDoc.data() as AISettings) : null;
    const usage = usageDoc.exists ? (usageDoc.data() as AIUsageStats) : null;
    
    return { settings, usage };
  } catch (error) {
    console.error("Error fetching AI status from Firestore:", error);
    // In a production environment, you'd want to log this to a proper monitoring service.
    // Returning nulls to allow the UI to render gracefully without this data.
    return { settings: null, usage: null };
  }
}

export async function AppHeader() {
  // In a real app, this would come from an auth context/hook
  const user: User | undefined = MOCK_USERS.find(u => u.role === 'admin');
  const { settings, usage } = await getAiStatus();

  if (!user) {
    // Handle case where user is not found, maybe redirect to login
    return null;
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
        <AiUsageIndicator settings={settings} usage={usage} />
        <UserNav user={user} />
      </div>
    </header>
  );
}

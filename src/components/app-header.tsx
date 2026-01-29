import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import type { User, AISettings, AIUsageStats } from '@/lib/types';
import { MOCK_USERS } from '@/lib/data';
import { AiUsageIndicator } from './ai-usage-indicator';
import { adminDb } from '@/firebase/admin';
import { getMonthKey } from '@/lib/utils';
import { unstable_noStore as noStore } from 'next/cache';

type AiStatusResult = {
  settings: AISettings | null;
  usage: AIUsageStats | null;
};

async function getAiStatus(): Promise<AiStatusResult> {
  noStore();

  if (!adminDb) {
    console.warn(
      "Firebase Admin is not available. AI status will not be fetched."
    );
    return { settings: null, usage: null };
  }

  try {
    // Extra guard so NOT_FOUND or weird Firestore errors never crash SSR
    const settingsDoc = await adminDb.doc("settings/ai").get().catch(err => {
      console.warn("Failed to read settings/ai:", err instanceof Error ? err.message : err);
      return null;
    });

    const usageDoc = await adminDb
      .doc(`usageStats/${getMonthKey()}`)
      .get()
      .catch(err => {
        console.warn("Failed to read usageStats doc:", err instanceof Error ? err.message : err);
        return null;
      });

    const settings =
      settingsDoc && settingsDoc.exists
        ? (settingsDoc.data() as AISettings)
        : null;

    const usage =
      usageDoc && usageDoc.exists
        ? (usageDoc.data() as AIUsageStats)
        : null;

    return { settings, usage };
  } catch (error) {
    console.warn("Error fetching AI status from Firestore:", error instanceof Error ? error.message : error);
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

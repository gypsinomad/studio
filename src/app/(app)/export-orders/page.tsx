import { PageHeader } from '@/components/page-header';
import { ExportOrderForm } from './components/export-order-form';
import { adminDb } from '@/firebase/admin';
import type { AISettings } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';

async function getAiSettings(): Promise<AISettings> {
  noStore();
  
  if (!adminDb) {
    console.warn("Firebase Admin is not available. Using default AI settings.");
    return {
      aiMode: 'safe',
      monthlyAiBudgetInr: 200,
      maxDailyAiCalls: 200,
    };
  }

  try {
    const settingsDoc = await adminDb.doc('settings/ai').get();
    if (settingsDoc.exists) {
      return settingsDoc.data() as AISettings;
    }
  } catch (error) {
    console.warn("Could not fetch AI settings from Firestore. This is expected in a local environment without credentials. Using default settings.", error instanceof Error ? error.message : error);
    // Fallback to default settings on error.
  }
  
  // Return default settings if document doesn't exist or an error occurs.
  return {
    aiMode: 'safe',
    monthlyAiBudgetInr: 200,
    maxDailyAiCalls: 200,
  };
}


export default async function ExportOrdersPage() {
  const aiSettings = await getAiSettings();

  return (
    <>
      <PageHeader
        title="New Export Order"
        description="Create a new export order and run AI compliance checks."
      />
      <ExportOrderForm aiSettings={aiSettings} />
    </>
  );
}

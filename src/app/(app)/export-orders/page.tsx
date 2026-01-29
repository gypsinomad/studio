import { PageHeader } from '@/components/page-header';
import { ExportOrderForm } from './components/export-order-form';
import { adminDb } from '@/firebase/admin';
import type { AISettings } from '@/lib/types';
import { unstable_noStore as noStore } from 'next/cache';

async function getAiSettings(): Promise<AISettings> {
  noStore();
  try {
    const settingsDoc = await adminDb.doc('settings/ai').get();
    if (settingsDoc.exists) {
      return settingsDoc.data() as AISettings;
    }
  } catch (error) {
    console.error("Error fetching AI settings from Firestore:", error);
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

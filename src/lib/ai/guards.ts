// src/lib/ai/guards.ts
import 'server-only';
import { adminDb } from '@/firebase/admin';
import { AISettings, AIUsageStats } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { getMonthKey, getDayKey, getTodaysDateKey } from '@/lib/utils';

const AI_SETTINGS_DOC_PATH = 'settings/ai';
const AI_USAGE_DOC_PATH = `usageStats/${getMonthKey()}`;
const COST_PER_AI_CALL_INR = 0.05; // Simplified approximation

/**
 * Checks if an AI call can proceed based on settings and usage, and updates usage stats.
 * This function should be called within a Genkit flow or server-side function.
 * @returns {Promise<{canProceed: boolean, reason: 'ok' | 'aiDisabled' | 'budgetOrQuotaExceeded'}>}
 */
export async function checkAiBudgetAndProceed() {
  if (!adminDb) {
    throw new Error("Firebase Admin SDK is not initialized. Cannot perform AI budget check.");
  }

  const settingsDoc = await adminDb.doc(AI_SETTINGS_DOC_PATH).get();
  const usageDoc = await adminDb.doc(AI_USAGE_DOC_PATH).get();

  const settings: AISettings = (settingsDoc.exists
    ? settingsDoc.data()
    : {
        aiMode: 'safe',
        monthlyAiBudgetInr: 200,
        maxDailyAiCalls: 200,
      }) as AISettings;

  if (settings.aiMode === 'off') {
    return { canProceed: false, reason: 'aiDisabled' as const };
  }

  if (settings.aiMode === 'safe') {
    const usage = (usageDoc.exists
      ? usageDoc.data()
      : {
          estimatedSpendThisMonthInr: 0,
          dailyCalls: {},
        }) as AIUsageStats;

    const todayCalls = usage.dailyCalls?.[getTodaysDateKey()] || 0;

    if (
      usage.estimatedSpendThisMonthInr >= settings.monthlyAiBudgetInr ||
      todayCalls >= settings.maxDailyAiCalls
    ) {
      return { canProceed: false, reason: 'budgetOrQuotaExceeded' as const };
    }
  }
  
  // If proceed, update stats in a transaction
  try {
    await adminDb.runTransaction(async (transaction) => {
        const currentUsageDoc = await transaction.get(adminDb.doc(AI_USAGE_DOC_PATH));
        const dayKey = getTodaysDateKey();

        if (!currentUsageDoc.exists) {
             transaction.set(adminDb.doc(AI_USAGE_DOC_PATH), {
                monthKey: getMonthKey(),
                totalCallsMonth: 1,
                estimatedSpendThisMonthInr: COST_PER_AI_CALL_INR,
                dailyCalls: { [dayKey]: 1 },
                lastUpdatedAt: FieldValue.serverTimestamp(),
            });
        } else {
            transaction.update(adminDb.doc(AI_USAGE_DOC_PATH), {
                totalCallsMonth: FieldValue.increment(1),
                estimatedSpendThisMonthInr: FieldValue.increment(COST_PER_AI_CALL_INR),
                [`dailyCalls.${dayKey}`]: FieldValue.increment(1),
                lastUpdatedAt: FieldValue.serverTimestamp(),
            });
        }
    });
  } catch (e) {
      console.error("Error updating AI usage stats:", e instanceof Error ? e.message : e);
      // Decide if you want to proceed even if stats update fails. For now, we will.
  }

  return { canProceed: true, reason: 'ok' as const };
}

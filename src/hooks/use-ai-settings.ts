'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { AISettings, AIUsageStats } from '@/lib/types';
import { getMonthKey } from '@/lib/utils';
import { useCurrentUser } from './use-current-user';
import { useEffect, useState } from 'react';

// Default AI settings for auto-creation
const defaultAISettings: Omit<AISettings, 'id'> = {
    aiMode: 'safe',
    monthlyAiBudgetInr: 200,
    maxDailyAiCalls: 200,
};


export function useAISettings() {
    const firestore = useFirestore();
    const { isAdmin, isLoading: isUserLoading } = useCurrentUser();
    const [isCreating, setIsCreating] = useState(false);

    const settingsDocRef = useMemoFirebase(() => {
        if (!firestore) return null;
        // The settings document is always at a fixed path
        return doc(firestore, 'settings', 'ai');
    }, [firestore]);

    const usageDocRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'usageStats', getMonthKey());
    }, [firestore]);

    const { data: settings, isLoading: isLoadingSettings, error: settingsError } = useDoc<AISettings>(settingsDocRef);
    const { data: usage, isLoading: isLoadingUsage } = useDoc<AIUsageStats>(usageDocRef);
    
    const isLoading = isUserLoading || isLoadingSettings || isLoadingUsage || isCreating;

    useEffect(() => {
        // Condition to auto-create the settings document
        const shouldCreate = isAdmin && !isLoadingSettings && !settings && !isCreating && !settingsError;

        if (shouldCreate && settingsDocRef) {
            const createSettings = async () => {
                setIsCreating(true);
                console.log("AI Settings document not found. Creating with defaults...");
                try {
                    await setDoc(settingsDocRef, defaultAISettings);
                    console.log("Successfully created AI settings document.");
                } catch (error) {
                    console.error("Failed to auto-create AI settings:", error);
                } finally {
                    setIsCreating(false);
                }
            };
            createSettings();
        }
    }, [isAdmin, isLoadingSettings, settings, settingsDocRef, isCreating, settingsError]);


    return {
        settings,
        usage,
        isLoading,
    }
}

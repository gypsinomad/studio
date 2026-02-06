'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { AISettings, AIUsageStats } from '@/lib/types';
import { getMonthKey } from '@/lib/utils';
import { useCurrentUser } from './use-current-user';

export function useAISettings() {
    const firestore = useFirestore();
    const { isAdmin, isLoading: isUserLoading } = useCurrentUser();

    const settingsDocRef = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return doc(firestore, 'settings', 'ai');
    }, [firestore, isAdmin]);

    const usageDocRef = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return doc(firestore, 'usageStats', getMonthKey());
    }, [firestore, isAdmin]);

    const { data: settings, isLoading: isLoadingSettings } = useDoc<AISettings>(settingsDocRef);
    const { data: usage, isLoading: isLoadingUsage } = useDoc<AIUsageStats>(usageDocRef);
    
    return {
        settings,
        usage,
        isLoading: isUserLoading || (isAdmin && (isLoadingSettings || isLoadingUsage)),
    }
}

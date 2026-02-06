'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import type { AISettings, AIUsageStats } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AiSettingsCardProps {
    settings: AISettings | null;
    usage: AIUsageStats | null;
    isLoading: boolean;
}

export function AiSettingsCard({ settings, usage, isLoading }: AiSettingsCardProps) {

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>AI Settings</CardTitle>
                    <CardDescription>Configure AI mode, budget, and usage limits.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-full" />
                </CardContent>
            </Card>
        )
    }

    // Since the document is now auto-created, we can assume it will exist soon after loading.
    // A null state here indicates it's either still loading or there was a permission error fetching.
    if (!settings) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>AI Settings</CardTitle>
                    <CardDescription>Configure AI mode, budget, and usage limits.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Alert variant="destructive">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Could Not Load AI Settings</AlertTitle>
                        <AlertDescription>
                            There was an error loading the AI configuration. Please check the console or Firestore permissions.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    const spend = usage?.estimatedSpendThisMonthInr || 0;
    const progress = Math.min((spend / settings.monthlyAiBudgetInr) * 100, 100);
    const modeColors = {
        off: "text-red-500",
        safe: "text-green-500",
        unrestricted: "text-amber-500",
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Settings</CardTitle>
                <CardDescription>Configure AI mode, budget, and usage limits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="font-medium">Current Mode</span>
                    <span className={cn("font-bold capitalize", modeColors[settings.aiMode])}>
                        {settings.aiMode}
                    </span>
                </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span>Monthly Usage</span>
                        <span className="text-muted-foreground">
                        ₹{spend.toFixed(2)} / ₹{settings.monthlyAiBudgetInr}
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Daily Call Limit</span>
                    <span className="text-muted-foreground">
                        {usage?.dailyCalls?.[new Date().getDate().toString().padStart(2, '0')] || 0} / {settings.maxDailyAiCalls}
                    </span>
                </div>
                 <Alert variant="destructive">
                    <AlertDescription>
                        Editing these settings from the UI is not yet implemented. Please update the 'settings/ai' document in the Firebase Console directly.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
}

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

    if (!settings) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>AI Settings</CardTitle>
                    <CardDescription>Configure AI mode, budget, and usage limits.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Configuration Required</AlertTitle>
                        <AlertDescription>
                            <p>To manage AI settings, create a document in Firestore:</p>
                            <code className="text-xs relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold">
                                settings/ai
                            </code>
                             <p className="mt-2">Required fields:</p>
                            <ul className="list-disc list-inside text-xs">
                                <li>`aiMode` (string: "safe", "off", or "unrestricted")</li>
                                <li>`monthlyAiBudgetInr` (number)</li>
                                <li>`maxDailyAiCalls` (number)</li>
                            </ul>
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

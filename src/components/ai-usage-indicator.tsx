// This component is not yet implemented with live data
// as it would require a full client-side Firebase setup.
// For now, it displays static information based on server-rendered props.
'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Circle } from 'lucide-react';
import type { AISettings, AIUsageStats } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AIUsageIndicatorProps {
  settings: AISettings | null;
  usage: AIUsageStats | null;
}

export function AiUsageIndicator({ settings, usage }: AIUsageIndicatorProps) {
  if (!settings || !usage) {
    return (
      <span className="text-xs text-muted-foreground">
        AI usage unavailable
      </span>
    );
  }

  const { aiMode, monthlyAiBudgetInr } = settings;
  const spend = usage.estimatedSpendThisMonthInr || 0;
  const progress = Math.min((spend / monthlyAiBudgetInr) * 100, 100);

  const modeColors = {
    off: "bg-red-500",
    safe: "bg-green-500",
    unrestricted: "bg-amber-500",
  } as const;

  const modeText = {
    off: "AI is Off",
    safe: "Safe Mode",
    unrestricted: "Unrestricted",
  } as const;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium">AI Status</span>
            <Circle
              className={cn("h-3 w-3 fill-current", modeColors[aiMode])}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-64 p-3" side="bottom" align="end">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-sm">{modeText[aiMode]}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {aiMode}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {aiMode === "off" && "All AI features are disabled."}
              {aiMode === "safe" &&
                "AI calls will be blocked if budget or daily limits are exceeded."}
              {aiMode === "unrestricted" &&
                "AI calls may incur charges beyond the set budget."}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Monthly Budget</span>
                <span>
                  ₹{spend.toFixed(2)} / ₹{monthlyAiBudgetInr}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

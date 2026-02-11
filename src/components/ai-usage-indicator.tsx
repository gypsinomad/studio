'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import type { AISettings, AIUsageStats } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface AIUsageIndicatorProps {
  settings: AISettings | null;
  usage: AIUsageStats | null;
  isLoading: boolean;
}

export function AiUsageIndicator({ settings, usage, isLoading }: AIUsageIndicatorProps) {
  if (isLoading) {
    return <Skeleton className="h-8 w-24" />;
  }

  const mode = settings?.aiMode || 'safe';
  const budget = settings?.monthlyAiBudgetInr || 200;
  const spend = usage?.estimatedSpendThisMonthInr || 0;
  const progress = Math.min((spend / budget) * 100, 100);

  const modeColors = {
    off: "bg-red-500",
    safe: "bg-emerald-500",
    unrestricted: "bg-amber-500",
  } as const;

  const textColors = {
      off: "text-red-700",
      safe: "text-cardamom-700",
      unrestricted: "text-amber-700",
  } as const;

  const bgColors = {
      off: "bg-red-50",
      safe: "bg-cardamom-50",
      unrestricted: "bg-amber-50",
  } as const;

  const borderColors = {
      off: "border-red-200",
      safe: "border-cardamom-200",
      unrestricted: "border-amber-200",
  } as const;

  const modeText = {
    off: "AI is Off",
    safe: "AI Active",
    unrestricted: "Unrestricted",
  } as const;

  return (
     <div className={cn("flex items-center space-x-2 px-3 py-1.5 rounded-full border", bgColors[mode], borderColors[mode])}>
        <div className={cn("w-2 h-2 rounded-full", modeColors[mode], mode === 'safe' && 'animate-pulse')} />
        <span className={cn("text-xs font-medium", textColors[mode])}>{modeText[mode]}</span>
      </div>
  );
}

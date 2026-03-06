"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface AppSegmentErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppSegmentError({ error, reset }: AppSegmentErrorProps) {
  return (
    <div className="flex h-[calc(100vh-5rem)] items-center justify-center px-4">
      <Card className="w-full max-w-xl border-slate-200 shadow-2xl">
        <CardHeader>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Module error
          </div>
          <CardTitle className="mt-3 text-2xl font-headline text-slate-900">
            This part of the workspace failed to load
          </CardTitle>
          <CardDescription className="text-slate-500">
            The rest of SpiceRoute remains healthy. You can retry just this
            screen without leaving your current session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error?.message && (
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">
                Technical detail
              </p>
              <p className="text-xs font-mono text-slate-700 line-clamp-3">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-emerald-50 font-semibold"
              onClick={reset}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry module
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


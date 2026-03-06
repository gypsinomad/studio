"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_#1a3c2f,_#020617)] flex items-center justify-center px-4">
        <Card className="max-w-lg w-full border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl shadow-emerald-900/40">
          <CardHeader className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
              <AlertTriangle className="h-4 w-4" />
              Failure in trade console
            </div>
            <CardTitle className="text-2xl font-headline text-slate-50">
              Something slipped through the spice line
            </CardTitle>
            <CardDescription className="text-slate-400">
              An unexpected error occurred while loading SpiceRoute CRM. Our
              systems have safely paused this view so your data stays intact.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error?.message && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">
                  Technical detail
                </p>
                <p className="text-xs font-mono text-slate-300 line-clamp-3">
                  {error.message}
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-emerald-50 font-semibold"
                onClick={reset}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry this screen
              </Button>
              <Button
                variant="outline"
                asChild
                className="flex-1 h-11 rounded-xl border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-900"
              >
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Back to dashboard
                </Link>
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              If this keeps happening, share a screenshot with your engineering
              team so they can trace the failing route and Firestore operation.
            </p>
          </CardContent>
        </Card>
      </body>
    </html>
  );
}


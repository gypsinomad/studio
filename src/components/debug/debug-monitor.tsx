'use client';

import React, { useState, useEffect, useRef } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { DebugLog, AITrace } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Terminal, 
  Bug, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  AlertCircle, 
  BrainCircuit, 
  ShieldAlert,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type Tab = 'logs' | 'permissions' | 'ai';

export function DebugMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('logs');
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [permissionErrors, setPermissionErrors] = useState<FirestorePermissionError[]>([]);
  const [aiTraces, setAiTraces] = useState<AITrace[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-show on serious errors
  useEffect(() => {
    const handlePermissionError = (err: FirestorePermissionError) => {
      setPermissionErrors(prev => [err, ...prev].slice(0, 50));
      setIsOpen(true);
      setIsMinimized(false);
      setActiveTab('permissions');
    };

    const handleLog = (log: DebugLog) => {
      setLogs(prev => [log, ...prev].slice(0, 100));
      if (log.level === 'error') {
        setIsOpen(true);
        setIsMinimized(false);
      }
    };

    const handleTrace = (trace: AITrace) => {
      setAiTraces(prev => [trace, ...prev].slice(0, 50));
    };

    errorEmitter.on('permission-error', handlePermissionError);
    errorEmitter.on('debug-log', handleLog);
    errorEmitter.on('ai-trace', handleTrace);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
      errorEmitter.off('debug-log', handleLog);
      errorEmitter.off('ai-trace', handleTrace);
    };
  }, []);

  const clearAll = () => {
    setLogs([]);
    setPermissionErrors([]);
    setAiTraces([]);
  };

  // Only render in dev mode or for logged-in users (you can add a role check here)
  if (process.env.NODE_ENV !== 'development' && !isOpen) return null;

  if (!isOpen) {
    return (
      <Button 
        variant="secondary" 
        size="icon" 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] rounded-full shadow-2xl border-2 border-indigo-200 animate-pulse"
      >
        <Bug className="size-5 text-indigo-600" />
      </Button>
    );
  }

  return (
    <div className={cn(
      "fixed right-4 z-[9999] flex flex-col transition-all duration-300 shadow-2xl border-2 border-slate-200 bg-white rounded-2xl overflow-hidden",
      isMinimized ? "bottom-4 w-80 h-14" : "bottom-4 w-[600px] h-[500px]"
    )}>
      {/* HEADER */}
      <div className="flex items-center justify-between p-3 bg-slate-900 text-white cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2">
          <Terminal className="size-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-widest">SpiceRoute Debugger</span>
          {!isMinimized && (
            <div className="flex gap-1 ml-4">
              {permissionErrors.length > 0 && <Badge className="bg-red-500 h-4 text-[10px] px-1">{permissionErrors.length}</Badge>}
              {logs.filter(l => l.level === 'error').length > 0 && <Badge className="bg-amber-500 h-4 text-[10px] px-1">!</Badge>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={(e) => { e.stopPropagation(); clearAll(); }}><Trash2 className="size-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
            {isMinimized ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}><X className="size-4" /></Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* TABS */}
          <div className="flex border-b bg-slate-50">
            {(['logs', 'permissions', 'ai'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
                  activeTab === tab ? "bg-white text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* CONTENT */}
          <ScrollArea className="flex-1 bg-slate-50/50 p-4">
            {activeTab === 'logs' && (
              <div className="space-y-2">
                {logs.length === 0 ? <EmptyState icon={Search} label="No logs captured" /> : logs.map(log => (
                  <div key={log.id} className="text-[11px] font-mono p-2 rounded border bg-white border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "font-bold uppercase px-1 rounded",
                        log.level === 'error' ? "bg-red-100 text-red-700" : 
                        log.level === 'warn' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>{log.level}</span>
                      <span className="text-slate-400">{format(log.timestamp, 'HH:mm:ss.SSS')}</span>
                    </div>
                    <span className="text-indigo-600 font-bold">[{log.module}]</span> {log.message}
                    {log.data && <pre className="mt-1 p-1 bg-slate-100 rounded overflow-x-auto text-[10px]">{JSON.stringify(log.data, null, 2)}</pre>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-4">
                {permissionErrors.length === 0 ? <EmptyState icon={ShieldAlert} label="No security rule violations" /> : permissionErrors.map((err, i) => (
                  <Card key={i} className="border-red-200 bg-red-50/30">
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="size-3" /> Rule Denied: {err.request.method}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="text-[10px] font-mono space-y-1">
                        <p><span className="text-slate-500">Path:</span> {err.request.path}</p>
                        <p><span className="text-slate-500">User:</span> {err.request.auth?.uid || 'Unauthenticated'}</p>
                        {err.request.resource && (
                          <pre className="mt-2 p-2 bg-white rounded border border-red-100 overflow-x-auto">
                            {JSON.stringify(err.request.resource.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-3">
                {aiTraces.length === 0 ? <EmptyState icon={BrainCircuit} label="No GenAI flows traced" /> : aiTraces.map(trace => (
                  <div key={trace.id} className="p-3 rounded-xl border bg-white shadow-sm border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">{trace.flowName}</span>
                      <Badge variant={trace.status === 'completed' ? 'success' : (trace.status === 'failed' ? 'destructive' : 'outline')} className="text-[10px]">
                        {trace.status}
                      </Badge>
                    </div>
                    {trace.input && (
                      <div className="mt-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Input</p>
                        <pre className="text-[10px] p-1 bg-slate-50 rounded truncate">{JSON.stringify(trace.input)}</pre>
                      </div>
                    )}
                    {trace.output && (
                      <div className="mt-2">
                        <p className="text-[9px] font-bold text-emerald-500 uppercase">Output</p>
                        <pre className="text-[10px] p-1 bg-emerald-50 rounded whitespace-pre-wrap">{JSON.stringify(trace.output, null, 2)}</pre>
                      </div>
                    )}
                    {trace.error && <p className="text-[10px] text-red-600 mt-2 font-mono">{trace.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-50">
      <Icon className="size-10 mb-2" />
      <p className="text-xs font-bold uppercase tracking-widest">{label}</p>
    </div>
  );
}

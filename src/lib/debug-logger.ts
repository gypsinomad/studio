'use client';

import { errorEmitter } from '@/firebase/error-emitter';
import type { LogLevel, DebugLog, AITrace } from './types';

/**
 * A central utility for application-wide debugging.
 * Emits events that are captured by the DebugMonitor UI.
 */
export const debugLogger = {
  log: (module: string, message: string, level: LogLevel = 'info', data?: any) => {
    const log: DebugLog = {
      id: Math.random().toString(36).substring(7),
      level,
      module,
      message,
      data,
      timestamp: new Date(),
    };

    // Always log to console in dev
    if (process.env.NODE_ENV === 'development') {
      const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
      console.log(`${color}[${module}] [${level.toUpperCase()}] ${message}\x1b[0m`, data || '');
    }

    errorEmitter.emit('debug-log', log);
  },

  traceAI: (flowName: string, status: AITrace['status'], payload: { input?: any; output?: any; error?: string }) => {
    const trace: AITrace = {
      id: Math.random().toString(36).substring(7),
      flowName,
      status,
      ...payload,
      timestamp: new Date(),
    };

    errorEmitter.emit('ai-trace', trace);
    
    // Also create a debug log for the trace
    debugLogger.log('AI_ENGINE', `${flowName} ${status}`, status === 'failed' ? 'error' : 'debug', payload);
  }
};

'use client';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class AuthLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Log session start
    this.log('AUTH', 'Authentication session started', 'info', {
      sessionId: this.sessionId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      timestamp: new Date().toISOString(),
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log info, warn, and error
    if (process.env.NODE_ENV === 'production') {
      return level !== 'debug';
    }
    return true;
  }

  private createLogEntry(
    category: string,
    message: string,
    level: LogLevel,
    data?: any
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      sessionId: this.sessionId,
    };

    // Add user ID if available
    if (typeof window !== 'undefined' && (window as any).currentUser) {
      entry.userId = (window as any).currentUser.uid;
    }

    return entry;
  }

  private storeLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In development, also log to console
    if (process.env.NODE_ENV !== 'production') {
      const consoleMethod = entry.level === 'error' ? 'error' :
                          entry.level === 'warn' ? 'warn' :
                          entry.level === 'info' ? 'info' : 'log';
      
      console[consoleMethod](`[${entry.category}] ${entry.message}`, entry.data || '');
    }
  }

  log(category: string, message: string, level: LogLevel = 'info', data?: any) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(category, message, level, data);
    this.storeLog(entry);

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production' && level !== 'debug') {
      this.sendToExternalService(entry);
    }
  }

  debug(category: string, message: string, data?: any) {
    this.log(category, message, 'debug', data);
  }

  info(category: string, message: string, data?: any) {
    this.log(category, message, 'info', data);
  }

  warn(category: string, message: string, data?: any) {
    this.log(category, message, 'warn', data);
  }

  error(category: string, message: string, data?: any) {
    this.log(category, message, 'error', data);
  }

  // Authentication-specific logging methods
  logAuthStart(email: string) {
    this.info('AUTH', 'Authentication started', { email });
  }

  logAuthSuccess(user: any) {
    this.info('AUTH', 'Authentication successful', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
    });
  }

  logAuthError(error: any, context?: string) {
    this.error('AUTH', 'Authentication failed', {
      code: error.code,
      message: error.message,
      context,
    });
  }

  logTokenRefresh(success: boolean, error?: any) {
    if (success) {
      this.debug('AUTH', 'Token refreshed successfully');
    } else {
      this.error('AUTH', 'Token refresh failed', {
        message: error?.message,
        code: error?.code,
      });
    }
  }

  logProfileCreation(userEmail: string, success: boolean, error?: any) {
    if (success) {
      this.info('PROFILE', 'User profile created', { userEmail });
    } else {
      this.error('PROFILE', 'User profile creation failed', {
        userEmail,
        message: error?.message,
      });
    }
  }

  logFirestoreOperation(operation: string, path: string, success: boolean, error?: any) {
    const category = 'FIRESTORE';
    if (success) {
      this.debug(category, `Firestore ${operation} successful`, { path });
    } else {
      this.error(category, `Firestore ${operation} failed`, {
        path,
        message: error?.message,
        code: error?.code,
      });
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    try {
      // Send to your logging service (e.g., Sentry, LogRocket, custom endpoint)
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('Auth Log', {
          level: entry.level,
          category: entry.category,
          message: entry.message,
          data: entry.data,
          timestamp: entry.timestamp,
        });
      }

      // Or send to custom endpoint
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  // Get logs for debugging
  getLogs(level?: LogLevel, category?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (category && log.category !== category) return false;
      return true;
    });
  }

  // Export logs for analysis
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Get session summary
  getSessionSummary() {
    const authLogs = this.getLogs(undefined, 'AUTH');
    const errorLogs = this.getLogs('error');
    
    return {
      sessionId: this.sessionId,
      startTime: this.logs[0]?.timestamp,
      totalLogs: this.logs.length,
      authEvents: authLogs.length,
      errors: errorLogs.length,
      lastActivity: this.logs[this.logs.length - 1]?.timestamp,
    };
  }
}

// Create singleton instance
export const authLogger = new AuthLogger();

// Export convenience functions
export const logAuthStart = (email: string) => authLogger.logAuthStart(email);
export const logAuthSuccess = (user: any) => authLogger.logAuthSuccess(user);
export const logAuthError = (error: any, context?: string) => authLogger.logAuthError(error, context);
export const logTokenRefresh = (success: boolean, error?: any) => authLogger.logTokenRefresh(success, error);
export const logProfileCreation = (userEmail: string, success: boolean, error?: any) => 
  authLogger.logProfileCreation(userEmail, success, error);
export const logFirestoreOperation = (operation: string, path: string, success: boolean, error?: any) => 
  authLogger.logFirestoreOperation(operation, path, success, error);

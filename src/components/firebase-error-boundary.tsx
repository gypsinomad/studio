'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class FirebaseErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeouts: number[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[FirebaseErrorBoundary] Error caught:', error, errorInfo);
    
    // Log to external service if available
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Firebase Error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }

    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Attempt automatic recovery for certain error types
    this.attemptAutoRecovery(error);
  }
  
  private attemptAutoRecovery = (error: Error) => {
    // Check if it's a network-related error that might resolve itself
    const isNetworkError = error.message.includes('network') || 
                          error.message.includes('connection') ||
                          error.message.includes('timeout');
    
    const isFirebaseError = error.message.includes('firebase') || 
                           error.name === 'FirebaseError';
    
    // For network or Firebase errors, attempt a delayed retry
    if ((isNetworkError || isFirebaseError) && this.state.retryCount < this.maxRetries) {
      console.log('[FirebaseErrorBoundary] Attempting automatic recovery for:', error.message);
      
      const recoveryDelay = 5000; // 5 seconds for auto-recovery
      const timeout = window.setTimeout(() => {
        if (this.state.hasError && this.state.retryCount < this.maxRetries) {
          console.log('[FirebaseErrorBoundary] Executing automatic recovery');
          this.handleRetry();
        }
      }, recoveryDelay);
      
      this.retryTimeouts.push(timeout);
    }
  };

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      console.warn('[FirebaseErrorBoundary] Max retries reached');
      return;
    }

    const retryDelay = Math.pow(2, this.state.retryCount) * 1000; // Exponential backoff
    
    const timeout = window.setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
      
      // Call custom retry handler if provided
      if (this.props.onRetry) {
        this.props.onRetry();
      }
    }, retryDelay);

    this.retryTimeouts.push(timeout);
  };

  handleReset = () => {
    // Clear any pending retries
    this.retryTimeouts.forEach(timeout => window.clearTimeout(timeout));
    this.retryTimeouts = [];
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
    
    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  componentWillUnmount() {
    // Clean up any pending timeouts
    this.retryTimeouts.forEach(timeout => window.clearTimeout(timeout));
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Firebase Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Something went wrong with the Firebase connection. This might be a temporary issue.
              </p>
              
              {this.state.error && (
                <div className="bg-muted p-3 rounded">
                  <p className="text-xs font-mono text-destructive">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRetry}
                  disabled={this.state.retryCount >= this.maxRetries}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry {this.state.retryCount > 0 && `(${this.state.retryCount}/${this.maxRetries})`}
                </Button>
                
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>

              {this.state.retryCount >= this.maxRetries && (
                <p className="text-xs text-muted-foreground">
                  Maximum retry attempts reached. Please refresh the page or contact support if the issue persists.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withFirebaseErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <FirebaseErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </FirebaseErrorBoundary>
  );

  WrappedComponent.displayName = `withFirebaseErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

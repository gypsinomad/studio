'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center p-4">
            <Card className="w-[420px] text-center">
                <CardHeader>
                    <CardTitle>Something went wrong</CardTitle>
                    <CardDescription>
                        An unexpected client-side error occurred.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <pre className="text-xs text-left whitespace-pre-wrap p-2 bg-muted rounded-md text-muted-foreground">
                        {this.state.error?.message || 'No error message available.'}
                    </pre>
                    <Button onClick={() => window.location.reload()}>
                        Reload Page
                    </Button>
                </CardContent>
            </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
